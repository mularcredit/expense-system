import { auth } from "@/auth";
import { requirePermission } from "@/lib/access-control";

export default async function SalariesLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    requirePermission(session, ['SALARIES.VIEW', 'SALARIES.MANAGE']);

    return <>{children}</>;
}
