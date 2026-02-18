"use client";

import { useState, useEffect } from "react";
import {
    PiCalendarBlank,
    PiPlus,
    PiClock,
    PiCheckCircle,
    PiXCircle,
    PiArrowClockwise,
    PiPencil,
    PiTrash,
    PiToggleLeft,
    PiToggleRight,
    PiCurrencyDollar,
    PiBuildings,
    PiTag,
} from "react-icons/pi";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { FormModal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { format, parseISO } from "date-fns";

interface Schedule {
    id: string;
    name: string;
    description?: string;
    type: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    nextRun: string;
    amount: number;
    currency: string;
    isActive: boolean;
    vendor?: { id: string; name: string };
    category?: { id: string; name: string };
    createdBy: { id: string; name: string; email: string };
    executions: Array<{
        id: string;
        scheduledFor: string;
        executedAt?: string;
        status: string;
    }>;
}

interface Vendor {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
}

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        type: "PAYMENT",
        frequency: "MONTHLY",
        startDate: "",
        endDate: "",
        amount: "",
        currency: "USD",
        vendorId: "",
        categoryId: "",
        requiresApproval: false,
    });

    useEffect(() => {
        fetchSchedules();
        fetchVendors();
        fetchCategories();
    }, []);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/schedules');
            if (res.ok) {
                const data = await res.json();
                setSchedules(data.schedules || []);
            }
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
            showToast('Failed to load schedules', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors');
            if (res.ok) {
                const data = await res.json();
                setVendors(data.vendors || []);
            }
        } catch (error) {
            console.error('Failed to fetch vendors:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleCreateSchedule = async () => {
        try {
            const res = await fetch('/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                showToast('Schedule created successfully', 'success');
                setShowCreateModal(false);
                fetchSchedules();
                resetForm();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to create schedule', 'error');
            }
        } catch (error) {
            showToast('Failed to create schedule', 'error');
        }
    };

    const handleToggleSchedule = async (id: string) => {
        try {
            const res = await fetch(`/api/schedules/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle' }),
            });

            if (res.ok) {
                showToast('Schedule updated', 'success');
                fetchSchedules();
            }
        } catch (error) {
            showToast('Failed to update schedule', 'error');
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;

        try {
            const res = await fetch(`/api/schedules/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                showToast('Schedule deleted', 'success');
                fetchSchedules();
            }
        } catch (error) {
            showToast('Failed to delete schedule', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            type: "PAYMENT",
            frequency: "MONTHLY",
            startDate: "",
            endDate: "",
            amount: "",
            currency: "USD",
            vendorId: "",
            categoryId: "",
            requiresApproval: false,
        });
    };

    const getFrequencyColor = (frequency: string) => {
        switch (frequency) {
            case 'DAILY': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'WEEKLY': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'MONTHLY': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'QUARTERLY': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'YEARLY': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'PAYMENT': return <PiCurrencyDollar className="text-emerald-600" />;
            case 'EXPENSE': return <PiTag className="text-purple-600" />;
            case 'INVOICE': return <PiBuildings className="text-blue-600" />;
            default: return <PiCalendarBlank className="text-gray-600" />;
        }
    };

    const formatNextRun = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Overdue';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `In ${diffDays} days`;
        return date.toLocaleDateString();
    };

    const filteredSchedules = schedules.filter(schedule => {
        if (filter === 'active') return schedule.isActive;
        if (filter === 'inactive') return !schedule.isActive;
        return true;
    });

    const stats = {
        total: schedules.length,
        active: schedules.filter(s => s.isActive).length,
        inactive: schedules.filter(s => !s.isActive).length,
        upcoming: schedules.filter(s => s.isActive && new Date(s.nextRun) > new Date()).length,
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Automate recurring payments and manage payment schedules
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#29258D] hover:bg-[#29258D]/90"
                >
                    <PiPlus className="mr-2" />
                    New Schedule
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <PiCalendarBlank className="text-3xl text-gray-400" />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
                        </div>
                        <PiCheckCircle className="text-3xl text-emerald-400" />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inactive</p>
                            <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactive}</p>
                        </div>
                        <PiXCircle className="text-3xl text-gray-400" />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Upcoming</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.upcoming}</p>
                        </div>
                        <PiClock className="text-3xl text-blue-400" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'all'
                        ? 'bg-[#29258D] text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    All ({stats.total})
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'active'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    Active ({stats.active})
                </button>
                <button
                    onClick={() => setFilter('inactive')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'inactive'
                        ? 'bg-gray-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    Inactive ({stats.inactive})
                </button>
            </div>

            {/* Schedules List */}
            {loading ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <PiArrowClockwise className="text-4xl text-gray-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading schedules...</p>
                </div>
            ) : filteredSchedules.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <PiCalendarBlank className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Schedules Yet</h3>
                    <p className="text-gray-600 mb-6">
                        Create your first schedule to automate recurring payments and expenses.
                    </p>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#29258D] hover:bg-[#29258D]/90"
                    >
                        <PiPlus className="mr-2" />
                        Create Schedule
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredSchedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            className={`bg-white border rounded-xl p-6 transition-all hover:shadow-md ${schedule.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-2xl">
                                        {getTypeIcon(schedule.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{schedule.name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getFrequencyColor(schedule.frequency)}`}>
                                                {schedule.frequency}
                                            </span>
                                            {schedule.isActive ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        {schedule.description && (
                                            <p className="text-sm text-gray-600 mb-3">{schedule.description}</p>
                                        )}
                                        <div className="flex items-center gap-6 text-sm">
                                            <div>
                                                <span className="text-gray-500">Amount:</span>
                                                <span className="font-bold text-gray-900 ml-2">
                                                    {schedule.currency} {schedule.amount.toLocaleString()}
                                                </span>
                                            </div>
                                            {schedule.vendor && (
                                                <div>
                                                    <span className="text-gray-500">Vendor:</span>
                                                    <span className="font-semibold text-gray-900 ml-2">{schedule.vendor.name}</span>
                                                </div>
                                            )}
                                            {schedule.category && (
                                                <div>
                                                    <span className="text-gray-500">Category:</span>
                                                    <span className="font-semibold text-gray-900 ml-2">{schedule.category.name}</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-gray-500">Next Run:</span>
                                                <span className="font-bold text-blue-600 ml-2">{formatNextRun(schedule.nextRun)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleSchedule(schedule.id)}
                                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                        title={schedule.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {schedule.isActive ? (
                                            <PiToggleRight className="text-2xl text-emerald-600" />
                                        ) : (
                                            <PiToggleLeft className="text-2xl text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSchedule(schedule.id)}
                                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                                        title="Delete"
                                    >
                                        <PiTrash className="text-xl" />
                                    </button>
                                </div>
                            </div>

                            {/* Recent Executions */}
                            {schedule.executions.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recent Executions</p>
                                    <div className="flex items-center gap-2">
                                        {schedule.executions.slice(0, 5).map((execution) => (
                                            <div
                                                key={execution.id}
                                                className={`w-2 h-2 rounded-full ${execution.status === 'EXECUTED'
                                                    ? 'bg-emerald-500'
                                                    : execution.status === 'FAILED'
                                                        ? 'bg-red-500'
                                                        : 'bg-gray-300'
                                                    }`}
                                                title={`${execution.status} - ${new Date(execution.scheduledFor).toLocaleDateString()}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Schedule Modal */}
            <FormModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    resetForm();
                }}
                title="Create New Schedule"
                maxWidth="2xl"
            >
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateSchedule();
                }} className="p-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Schedule Name
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Monthly Office Rent"
                                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-[#29258D] transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-[#29258D] transition-all"
                                rows={3}
                                placeholder="Optional description"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Type
                                </label>
                                <Select
                                    value={formData.type}
                                    onChange={(val) => setFormData({ ...formData, type: val })}
                                    options={[
                                        { value: "PAYMENT", label: "Payment" },
                                        { value: "EXPENSE", label: "Expense" },
                                        { value: "INVOICE", label: "Invoice" }
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Frequency
                                </label>
                                <Select
                                    value={formData.frequency}
                                    onChange={(val) => setFormData({ ...formData, frequency: val })}
                                    options={[
                                        { value: "DAILY", label: "Daily" },
                                        { value: "WEEKLY", label: "Weekly" },
                                        { value: "MONTHLY", label: "Monthly" },
                                        { value: "QUARTERLY", label: "Quarterly" },
                                        { value: "YEARLY", label: "Yearly" }
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Start Date
                                </label>
                                <DatePicker
                                    value={formData.startDate ? parseISO(formData.startDate) : undefined}
                                    onChange={(d) => setFormData({ ...formData, startDate: format(d, 'yyyy-MM-dd') })}
                                    placeholder="Start Date"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    End Date (Optional)
                                </label>
                                <DatePicker
                                    value={formData.endDate ? parseISO(formData.endDate) : undefined}
                                    onChange={(d) => setFormData({ ...formData, endDate: format(d, 'yyyy-MM-dd') })}
                                    placeholder="End Date"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Amount
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-[#29258D] transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Currency
                                </label>
                                <Select
                                    value={formData.currency}
                                    onChange={(val) => setFormData({ ...formData, currency: val })}
                                    options={[
                                        { value: "USD", label: "USD" },
                                        { value: "SSP", label: "SSP" },
                                        { value: "KES", label: "KES" }
                                    ]}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Vendor (Optional)
                            </label>
                            <Select
                                value={formData.vendorId}
                                onChange={(val) => setFormData({ ...formData, vendorId: val })}
                                options={vendors.map(v => ({ value: v.id, label: v.name }))}
                                placeholder="Select vendor..."
                                searchable
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Category (Optional)
                            </label>
                            <Select
                                value={formData.categoryId}
                                onChange={(val) => setFormData({ ...formData, categoryId: val })}
                                options={categories.map(c => ({ value: c.id, label: c.name }))}
                                placeholder="Select category..."
                                searchable
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="requiresApproval"
                                checked={formData.requiresApproval}
                                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-[#29258D] focus:ring-[#29258D]"
                            />
                            <label htmlFor="requiresApproval" className="text-sm font-medium text-gray-700">
                                Require approval before execution
                            </label>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                            <Button
                                type="button"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    resetForm();
                                }}
                                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#29258D] hover:bg-[#29258D]/90 text-white"
                            >
                                Create Schedule
                            </Button>
                        </div>
                    </div>
                </form>
            </FormModal>
        </div>
    );
}
