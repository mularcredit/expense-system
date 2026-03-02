import prisma from "@/lib/prisma";

export async function checkEnforceClosure(userId: string): Promise<{ blocked: boolean; message?: string }> {
    try {
        // 1. First check if user is an Admin - Admins are EXEMPT from closure restrictions
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';
        if (isAdmin) return { blocked: false };

        // 2. Check the global setting
        const setting = await (prisma as any).systemSetting.findUnique({
            where: { key: 'enforce_request_closure' }
        });

        // Deactivated by default (unless strictly set to 'true')
        if (!setting || setting.value !== 'true') {
            return { blocked: false };
        }

        // 3. Count active (non-finalized) requests
        const DONE_STATUSES = ['CLOSED', 'REJECTED', 'PAID', 'COMPLETED', 'FULFILLED', 'APPROVED'];

        const activeExpenses = await prisma.expense.count({
            where: {
                userId,
                status: { notIn: DONE_STATUSES }
            }
        });

        const activeReqs = await (prisma as any).requisition.count({
            where: {
                userId,
                status: { notIn: DONE_STATUSES }
            }
        });

        if (activeExpenses > 0 || activeReqs > 0) {
            return {
                blocked: true,
                message: `You have ${activeExpenses + activeReqs} open request(s) that must be finalized (Paid/Closed) before creating a new one.`
            };
        }

        return { blocked: false };
    } catch (e) {
        console.error("Closure check error:", e);
        return { blocked: false }; // Fail open for safety
    }
}
