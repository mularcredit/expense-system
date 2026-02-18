import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { PeriodManagement } from './PeriodManagement';

export default async function PeriodsPage() {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    // Fetch all fiscal years with their periods
    const fiscalYears = await (prisma as any).fiscalYear.findMany({
        include: {
            periods: {
                orderBy: { startDate: 'asc' }
            }
        },
        orderBy: { startDate: 'desc' }
    });

    return (
        <div className="animate-fade-in-up">
            <PeriodManagement fiscalYears={fiscalYears} />
        </div>
    );
}
