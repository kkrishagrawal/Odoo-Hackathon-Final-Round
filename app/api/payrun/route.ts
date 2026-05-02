import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const payruns = await prisma.payrun.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        payslips: {
          include: {
            user: true,
          },
        },
      },
      take: 1,
    });

    return NextResponse.json(payruns[0] || null);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch payruns" },
      { status: 500 }
    );
  }
}