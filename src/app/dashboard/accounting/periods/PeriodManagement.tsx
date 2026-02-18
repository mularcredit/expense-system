'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PiPlus, PiLockKey, PiLockKeyOpen, PiCalendarBlank, PiCalendarCheck } from 'react-icons/pi';
import { createFiscalYear, closePeriod, closeFiscalYear } from './actions';
import { FormModal, ConfirmationModal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

const FiscalYearFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    startDate: z.string().min(1, "Start Date is required"),
    endDate: z.string().min(1, "End Date is required"),
    periodType: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
});

type FiscalYearFormValues = z.infer<typeof FiscalYearFormSchema>;

interface PeriodManagementProps {
    fiscalYears: any[];
}

export function PeriodManagement({ fiscalYears }: PeriodManagementProps) {
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [closingPeriod, setClosingPeriod] = useState<any | null>(null);
    const [closingYear, setClosingYear] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { control, register, handleSubmit, reset, formState: { errors } } = useForm<FiscalYearFormValues>({
        resolver: zodResolver(FiscalYearFormSchema),
        defaultValues: {
            periodType: 'MONTHLY',
            startDate: new Date().getFullYear() + '-01-01',
            endDate: new Date().getFullYear() + '-12-31'
        }
    });

    const handleOpenCreate = () => {
        reset({
            name: `FY ${new Date().getFullYear()}`,
            periodType: 'MONTHLY',
            startDate: `${new Date().getFullYear()}-01-01`,
            endDate: `${new Date().getFullYear()}-12-31`
        });
        setIsCreateModalOpen(true);
    };

    const onSubmitCreate = async (data: FiscalYearFormValues) => {
        setIsLoading(true);
        try {
            const result = await createFiscalYear({
                name: data.name,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                periodType: data.periodType
            });

            if (result.success) {
                setIsCreateModalOpen(false);
                router.refresh();
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error(error);
            alert("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClosePeriod = async () => {
        if (!closingPeriod) return;
        setIsLoading(true);
        try {
            const result = await closePeriod(closingPeriod.id);
            if (result.success) {
                setClosingPeriod(null);
                router.refresh();
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseYear = async () => {
        if (!closingYear) return;
        setIsLoading(true);
        try {
            const result = await closeFiscalYear(closingYear.id);
            if (result.success) {
                setClosingYear(null);
                router.refresh();
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Period Management</h1>
                    <p className="text-gray-500 text-sm">
                        Manage fiscal years and accounting periods
                    </p>
                </div>
                <Button onClick={handleOpenCreate} className="flex items-center gap-2 shadow-none">
                    <PiPlus className="text-lg" />
                    Create Fiscal Year
                </Button>
            </div>

            {/* Create Modal */}
            <FormModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create Fiscal Year"
                subtitle="Define a new fiscal year and generate periods"
                icon={<PiCalendarCheck className="text-xl" />}
            >
                <form onSubmit={handleSubmit(onSubmitCreate)} className="p-6 space-y-4">
                    <Input
                        label="Fiscal Year Name"
                        placeholder="e.g. FY 2026"
                        {...register("name")}
                        error={errors.name?.message}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            {...register("startDate")}
                            error={errors.startDate?.message}
                        />
                        <Input
                            label="End Date"
                            type="date"
                            {...register("endDate")}
                            error={errors.endDate?.message}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Period Type</label>
                        <Controller
                            name="periodType"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={[
                                        { value: "MONTHLY", label: "Monthly (12 Periods)" },
                                        { value: "QUARTERLY", label: "Quarterly (4 Periods)" },
                                        { value: "ANNUAL", label: "Annual (1 Period)" },
                                    ]}
                                />
                            )}
                        />
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Fiscal Year"}
                        </Button>
                    </div>
                </form>
            </FormModal>

            {/* Close Period Modal */}
            <ConfirmationModal
                isOpen={!!closingPeriod}
                onClose={() => setClosingPeriod(null)}
                onConfirm={handleClosePeriod}
                title="Close Period"
                description={`Are you sure you want to close ${closingPeriod?.name}? This action cannot be undone efficiently and will lock all transactions for this period.`}
                confirmText="Close Period"
                variant="warning"
                isLoading={isLoading}
            />

            {/* Close Year Modal */}
            <ConfirmationModal
                isOpen={!!closingYear}
                onClose={() => setClosingYear(null)}
                onConfirm={handleCloseYear}
                title="Close Fiscal Year"
                description={`Are you sure you want to close ${closingYear?.name}? This will mark the year as closed and update the status.`}
                confirmText="Close Year"
                variant="danger"
                isLoading={isLoading}
            />

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <PiCalendarBlank className="text-3xl text-blue-600 mt-1" />
                    <div>
                        <p className="font-bold text-blue-900 text-lg mb-2">About Period Management</p>
                        <p className="text-sm text-blue-700 mb-3">
                            Period management allows you to organize your accounting into fiscal years and periods (monthly/quarterly).
                            Closing a period prevents backdating and ensures data integrity for financial reporting.
                        </p>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                            <li>Create fiscal years (e.g., FY 2026: Jan 1 - Dec 31)</li>
                            <li>Define accounting periods (monthly or quarterly)</li>
                            <li>Close periods to lock transactions and prevent changes</li>
                            <li>Track who closed periods and when</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Fiscal Years List */}
            {fiscalYears.length === 0 ? (
                <Card className="shadow-none p-12 text-center border-gray-200">
                    <PiCalendarBlank className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Fiscal Years Defined</h3>
                    <p className="text-gray-500 mb-6">
                        Create your first fiscal year to start managing accounting periods
                    </p>
                    <Button onClick={handleOpenCreate} className="flex items-center gap-2 mx-auto shadow-none">
                        <PiPlus className="text-lg" />
                        Create Fiscal Year
                    </Button>
                </Card>
            ) : (
                <div className="space-y-6">
                    {fiscalYears.map((fy: any) => (
                        <Card key={fy.id} className="shadow-none overflow-hidden border-gray-200">
                            {/* Fiscal Year Header */}
                            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-xl font-bold text-gray-900">{fy.name}</h2>
                                            {fy.isCurrent && (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">
                                                    Current
                                                </span>
                                            )}
                                            {fy.isClosed && (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full uppercase flex items-center gap-1">
                                                    <PiLockKey /> Closed
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {formatDate(fy.startDate)} - {formatDate(fy.endDate)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {!fy.isClosed && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-200 hover:bg-red-50 shadow-none"
                                                onClick={() => setClosingYear(fy)}
                                            >
                                                Close Year
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Periods Table */}
                            <div className="p-6">
                                {fy.periods.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 mb-4">No periods defined for this fiscal year</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Period</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Start Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">End Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {fy.periods.map((period: any) => (
                                                    <tr key={period.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{period.name}</td>
                                                        <td className="px-4 py-4 text-xs text-gray-500 uppercase">{period.periodType}</td>
                                                        <td className="px-4 py-4 text-sm text-gray-700">{formatDate(period.startDate)}</td>
                                                        <td className="px-4 py-4 text-sm text-gray-700">{formatDate(period.endDate)}</td>
                                                        <td className="px-4 py-4">
                                                            {period.isClosed ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full flex items-center gap-1">
                                                                        <PiLockKey className="text-sm" />
                                                                        Closed
                                                                    </span>
                                                                    {period.closedAt && (
                                                                        <span className="text-xs text-gray-500">
                                                                            {formatDate(period.closedAt)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                                                                    <PiLockKeyOpen className="text-sm" />
                                                                    Open
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            {!period.isClosed && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="shadow-none"
                                                                    onClick={() => setClosingPeriod(period)}
                                                                >
                                                                    Close Period
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-none p-6 border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Total Fiscal Years</p>
                    <p className="text-3xl font-bold text-gray-900">{fiscalYears.length}</p>
                </Card>
                <Card className="shadow-none p-6 border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Current Fiscal Year</p>
                    <p className="text-xl font-bold text-gray-900">
                        {fiscalYears.find((fy: any) => fy.isCurrent)?.name || 'None'}
                    </p>
                </Card>
                <Card className="shadow-none p-6 border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Open Periods</p>
                    <p className="text-3xl font-bold text-green-600">
                        {fiscalYears.reduce((sum: number, fy: any) =>
                            sum + fy.periods.filter((p: any) => !p.isClosed).length, 0
                        )}
                    </p>
                </Card>
            </div>
        </div>
    );
}
