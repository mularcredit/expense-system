import { auth } from "@/auth";
import { requirePermission } from "@/lib/access-control";

export default async function FinanceStudioLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    requirePermission(session, ['STUDIO.VIEW', 'FINANCE.VIEW', 'REPORTS.VIEW']);

    return <>{children}</>;
}
