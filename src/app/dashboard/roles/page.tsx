import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    PiShieldCheck,
    PiPlus,
    PiUsers,
    PiLockKey,
    PiPencil,
    PiTrash,
    PiWarningCircle
} from "react-icons/pi";
import { requirePermission } from "@/lib/access-control";

export default async function RolesPage() {
    const session = await auth();

    // Updated permission check using the new helper
    // Allows SYSTEM_ADMIN or anyone with ROLES.VIEW permission
    requirePermission(session, ['ROLES.VIEW', 'ROLES.MANAGE']);

    const roles = await prisma.role.findMany({
        include: {
            permissions: {
                include: {
                    permission: true
                }
            },
            _count: {
                select: { users: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-emerald)]">
                        Manage user roles and access control
                    </p>
                </div>
                {/* Only allow Create if MANAGE permission */}
                {((session?.user as any).role === 'SYSTEM_ADMIN' || (session?.user as any).permissions?.includes('ROLES.MANAGE')) && (
                    <Link
                        href="/dashboard/roles/new"
                        className="px-6 py-3 bg-[var(--gds-emerald)] text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2"
                    >
                        <PiPlus className="text-xl" />
                        Create Role
                    </Link>
                )}
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => (
                    <div key={role.id} className="gds-glass p-6 space-y-4 hover:border-[var(--gds-emerald)]/30 transition-all">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[var(--gds-emerald)]/10 flex items-center justify-center">
                                    <PiShieldCheck className="text-2xl text-[var(--gds-emerald)]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gds-text-main flex items-center gap-2">
                                        {role.name}
                                        {role.isSystem && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold uppercase tracking-wide">
                                                System
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gds-text-muted">{role.description || 'No description'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--gds-border)]">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-gds-text-muted mb-1">
                                    <PiUsers className="text-sm" />
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Users</p>
                                </div>
                                <p className="text-2xl font-heading font-bold text-gds-text-main">{role._count.users}</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-gds-text-muted mb-1">
                                    <PiLockKey className="text-sm" />
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Permissions</p>
                                </div>
                                <p className="text-2xl font-heading font-bold text-gds-text-main">{role.permissions.length}</p>
                            </div>
                        </div>

                        {/* Permissions Preview */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gds-text-muted uppercase tracking-wider">Key Permissions</p>
                            <div className="flex flex-wrap gap-1">
                                {role.permissions.slice(0, 6).map(rp => (
                                    <span
                                        key={rp.permission.id}
                                        className="text-[9px] px-2 py-0.5 rounded bg-[var(--gds-surface-bright)] text-gds-text-muted font-mono"
                                    >
                                        {rp.permission.resource}.{rp.permission.action}
                                    </span>
                                ))}
                                {role.permissions.length > 6 && (
                                    <span className="text-[9px] px-2 py-0.5 rounded bg-[var(--gds-surface-bright)] text-gds-text-muted font-bold">
                                        +{role.permissions.length - 6} more
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <Link
                                href={`/dashboard/roles/${role.id}`}
                                className="flex-1 py-2 px-4 bg-[var(--gds-surface)] border border-[var(--gds-border)] text-gds-text-main font-bold rounded-lg hover:bg-[var(--gds-surface-bright)] transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <PiPencil />
                                Edit
                            </Link>
                            {!role.isSystem && (
                                <button
                                    className="py-2 px-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold rounded-lg hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <PiTrash />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Banner */}
            <div className="gds-glass p-6 border-l-4 border-[var(--gds-blue-bright)]">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--gds-blue-bright)]/10 flex items-center justify-center flex-shrink-0">
                        <PiWarningCircle className="text-xl text-[var(--gds-blue-bright)]" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gds-text-main mb-1">About System Roles</h4>
                        <p className="text-sm text-gds-text-muted">
                            System roles (marked with a blue badge) are built-in and cannot be deleted. They provide baseline access levels for common user types.
                            You can create custom roles with specific permission combinations to match your organization's needs.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
