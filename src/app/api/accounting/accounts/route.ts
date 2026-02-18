
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch all accounts
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const accounts = await prisma.account.findMany({
            orderBy: [
                { code: 'asc' }
            ]
        });
        return NextResponse.json(accounts);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }
}

// POST: Create new account
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    try {
        const account = await prisma.account.create({
            data: {
                code: body.code,
                name: body.name,
                type: body.type,
                subtype: body.subtype,
                description: body.description
            }
        });
        return NextResponse.json(account);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
}
