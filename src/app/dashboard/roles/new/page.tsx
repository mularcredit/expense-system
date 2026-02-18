"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import {
    PiShieldCheck,
    PiCheckCircle,
    PiArrowLeft,
    PiLockKey,
    PiSpinner
} from "react-icons/pi";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Permission {
    id: string;
    resource: string;
    action: string;
    description: string | null;
}

export default function NewRolePage() {
    const router = useRouter();
    const { showToast } = useToast();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [maxApprovalLimit, setMaxApprovalLimit] = useState<string>("");
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            const response = await fetch('/api/permissions');
            const data = await response.json();
            setPermissions(data.permissions);
            setGroupedPermissions(data.grouped);
        } catch (error) {
            showToast('Failed to load permissions', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePermission = (permId: string) => {
        const newSet = new Set(selectedPermissions);
        if (newSet.has(permId)) {
            newSet.delete(permId);
        } else {
            newSet.add(permId);
        }
        setSelectedPermissions(newSet);
    };

    const toggleAllInResource = (resource: string) => {
        const resourcePerms = groupedPermissions[resource] || [];
        const allSelected = resourcePerms.every(p => selectedPermissions.has(p.id));

        const newSet = new Set(selectedPermissions);
        resourcePerms.forEach(p => {
            if (allSelected) {
                newSet.delete(p.id);
            } else {
                newSet.add(p.id);
            }
        });
        setSelectedPermissions(newSet);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            showToast('Role name is required', 'error');
            return;
        }

        if (selectedPermissions.size === 0) {
            showToast('Please select at least one permission', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    maxApprovalLimit,
                    permissionIds: Array.from(selectedPermissions)
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast('Role created successfully', 'success');
            router.push('/dashboard/roles');
        } catch (error: any) {
            showToast(error.message || 'Failed to create role', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#29258D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading permissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 font-sans pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/roles"
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <PiArrowLeft className="text-xl" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Create New Role</h1>
                    <p className="text-sm text-gray-500">Define a custom role with specific permissions</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Role Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden sticky top-6">
                        <div className="bg-white px-6 h-[72px] flex items-center gap-3 border-b border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-[#29258D]/10 flex items-center justify-center">
                                <PiShieldCheck className="text-lg text-[#29258D]" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Role Details</h3>
                        </div>

                        <div className="p-6 space-y-5 bg-[#F6F6F6]">
                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1.5">
                                    Role Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Regional Manager"
                                    required
                                    className="bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1.5">
                                    Max Approval Limit ($)
                                </label>
                                <Input
                                    type="number"
                                    value={maxApprovalLimit}
                                    onChange={(e) => setMaxApprovalLimit(e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                    className="bg-white"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Requisitions above this amount will require higher approval or be blocked.
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of this role's purpose..."
                                    rows={4}
                                    className="w-full bg-white border border-gray-200 rounded-md py-2.5 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all resize-none shadow-sm"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Selected Permissions</p>
                                    <span className="text-sm font-bold text-[#29258D]">
                                        {selectedPermissions.size}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {selectedPermissions.size === 0
                                        ? 'No permissions selected yet'
                                        : `${selectedPermissions.size} permission${selectedPermissions.size !== 1 ? 's' : ''} assigned to this role`
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-4 border-t border-gray-100">
                            <Button
                                type="submit"
                                disabled={isSaving || !name.trim() || selectedPermissions.size === 0}
                                className="w-full"
                            >
                                {isSaving ? <PiSpinner className="animate-spin text-lg" /> : <PiCheckCircle className="text-lg" />}
                                {isSaving ? 'Creating...' : 'Create Role'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column - Permissions Grid */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-white px-6 h-[72px] flex items-center justify-between border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                    <PiLockKey className="text-lg text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Permissions</h3>
                                    <p className="text-xs text-gray-500">Select the permissions this role should have</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-[#F6F6F6] space-y-6">
                            {Object.entries(groupedPermissions).map(([resource, perms]) => {
                                const allSelected = perms.every(p => selectedPermissions.has(p.id));

                                return (
                                    <div key={resource} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-[#29258D]"></span>
                                                {resource}
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={() => toggleAllInResource(resource)}
                                                className={cn(
                                                    "text-[10px] font-bold px-3 py-1.5 rounded-md transition-all uppercase tracking-wide",
                                                    allSelected
                                                        ? "bg-[#29258D]/10 text-[#29258D]"
                                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                )}
                                            >
                                                {allSelected ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {perms.map(perm => (
                                                <button
                                                    key={perm.id}
                                                    type="button"
                                                    onClick={() => togglePermission(perm.id)}
                                                    className={cn(
                                                        "p-3 rounded-md border text-left transition-all",
                                                        selectedPermissions.has(perm.id)
                                                            ? "bg-[#29258D]/5 border-[#29258D] text-[#29258D]"
                                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className={cn(
                                                            "w-4 h-4 rounded flex items-center justify-center transition-all border",
                                                            selectedPermissions.has(perm.id)
                                                                ? "bg-[#29258D] border-[#29258D]"
                                                                : "border-gray-300 bg-white"
                                                        )}>
                                                            {selectedPermissions.has(perm.id) && (
                                                                <PiCheckCircle className="text-white text-[10px]" />
                                                            )}
                                                        </div>
                                                        <span className={cn("text-xs font-mono font-medium", selectedPermissions.has(perm.id) ? "text-[#29258D]" : "text-gray-900")}>
                                                            {perm.action}
                                                        </span>
                                                    </div>
                                                    {perm.description && (
                                                        <p className="text-[10px] text-gray-400 line-clamp-2 pl-6">
                                                            {perm.description}
                                                        </p>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
