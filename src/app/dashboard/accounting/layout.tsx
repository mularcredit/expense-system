import { auth } from "@/auth";
import { requirePermission } from "@/lib/access-control";

export default async function AccountingLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Check if user has ANY accounting-related permission
    requirePermission(session, [
        'ACCOUNTING.VIEW',
        'REPORTS.VIEW',
        'CUSTOMERS.VIEW',
        'PAYABLES.VIEW',
        'SALES.MANAGE',
        'LEDGER.VIEW'
    ]);

    return <>{children}</>;
}
