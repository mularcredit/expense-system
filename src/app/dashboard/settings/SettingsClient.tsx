"use client";

import { useState, useEffect } from "react";
import { User } from "@prisma/client";
import {
    PiUserCircle,
    PiBuilding,
    PiGlobe,
    PiShieldCheck,
    PiBell,
    PiLockKey,
    PiFloppyDisk,
    PiStorefront,
    PiCaretDown,
    PiCheck,
    PiToggleRight,
    PiToggleLeft,
    PiCaretRightBold,
    PiCircleNotch
} from "react-icons/pi";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { updateSettings } from "./actions";
import { signOut } from "next-auth/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneInput } from "@/components/ui/PhoneInput";

interface SettingsClientProps {
    user: Pick<User, "id" | "name" | "email" | "role" | "department" | "position" | "phoneNumber">;
}

export function SettingsClient({ user }: SettingsClientProps) {
    const { showToast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isAdmin = ['SYSTEM_ADMIN', 'FINANCE_APPROVER'].includes(user.role);
    const activeTab = searchParams.get('tab') || (isAdmin ? 'organization' : 'profile');

    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        language: 'English (UK)',
        companyName: 'CapitalPay East Africa Ltd.',
        registrationNumber: 'PVT/2026/009988X',
        headquartersAddress: 'Prism Towers, 3rd Avenue, Upper Hill, Nairobi, Kenya',
        notifications: {
            emailAlerts: true,
            pushNotifications: true,
            marketing: false,
            securityAlerts: true
        }
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNotificationToggle = (key: keyof typeof formData.notifications) => {
        setFormData(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: !prev.notifications[key]
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('phoneNumber', formData.phoneNumber);
            data.append('language', formData.language);
            if (isAdmin) {
                data.append('companyName', formData.companyName);
                data.append('headquartersAddress', formData.headquartersAddress);
            }

            const result = await updateSettings(data);

            if (result.success) {
                showToast("Settings saved successfully", "success");
            } else {
                showToast(result.error || "Failed to save settings", "error");
            }
        } catch (error) {
            showToast("An unexpected error occurred", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const setActiveTab = (tab: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('tab', tab);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="animate-fade-in-up">
                    <h1 className="text-4xl font-heading font-bold text-gds-text-main mb-2 tracking-tight">
                        {isAdmin ? 'System Configuration' : 'Account Settings'}
                    </h1>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide border-l-2 border-[#5e48b8] pl-3">
                        {isAdmin ? 'Manage organization profile and global preferences' : 'Manage your personal profile and security'}
                    </p>
                </div>
                <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <Button
                        variant="outline"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-xl"
                    >
                        <PiLockKey className="mr-2 text-lg" />
                        Sign Out
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#5e48b8] hover:bg-[#4c3a9e] text-white shadow-lg shadow-[#5e48b8]/20 rounded-xl min-w-[140px]"
                    >
                        {isSaving ? (
                            <PiCircleNotch className="animate-spin text-xl mr-2" />
                        ) : (
                            <PiFloppyDisk className="mr-2 text-lg" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="gds-glass p-3 space-y-1">
                        <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Menu</p>

                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('organization')}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all group ${activeTab === 'organization'
                                    ? 'bg-[#5e48b8] text-white shadow-lg shadow-[#5e48b8]/20 translate-x-1'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <PiBuilding className="text-lg" />
                                    Organization
                                </div>
                                {activeTab === 'organization' && <PiCaretRightBold className="text-xs animate-pulse" />}
                            </button>
                        )}

                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all group ${activeTab === 'profile'
                                ? 'bg-[#5e48b8] text-white shadow-lg shadow-[#5e48b8]/20 translate-x-1'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <PiUserCircle className="text-lg" />
                                My Profile
                            </div>
                            {activeTab === 'profile' && <PiCaretRightBold className="text-xs animate-pulse" />}
                        </button>

                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all group ${activeTab === 'notifications'
                                ? 'bg-[#5e48b8] text-white shadow-lg shadow-[#5e48b8]/20 translate-x-1'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <PiBell className="text-lg" />
                                Notifications
                            </div>
                            {activeTab === 'notifications' && <PiCaretRightBold className="text-xs animate-pulse" />}
                        </button>

                        <button
                            onClick={() => setActiveTab('regional')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all group ${activeTab === 'regional'
                                ? 'bg-[#5e48b8] text-white shadow-lg shadow-[#5e48b8]/20 translate-x-1'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <PiGlobe className="text-lg" />
                                Regional
                            </div>
                            {activeTab === 'regional' && <PiCaretRightBold className="text-xs animate-pulse" />}
                        </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#5e48b8] to-[#72eae1] text-white overflow-hidden relative group shadow-xl">
                        <div className="relative z-10">
                            <PiShieldCheck className="text-3xl mb-3 opacity-90" />
                            <h3 className="font-bold text-lg mb-1">Enterprise Plan</h3>
                            <p className="text-xs opacity-80 mb-4">Your organization is on the Enterprise tier with advanced security features.</p>
                            <button className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
                                View License
                            </button>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9 space-y-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <AnimatePresence mode="wait">
                        {/* Organization Profile Tab */}
                        {activeTab === 'organization' && isAdmin && (
                            <motion.div
                                key="organization"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="gds-glass p-0 overflow-hidden"
                            >
                                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-lg text-[#5e48b8]">
                                            <PiStorefront className="text-xl" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg text-gray-900">Organization Profile</h2>
                                            <p className="text-xs text-gray-500">Manage your company's public information</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-200">
                                        Verified Entity
                                    </span>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Company Name</label>
                                        <input
                                            type="text"
                                            value={formData.companyName}
                                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#5e48b8] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Registration Number</label>
                                        <input
                                            type="text"
                                            value={formData.registrationNumber}
                                            onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#5e48b8] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Primary Currency</label>
                                        <div className="relative">
                                            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#5e48b8] transition-all appearance-none cursor-pointer">
                                                <option>USD - US Dollar</option>
                                                <option>KES - Kenyan Shilling</option>
                                                <option>SSP - South Sudanese Pound</option>
                                            </select>
                                            <PiCaretDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Fiscal Year End</label>
                                        <input type="date" defaultValue="2026-12-31" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#5e48b8] transition-all" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Headquarters Address</label>
                                        <textarea
                                            rows={2}
                                            value={formData.headquartersAddress}
                                            onChange={(e) => handleInputChange('headquartersAddress', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#5e48b8] transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Personal Profile Tab */}
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="gds-glass p-0 overflow-hidden"
                            >
                                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                            <PiUserCircle className="text-xl" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg text-gray-900">Personal Profile</h2>
                                            <p className="text-xs text-gray-500">Your account details and preferences</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="flex items-start gap-8 mb-8">
                                        <div className="w-20 h-20 rounded-2xl bg-[#29258D] text-white flex items-center justify-center text-3xl font-heading font-bold shadow-xl shadow-indigo-500/20">
                                            {user.name?.[0] || 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                                            <p className="text-sm font-medium text-gray-500 mb-2">{user.position} &bull; {user.department}</p>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wide border border-purple-100">
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#5e48b8] transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                                            <input
                                                type="email"
                                                defaultValue={user.email || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 cursor-not-allowed outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                                            <PhoneInput
                                                value={formData.phoneNumber}
                                                onChange={(value) => handleInputChange('phoneNumber', value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Language</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.language}
                                                    onChange={(e) => handleInputChange('language', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#5e48b8] transition-all appearance-none cursor-pointer"
                                                >
                                                    <option>English (UK)</option>
                                                    <option>Swahili</option>
                                                    <option>French</option>
                                                </select>
                                                <PiCaretDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <motion.div
                                key="notifications"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="gds-glass p-0 overflow-hidden"
                            >
                                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                            <PiBell className="text-xl" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg text-gray-900">Notification Preferences</h2>
                                            <p className="text-xs text-gray-500">Control when and how you receive alerts</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    {Object.entries(formData.notifications).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#5e48b8]/20 transition-all">
                                            <div>
                                                <h4 className="font-bold text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                <p className="text-xs text-gray-500">Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
                                            </div>
                                            <button
                                                onClick={() => handleNotificationToggle(key as keyof typeof formData.notifications)}
                                                className="text-2xl transition-all hover:scale-110 active:scale-90"
                                            >
                                                {value ?
                                                    <PiToggleRight className="text-[#5e48b8] text-4xl" /> :
                                                    <PiToggleLeft className="text-gray-300 text-4xl" />
                                                }
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Regional Tab */}
                        {activeTab === 'regional' && (
                            <motion.div
                                key="regional"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="gds-glass p-0 overflow-hidden"
                            >
                                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <PiGlobe className="text-xl" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg text-gray-900">Regional Settings</h2>
                                            <p className="text-xs text-gray-500">Timezone, currency and localization dates</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Time Zone</label>
                                        <div className="relative">
                                            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#5e48b8] transition-all appearance-none cursor-pointer">
                                                <option>Africa/Nairobi (EAT) GMT+3</option>
                                                <option>Africa/Juba (CAT) GMT+2</option>
                                            </select>
                                            <PiCaretDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Date Format</label>
                                        <div className="relative">
                                            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#5e48b8] transition-all appearance-none cursor-pointer">
                                                <option>DD/MM/YYYY (24/01/2026)</option>
                                                <option>MM/DD/YYYY (01/24/2026)</option>
                                                <option>YYYY-MM-DD (2026-01-24)</option>
                                            </select>
                                            <PiCaretDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
