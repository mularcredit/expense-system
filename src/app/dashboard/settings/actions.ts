'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const SettingsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phoneNumber: z.string().optional(),
    language: z.string().optional(),
    // Organization fields (optional, only for admins)
    companyName: z.string().optional(),
    headquartersAddress: z.string().optional(),
});

export async function updateSettings(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const rawData = {
        name: formData.get("name"),
        phoneNumber: formData.get("phoneNumber"),
        language: formData.get("language"),
        companyName: formData.get("companyName"),
        headquartersAddress: formData.get("headquartersAddress"),
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

        // If Admin, Update Organization (Mock implementation as there's no single Org table yet usually)
        // For now, we'll just log it or update if there's an organization model.
        // Assuming we might save these to a 'SystemSettings' table or similar in future.

        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to update settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}
