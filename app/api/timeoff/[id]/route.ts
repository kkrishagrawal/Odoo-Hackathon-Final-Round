import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// PATCH /api/timeoff/[id] — Approve or reject a time-off request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessionUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { role: true, companyId: true },
    });

    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: requestId } = await params;
    const body = await req.json();
    const { status, type, startDate, endDate, days, attachmentUrl } = body;

    // Verify the request belongs to same company
    const existingRequest = await prisma.timeOffRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { companyId: true, id: true, role: true } } },
    });

    if (!existingRequest || existingRequest.user.companyId !== sessionUser.companyId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // 1. APPROVE/REJECT Logic (Admin/HR/Payroll)
    if (status) {
      if (sessionUser.role === "EMPLOYEE") {
        return NextResponse.json({ error: "Only Admin/HR/Payroll can approve/reject" }, { status: 403 });
      }
      
      if (!["APPROVED", "REJECTED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      // Role-based approval rules:
      const requesterRole = existingRequest.user.role;
      if (
        (requesterRole === "HR_OFFICER" || requesterRole === "PAYROLL_OFFICER") &&
        sessionUser.role !== "ADMIN"
      ) {
        return NextResponse.json(
          { error: "Only Admin can approve/reject HR and Payroll officer leaves" },
          { status: 403 }
        );
      }

      const updated = await prisma.timeOffRequest.update({
        where: { id: requestId },
        data: {
          status,
          reviewedBy: sessionUserId,
          reviewedAt: new Date(),
        },
        include: { user: { select: { id: true, name: true, role: true } } },
      });

      // If approved, update user status to ON_LEAVE if leave is today
      if (status === "APPROVED") {
        const today = new Date();
        const startD = new Date(existingRequest.startDate);
        const endD = existingRequest.endDate ? new Date(existingRequest.endDate) : startD;
        if (today >= startD && today <= endD) {
          await prisma.user.update({
            where: { id: existingRequest.user.id },
            data: { status: "ON_LEAVE" },
          });
        }
      }

      return NextResponse.json({ request: updated });
    } 
    
    // 2. EDIT Logic (Employee editing own request)
    else {
      if (existingRequest.user.id !== sessionUserId) {
        return NextResponse.json({ error: "You can only edit your own requests" }, { status: 403 });
      }
      if (existingRequest.status !== "PENDING") {
        return NextResponse.json({ error: "Cannot edit a processed request" }, { status: 400 });
      }

      let updateData: any = {};
      if (type) {
        updateData.type = type === "Paid leave" ? "PAID" : type === "Sick leave" ? "SICK" : type === "Unpaid leave" ? "UNPAID" : type;
      }
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (days !== undefined) updateData.days = Number(days);
      if (attachmentUrl !== undefined) updateData.note = attachmentUrl;

      const updated = await prisma.timeOffRequest.update({
        where: { id: requestId },
        data: updateData,
        include: { user: { select: { id: true, name: true, role: true } } },
      });

      return NextResponse.json({ request: updated });
    }

  } catch (err) {
    console.error("PATCH /api/timeoff/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
