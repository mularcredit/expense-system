
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SalesForm } from "@/components/accounting/SalesForm";
import { PiArrowLeft } from "react-icons/pi";
import Link from "next/link";

export default async function NewSalePage() {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    // Fetch customers for the dropdown
    const customers = await prisma.customer.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, currency: true }
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/accounting/sales"
                    className="p-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 transition-colors"
                >
                    <PiArrowLeft />
                </Link>
                <div>
                    <h1 className="text-3xl font-heading font-bold text-gds-text-main">Record New Sale</h1>
                    <p className="text-gds-text-muted">Create a new invoice for a customer.</p>
                </div>
            </div>

            <SalesForm customers={customers} />
        </div>
    );
}
