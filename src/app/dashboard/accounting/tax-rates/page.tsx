import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { TaxRateManagement } from './TaxRateManagement';

export default async function TaxRatesPage() {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    // Fetch all tax rates
    // Using (prisma as any) to avoid potential type issues if client not freshly generated
    const taxRates = await (prisma as any).taxRate.findMany({
        orderBy: { code: 'asc' }
    });

    return (
        <div className="animate-fade-in-up">
            <TaxRateManagement taxRates={taxRates} />
        </div>
    );
}
