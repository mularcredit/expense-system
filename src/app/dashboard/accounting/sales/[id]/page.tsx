
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { SalesForm } from "@/components/accounting/SalesForm";
import Link from "next/link";
import { PiArrowLeft } from "react-icons/pi";

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    const { id } = await params;

    const [sale, customers] = await Promise.all([
        prisma.sale.findUnique({
            where: { id },
            include: { items: true }
        }),
        prisma.customer.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: { id: true, name: true, currency: true }
        })
    ]);

    if (!sale) {
        notFound();
    }

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
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-heading font-bold text-gds-text-main">
                            Edit Invoice
                        </h1>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-mono font-bold">
                            {sale.invoiceNumber}
                        </span>
                    </div>
                    <p className="text-gds-text-muted">Update details for this invoice.</p>
                </div>
            </div>

            <SalesForm customers={customers} initialData={sale} />
        </div>
    );
}
