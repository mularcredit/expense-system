import { DataImporter } from '@/components/dashboard/DataImporter'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function ImportSettingsPage() {
    const session = await auth()
    if (!session?.user) return redirect("/login")

    // Optional: Check permissions manually if needed, but basic auth is mostly OK for now.
    // Ideally only Admin/Manager/Finance.

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
            <div className="flex items-end justify-between border-b pb-6 border-gray-200">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">Data Import</h1>
                    <p className="text-gray-500 text-sm font-medium tracking-wide">
                        Bulk upload customers and create invoices from Excel/CSV.
                    </p>
                </div>
            </div>

            <DataImporter />
        </div>
    )
}
