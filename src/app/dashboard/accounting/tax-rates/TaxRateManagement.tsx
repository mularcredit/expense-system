'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PiPlus, PiPercent, PiToggleLeft, PiToggleRight, PiPencil } from 'react-icons/pi';
import { createTaxRate, updateTaxRate, toggleTaxRateStatus } from './actions';
import { FormModal, ConfirmationModal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

// Schema matching the server action validation
const TaxRateSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required"),
    rate: z.coerce.number().min(0, "Rate must be positive"),
    type: z.enum(["VAT", "SALES_TAX", "WITHHOLDING", "EXCISE"]),
    description: z.string().optional(),
    effectiveFrom: z.string().optional(), // Input type="date" returns string
    effectiveTo: z.string().optional(),
});

type TaxRateFormValues = z.infer<typeof TaxRateSchema>;

interface TaxRateManagementProps {
    taxRates: any[];
}

export function TaxRateManagement({ taxRates }: TaxRateManagementProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRate, setEditingRate] = useState<any | null>(null);
    const [deactivatingRate, setDeactivatingRate] = useState<any | null>(null);
    const [activatingRate, setActivatingRate] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const activeTaxRates = taxRates.filter((rate: any) => rate.isActive);
    const inactiveTaxRates = taxRates.filter((rate: any) => !rate.isActive);

    const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(TaxRateSchema),
        defaultValues: {
            type: "VAT",
            rate: 0
        }
    });

    const handleOpenCreate = () => {
        setEditingRate(null);
        reset({
            name: '',
            code: '',
            rate: 0,
            type: 'VAT',
            description: '',
            effectiveFrom: new Date().toISOString().split('T')[0],
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (rate: any) => {
        setEditingRate(rate);
        reset({
            id: rate.id,
            name: rate.name,
            code: rate.code,
            rate: rate.rate,
            type: rate.type,
            description: rate.description || '',
            effectiveFrom: rate.effectiveFrom ? new Date(rate.effectiveFrom).toISOString().split('T')[0] : '',
            effectiveTo: rate.effectiveTo ? new Date(rate.effectiveTo).toISOString().split('T')[0] : '',
        });
        setIsModalOpen(true);
    };

    const onSubmit = async (data: TaxRateFormValues) => {
        setIsLoading(true);
        try {
            // Convert string dates back to Date objects for server action
            const payload = {
                ...data,
                effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
                effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
            };

            let result;
            if (editingRate) {
                result = await updateTaxRate({ ...payload, id: editingRate.id });
            } else {
                result = await createTaxRate(payload);
            }

            if (result.success) {
                setIsModalOpen(false);
                router.refresh();
            } else {
                alert(result.error); // Simple error feedback
            }
        } catch (error) {
            console.error(error);
            alert("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (rate: any, isActive: boolean) => {
        setIsLoading(true);
        try {
            const result = await toggleTaxRateStatus(rate.id, isActive);
            if (result.success) {
                setDeactivatingRate(null);
                setActivatingRate(null);
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

    const getTaxTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'VAT': 'bg-blue-100 text-blue-700 border-blue-200',
            'SALES_TAX': 'bg-green-100 text-green-700 border-green-200',
            'WITHHOLDING': 'bg-purple-100 text-purple-700 border-purple-200',
            'EXCISE': 'bg-orange-100 text-orange-700 border-orange-200',
        };
        return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Tax Rate Management</h1>
                    <p className="text-gray-500 text-sm">
                        Configure and manage tax rates for compliance
                    </p>
                </div>
                <Button onClick={handleOpenCreate} className="flex items-center gap-2 shadow-none">
                    <PiPlus className="text-lg" />
                    Add Tax Rate
                </Button>
            </div>

            {/* Creating/Editing Modal */}
            <FormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRate ? "Edit Tax Rate" : "Add Tax Rate"}
                icon={<PiPercent className="text-xl" />}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Tax Name"
                            placeholder="e.g. Standard VAT"
                            {...register("name")}
                            error={errors.name?.message}
                        />
                        <Input
                            label="Tax Code"
                            placeholder="e.g. VAT-18"
                            {...register("code")}
                            error={errors.code?.message}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            { value: "VAT", label: "Value Added Tax (VAT)" },
                                            { value: "SALES_TAX", label: "Sales Tax" },
                                            { value: "WITHHOLDING", label: "Withholding Tax" },
                                            { value: "EXCISE", label: "Excise Duty" },
                                        ]}
                                    />
                                )}
                            />
                        </div>
                        <Input
                            label="Rate (%)"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...register("rate")}
                            error={errors.rate?.message}
                        />
                    </div>

                    <Input
                        label="Description"
                        placeholder="Optional description..."
                        {...register("description")}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Effective From"
                            type="date"
                            {...register("effectiveFrom")}
                        />
                        <Input
                            label="Effective To"
                            type="date"
                            {...register("effectiveTo")}
                        />
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Tax Rate"}
                        </Button>
                    </div>
                </form>
            </FormModal>

            {/* Deactivate Confirmation */}
            <ConfirmationModal
                isOpen={!!deactivatingRate}
                onClose={() => setDeactivatingRate(null)}
                onConfirm={() => deactivatingRate && handleToggleStatus(deactivatingRate, false)}
                title="Deactivate Tax Rate"
                description={`Are you sure you want to deactivate ${deactivatingRate?.name}? This will prevent it from being used in new transactions.`}
                confirmText="Deactivate"
                variant="warning"
                isLoading={isLoading}
            />

            {/* Activate Confirmation */}
            <ConfirmationModal
                isOpen={!!activatingRate}
                onClose={() => setActivatingRate(null)}
                onConfirm={() => activatingRate && handleToggleStatus(activatingRate, true)}
                title="Activate Tax Rate"
                description={`Are you sure you want to activate ${activatingRate?.name}?`}
                confirmText="Activate"
                variant="info"
                isLoading={isLoading}
            />

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <PiPercent className="text-3xl text-blue-600 mt-1" />
                    <div>
                        <p className="font-bold text-blue-900 text-lg mb-2">About Tax Management</p>
                        <p className="text-sm text-blue-700 mb-3">
                            Tax rates are used to calculate taxes on sales, purchases, and other transactions.
                            You can define multiple tax rates with different types and effective dates.
                        </p>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                            <li>Define tax rates (e.g., VAT 18%, Sales Tax 5%)</li>
                            <li>Set effective dates for tax rate changes</li>
                            <li>Support multiple tax types (VAT, Sales Tax, Withholding, Excise)</li>
                            <li>Activate/deactivate tax rates as needed</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Active Tax Rates */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Active Tax Rates</h2>
                    <span className="text-sm text-gray-500">{activeTaxRates.length} active</span>
                </div>

                {activeTaxRates.length === 0 ? (
                    <Card className="shadow-none p-12 text-center border-gray-200">
                        <PiPercent className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Tax Rates</h3>
                        <p className="text-gray-500 mb-6">
                            Add your first tax rate to start tracking taxes
                        </p>
                        <Button onClick={handleOpenCreate} className="flex items-center gap-2 mx-auto shadow-none">
                            <PiPlus className="text-lg" />
                            Add Tax Rate
                        </Button>
                    </Card>
                ) : (
                    <Card className="shadow-none overflow-hidden border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Code</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Rate</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Effective From</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Effective To</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activeTaxRates.map((rate: any) => (
                                        <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono font-bold text-gray-900">{rate.code}</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{rate.name}</p>
                                                    {rate.description && (
                                                        <p className="text-xs text-gray-500 mt-1">{rate.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getTaxTypeColor(rate.type)}`}>
                                                    {rate.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-lg font-bold text-gray-900">{rate.rate}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{formatDate(rate.effectiveFrom)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{rate.effectiveTo ? formatDate(rate.effectiveTo) : 'Ongoing'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(rate)} className="shadow-none">
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 border-red-200 hover:bg-red-50 shadow-none"
                                                        onClick={() => setDeactivatingRate(rate)}
                                                    >
                                                        <PiToggleLeft className="text-lg" />
                                                        Deactivate
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Inactive Tax Rates */}
            {inactiveTaxRates.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Inactive Tax Rates</h2>
                        <span className="text-sm text-gray-500">{inactiveTaxRates.length} inactive</span>
                    </div>

                    <Card className="shadow-none overflow-hidden border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full opacity-60">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Code</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Rate</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {inactiveTaxRates.map((rate: any) => (
                                        <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono font-bold text-gray-900">{rate.code}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{rate.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getTaxTypeColor(rate.type)}`}>
                                                    {rate.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-lg font-bold text-gray-900">{rate.rate}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-green-600 border-green-200 hover:bg-green-50 shadow-none"
                                                    onClick={() => setActivatingRate(rate)}
                                                >
                                                    <PiToggleRight className="text-lg" />
                                                    Activate
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-none p-6 border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Total Tax Rates</p>
                    <p className="text-3xl font-bold text-gray-900">{taxRates.length}</p>
                </Card>
                <Card className="shadow-none p-6 border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Active Rates</p>
                    <p className="text-3xl font-bold text-green-600">{activeTaxRates.length}</p>
                </Card>
                <Card className="shadow-none p-6 border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Tax Types</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {new Set(taxRates.map((r: any) => r.type)).size}
                    </p>
                </Card>
                <Card className="shadow-none p-6 border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Average Rate</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {activeTaxRates.length > 0
                            ? (activeTaxRates.reduce((sum: number, r: any) => sum + r.rate, 0) / activeTaxRates.length).toFixed(1)
                            : 0}%
                    </p>
                </Card>
            </div>

            {/* Common Tax Rates Reference */}
            <Card className="shadow-none p-6 bg-gray-50 border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Common Tax Rates Reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="font-bold text-gray-700 mb-1">VAT (Value Added Tax)</p>
                        <p className="text-gray-600">Standard: 15-25%</p>
                    </div>
                    <div>
                        <p className="font-bold text-gray-700 mb-1">Sales Tax</p>
                        <p className="text-gray-600">Typical: 5-10%</p>
                    </div>
                    <div>
                        <p className="font-bold text-gray-700 mb-1">Withholding Tax</p>
                        <p className="text-gray-600">Common: 10-30%</p>
                    </div>
                    <div>
                        <p className="font-bold text-gray-700 mb-1">Excise Tax</p>
                        <p className="text-gray-600">Varies by product</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
