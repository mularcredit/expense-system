"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Policy } from "@prisma/client";
import {
    PiShieldCheck,
    PiShieldWarning,
    PiPlus,
    PiTrash,
    PiToggleRight,
    PiToggleLeft,
    PiReceipt,
    PiClock,
    PiCurrencyDollar,
    PiListBullets,
    PiStorefront,
    PiX,
    PiCheck,
    PiArrowRight
} from "react-icons/pi";
import { togglePolicy, deletePolicy, createPolicy } from "@/app/dashboard/policies/actions";
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter } from "next/navigation";

interface PolicyManagerProps {
    policies: Policy[];
}

// Pre-defined policy templates
const POLICY_TEMPLATES = [
    {
        name: "Expense Receipt Required",
        description: "Require receipts for all expenses over $50",
        type: "RECEIPT_REQUIREMENT",
        rules: { threshold: 50 },
        icon: PiReceipt,
        color: "blue"
    },
    {
        name: "Daily Spending Limit",
        description: "Maximum $500 per day per employee",
        type: "SPENDING_LIMIT",
        rules: { maxAmount: 500, isBlocking: true },
        icon: PiCurrencyDollar,
        color: "emerald"
    },
    {
        name: "Weekend Restriction",
        description: "Block expense submissions on weekends",
        type: "TIME_LIMIT",
        rules: { blockWeekends: true, blockAfterHours: false },
        icon: PiClock,
        color: "purple"
    },
    {
        name: "High-Value Approval",
        description: "Expenses over $1,000 require manager approval",
        type: "SPENDING_LIMIT",
        rules: { maxAmount: 1000, isBlocking: true },
        icon: PiShieldCheck,
        color: "orange"
    },
    {
        name: "Auto-Approval Threshold",
        description: "Small expenses under $50 are auto-approved without manual review",
        type: "AUTO_APPROVAL",
        rules: { amountMax: 50 },
        icon: PiShieldCheck,
        color: "blue"
    },
    {
        name: "Vendor Blacklist",
        description: "Block expenses from gambling and casino vendors",
        type: "VENDOR_RESTRICTION",
        rules: { blockedVendors: ["Casino", "Gambling", "Lottery"] },
        icon: PiStorefront,
        color: "rose"
    },
    {
        name: "Prohibited Keywords",
        description: "Block expenses containing prohibited items (alcohol, luxury goods, etc.)",
        type: "KEYWORD_RESTRICTION",
        rules: { prohibitedKeywords: ["alcohol", "wine", "beer", "spa", "gym", "jewelry"] },
        icon: PiShieldWarning,
        color: "rose"
    }
];

export function PolicyManager({ policies }: PolicyManagerProps) {
    const { showToast } = useToast();
    const router = useRouter();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<typeof POLICY_TEMPLATES[0] | null>(null);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SPENDING_LIMIT': return PiCurrencyDollar;
            case 'RECEIPT_REQUIREMENT': return PiReceipt;
            case 'TIME_LIMIT': return PiClock;
            case 'VENDOR_RESTRICTION': return PiStorefront;
            case 'KEYWORD_RESTRICTION': return PiShieldWarning;
            case 'AUTO_APPROVAL': return PiCheck;
            default: return PiListBullets;
        }
    };

    const getColorClass = (color: string) => {
        const colors: Record<string, string> = {
            blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            cyan: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
        };
        return colors[color] || colors.blue;
    };

    const handleToggle = async (policy: Policy) => {
        const result = await togglePolicy(policy.id, policy.isActive);
        if (result.success) {
            showToast(policy.isActive ? "Policy deactivated" : "Policy activated", "success");
            router.refresh();
        } else {
            showToast("Failed to update policy", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this policy?")) return;
        const result = await deletePolicy(id);
        if (result.success) {
            showToast("Policy deleted", "success");
            router.refresh();
        } else {
            showToast("Failed to delete policy", "error");
        }
    };

    const [configValue, setConfigValue] = useState<string>("");

    const handleActivateTemplate = async (template: typeof POLICY_TEMPLATES[0]) => {
        const formData = new FormData();
        formData.append('name', template.name);
        formData.append('description', template.description);
        formData.append('type', template.type);

        // Merge custom config value back into rules
        const finalRules = { ...template.rules };
        if (template.type === 'AUTO_APPROVAL' && configValue) {
            (finalRules as any).amountMax = parseFloat(configValue);
        } else if (template.type === 'RECEIPT_REQUIREMENT' && configValue) {
            (finalRules as any).threshold = parseFloat(configValue);
        } else if (template.type === 'SPENDING_LIMIT' && configValue) {
            (finalRules as any).maxAmount = parseFloat(configValue);
        } else if (template.type === 'KEYWORD_RESTRICTION' && configValue) {
            (finalRules as any).prohibitedKeywords = configValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }

        formData.append('rules', JSON.stringify(finalRules));

        const result = await createPolicy(formData);
        if (result.success) {
            showToast("Policy activated successfully", "success");
            setIsCreateOpen(false);
            setSelectedTemplate(null);
            setConfigValue("");
            router.refresh();
        } else {
            showToast(result.error || "Failed to activate policy", "error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
                >
                    <PiPlus className="text-lg" />
                    Add Policy
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {policies.map(policy => {
                    const Icon = getTypeIcon(policy.type);
                    return (
                        <div key={policy.id} className={`gds-glass p-6 border-l-4 ${policy.isActive ? 'border-l-[var(--gds-emerald)]' : 'border-l-gray-300 opacity-70'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${policy.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-100 text-gray-400'}`}>
                                        <Icon className="text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gds-text-main">{policy.name}</h3>
                                        <p className="text-xs text-gds-text-muted">{policy.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleToggle(policy)} className="text-2xl transition-colors">
                                        {policy.isActive ?
                                            <PiToggleRight className="text-emerald-500" /> :
                                            <PiToggleLeft className="text-gray-400" />
                                        }
                                    </button>
                                    <button onClick={() => handleDelete(policy.id)} className="p-2 hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 rounded-lg transition-colors">
                                        <PiTrash />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--gds-border)]">
                                <p className="text-[10px] font-bold text-gds-text-muted uppercase tracking-widest mb-2">Rules Configuration</p>
                                <code className="block text-xs bg-[var(--gds-surface-bright)] p-3 rounded-lg font-mono text-gds-text-main truncate">
                                    {policy.rules}
                                </code>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${policy.isActive
                                    ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20'
                                    : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    {policy.isActive ? 'Active & Enforcing' : 'Inactive'}
                                </span>
                                <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-blue-500/5 text-blue-600 border-blue-500/20">
                                    {policy.type.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Policy Templates Modal */}
            {isCreateOpen && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateOpen(false)}
                            className="fixed inset-0 bg-white/40 backdrop-blur-xl"
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white border border-gray-200 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Header - Fixed 88px */}
                            <div className="h-[88px] px-6 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                                        <PiShieldCheck className="text-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-0.5">
                                            {selectedTemplate ? 'Configure Policy' : 'Select Policy Template'}
                                        </h3>
                                        <p className="text-gray-500 text-xs font-medium">
                                            {selectedTemplate ? 'Adjust settings before activating' : 'Choose a pre-configured policy to activate'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setSelectedTemplate(null);
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <PiX className="text-xl" />
                                </button>
                            </div>

                            {/* Body - Grey Background */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8f9fa] p-6">
                                {!selectedTemplate ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {POLICY_TEMPLATES.map((template, idx) => {
                                            const Icon = template.icon;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setSelectedTemplate(template);
                                                        // Set initial default value
                                                        if (template.type === 'AUTO_APPROVAL') setConfigValue("50");
                                                        else if (template.type === 'RECEIPT_REQUIREMENT') setConfigValue("50");
                                                        else if (template.type === 'SPENDING_LIMIT') setConfigValue("500");
                                                        else if (template.type === 'KEYWORD_RESTRICTION') setConfigValue((template.rules as any).prohibitedKeywords.join(', '));
                                                    }}
                                                    className="bg-white border border-gray-200 rounded-lg p-5 text-left hover:border-indigo-500 hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClass(template.color)} border transition-all group-hover:scale-110`}>
                                                            <Icon className="text-xl" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-gray-900 text-sm mb-1">{template.name}</h3>
                                                            <p className="text-xs text-gray-600 leading-relaxed">{template.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                            {template.type.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-xs text-indigo-600 font-medium group-hover:text-indigo-700 flex items-center gap-1">
                                                            Configure <PiArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="max-w-md mx-auto bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getColorClass(selectedTemplate.color)} border shadow-inner`}>
                                                {(() => { const Icon = selectedTemplate.icon; return <Icon className="text-2xl" /> })()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{selectedTemplate.name}</h4>
                                                <p className="text-xs text-gray-500">{selectedTemplate.type.replace('_', ' ')}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                                    {selectedTemplate.type === 'AUTO_APPROVAL' ? 'Threshold Amount ($)' :
                                                        selectedTemplate.type === 'RECEIPT_REQUIREMENT' ? 'Threshold Amount ($)' :
                                                            selectedTemplate.type === 'SPENDING_LIMIT' ? 'Daily Limit ($)' :
                                                                selectedTemplate.type === 'KEYWORD_RESTRICTION' ? 'Prohibited Keywords' : 'Limit Value'}
                                                </label>
                                                <div className="relative">
                                                    {selectedTemplate.type !== 'KEYWORD_RESTRICTION' && (
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                                    )}
                                                    <input
                                                        type={selectedTemplate.type === 'KEYWORD_RESTRICTION' ? 'text' : 'number'}
                                                        value={configValue}
                                                        onChange={(e) => setConfigValue(e.target.value)}
                                                        className={`w-full ${selectedTemplate.type === 'KEYWORD_RESTRICTION' ? 'px-4' : 'pl-8 pr-4'} py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                                                        placeholder={selectedTemplate.type === 'KEYWORD_RESTRICTION' ? "alcohol, wine, beer..." : "0.00"}
                                                    />
                                                </div>
                                                <p className="mt-2 text-[10px] text-gray-500 leading-relaxed italic">
                                                    {selectedTemplate.type === 'AUTO_APPROVAL' ? 'Expenses below this amount will skip manager approval entirely.' :
                                                        'This value will be used to enforce the policy rules.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-10 flex gap-3">
                                            <button
                                                onClick={() => setSelectedTemplate(null)}
                                                className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg font-bold text-xs uppercase tracking-widest border border-gray-200 hover:bg-gray-100 transition-colors"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={() => handleActivateTemplate(selectedTemplate)}
                                                className="flex-[2] px-4 py-3 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                                            >
                                                Activate Policy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer - Fixed 88px */}
                            <div className="h-[88px] px-6 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
                                <p className="text-xs text-gray-500">
                                    💡 <strong className="text-gray-700">Tip:</strong> You can modify or deactivate policies anytime
                                </p>
                                <button
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setSelectedTemplate(null);
                                    }}
                                    className="px-4 py-2.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-none"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
