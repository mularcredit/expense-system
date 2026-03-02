
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { InvoiceForm } from "./InvoiceForm";
import { requirePermission } from "@/lib/access-control";

export default async function NewInvoicePage() {
    const session = await auth();

    requirePermission(session, ['INVOICES.CREATE', 'INVOICES.MANAGE', 'SALES.MANAGE']);

    // Fetch vendors for the dropdown
    const vendors = await prisma.vendor.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide">
                        Enter details from a vendor invoice
                    </p>
                </div>
            </div>

            <InvoiceForm vendors={vendors} />
        </div>
    );
}
