'use client';

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PiX, PiCheckCircle, PiSpinner, PiUser, PiEnvelope, PiBriefcase, PiLock, PiArrowsClockwise } from "react-icons/pi";
import { useToast } from "@/components/ui/ToastProvider";
import { createUser, updateUser } from "./actions";
import { useRouter } from "next/navigation";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: any;
}

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
    const { showToast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [roles, setRoles] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        // Fetch roles
        fetch('/api/roles')
            .then(res => res.json())
            .then(data => {
                if (data.roles) setRoles(data.roles);
            })
            .catch(err => console.error("Failed to fetch roles", err));
    }, []);

    const [password, setPassword] = useState("");

    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let newPassword = "";
        for (let i = 0; i < 12; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(newPassword);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);

            // Handle Custom Roles logic
            const rawRole = formData.get('role') as string;
            if (rawRole.startsWith('custom:')) {
                const customId = rawRole.split(':')[1];
                formData.set('role', 'CUSTOM'); // Or keep it as display name? Action expects 'CUSTOM' if customRoleId is set? No, action sets 'CUSTOM' if customRoleId is present.
                // Actually, let's just send the rawRole to the Action?
                // No, the Action expects 'role' to be string (e.g. 'EMPLOYEE') AND 'customRoleId' (optional).
                // So:
                formData.set('role', 'CUSTOM');
                formData.set('customRoleId', customId);
            } else {
                // Ensure customRoleId is cleared if switching back to legacy
                formData.delete('customRoleId');
            }

            let res;

            if (user) {
                res = await updateUser(user.id, formData);
            } else {
                res = await createUser(formData);
            }

            if (res.success) {
                showToast(`User ${user ? 'updated' : 'created'} successfully`, "success");
                router.refresh();
                onClose();
            } else {
                showToast(res.error || "Operation failed", "error");
            }
        } catch (error) {
            showToast("An error occurred", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-white/40 backdrop-blur-xl"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white border border-gray-200 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans"
                    >
                        {/* Header */}
                        <div className="h-[88px] px-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    {user ? 'Edit Team Member' : 'Create User Account'}
                                </h3>
                                <p className="text-gray-500 text-xs mt-1 font-medium">
                                    {user ? 'Update user details and permissions' : 'Create a new account and set login credentials'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                            >
                                <PiX className="text-xl" />
                            </button>
                        </div>

                        {/* Body - using bg-[#f8f9fa] for consistency */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8f9fa] p-8 space-y-6">

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Full Name *</label>
                                    <div className="relative">
                                        <PiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            name="name"
                                            defaultValue={user?.name}
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all"
                                            placeholder="e.g. Jane Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Email Address *</label>
                                    <div className="relative">
                                        <PiEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            name="email"
                                            type="email"
                                            defaultValue={user?.email}
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all"
                                            placeholder="jane@company.com"
                                        />
                                    </div>
                                </div>

                                {!user && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5 flex justify-between">
                                            <span>Initial Password *</span>
                                            <button
                                                type="button"
                                                onClick={generatePassword}
                                                className="text-[#29258D] hover:underline flex items-center gap-1 normal-case"
                                            >
                                                <PiArrowsClockwise /> Generate Strong Password
                                            </button>
                                        </label>
                                        <div className="relative">
                                            <PiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                name="password"
                                                type="text" // Changed to text so they can see the generated one
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all font-mono"
                                                placeholder="Click generate or type..."
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 pl-1">
                                            Must be at least 8 characters. Share this with the user securely.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Role *</label>
                                        <div className="relative">
                                            <select
                                                name="role"
                                                defaultValue={user?.customRoleId ? `custom:${user.customRoleId}` : (user?.role || 'EMPLOYEE')}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all appearance-none cursor-pointer"
                                            >
                                                <optgroup label="Standard Roles">
                                                    <option value="EMPLOYEE">Employee</option>
                                                    <option value="MANAGER">Manager</option>
                                                    <option value="FINANCE_WRITER">Finance Writer</option>
                                                    <option value="FINANCE_APPROVER">Finance Approver</option>
                                                    <option value="SYSTEM_ADMIN">System Admin</option>
                                                </optgroup>
                                                {roles.length > 0 && (
                                                    <optgroup label="Custom Roles">
                                                        {roles.map((role) => (
                                                            <option key={role.id} value={`custom:${role.id}`}>
                                                                {role.name}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Department</label>
                                        <div className="relative">
                                            <PiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                name="department"
                                                defaultValue={user?.department}
                                                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all"
                                                placeholder="e.g. Sales"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Position</label>
                                    <input
                                        name="position"
                                        defaultValue={user?.position}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all"
                                        placeholder="e.g. Regional Manager"
                                    />
                                </div>
                            </div>

                            {/* Form Footer embedded in form to scroll with content if needed, but better sticky */}
                            <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2.5 rounded-md text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 rounded-md text-xs font-medium text-white bg-[#29258D] hover:bg-[#29258D]/90 transition-all flex items-center gap-2 disabled:opacity-50 shadow-none font-bold"
                                >
                                    {isSubmitting ? <PiSpinner className="animate-spin" /> : <PiCheckCircle />}
                                    {user ? 'Save Changes' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
