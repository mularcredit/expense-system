'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const SettingsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phoneNumber: z.string().optional(),
    language: z.string().optional(),
    companyName: z.string().optional(),
    headquartersAddress: z.string().optional(),
    enforceRequestClosure: z.string().optional(),
});

export async function updateSettings(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const rawData = {
        name: formData.get("name"),
        phoneNumber: formData.get("phoneNumber"),
        companyName: formData.get("companyName"),
        headquartersAddress: formData.get("headquartersAddress"),
        enforceRequestClosure: formData.get("enforceRequestClosure"),
    };

    try {
        const data = SettingsSchema.parse(rawData);

        // Update User Profile
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: data.name,
                phoneNumber: data.phoneNumber || null,
                // store language pref if you have a field, or ignore for now
            }
        });

        // If Admin, Update Organization
        if (data.enforceRequestClosure !== undefined) {
            await (prisma as any).systemSetting.upsert({
                where: { key: 'enforce_request_closure' },
                update: { value: data.enforceRequestClosure },
                create: { key: 'enforce_request_closure', value: data.enforceRequestClosure },
            });
        }

        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to update settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}
