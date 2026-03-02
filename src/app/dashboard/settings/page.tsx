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

    const systemSettings = await (prisma as any).systemSetting.findMany();
    const settingsMap = systemSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});

    const enforceRequestClosure = settingsMap['enforce_request_closure'] === 'true';

    return (
        <Suspense fallback={<div>Loading settings...</div>}>
            <SettingsClient user={user} enforceRequestClosure={enforceRequestClosure} />
        </Suspense>
    );
}
