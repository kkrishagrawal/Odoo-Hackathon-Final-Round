import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: {
                // 👉 Exclude admins if you don’t want them in reports
                role: {
                    in: ["EMPLOYEE", "HR_OFFICER", "PAYROLL_OFFICER"],
                },
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(users);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}