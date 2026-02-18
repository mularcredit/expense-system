import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";
import { Suspense } from "react";

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            position: true,
            phoneNumber: true
        }
    });

    if (!user) return redirect("/login");

    return (
        <Suspense fallback={<div>Loading settings...</div>}>
            <SettingsClient user={user} />
        </Suspense>
    );
}
