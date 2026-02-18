'use client';

import { useState } from 'react';
import { BiPlus, BiPencil, BiTrash, BiUser, BiBuilding, BiBadgeCheck, BiBlock } from 'react-icons/bi';
import { UserModal } from './UserModal';
import { toggleUserStatus, deleteUser } from './actions';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter } from 'next/navigation';
import { DeleteEntityButton } from '@/components/dashboard/DeleteEntityButton';

interface TeamClientProps {
    initialUsers: any[];
}

export function TeamClient({ initialUsers }: TeamClientProps) {
    const [users, setUsers] = useState(initialUsers);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const { showToast } = useToast();
    const router = useRouter();

    const handleCreate = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleToggleStatus = async (user: any) => {
        try {
            const newStatus = !user.isActive;
            const res = await toggleUserStatus(user.id, newStatus);
            if (res.success) {
                showToast(`User ${newStatus ? 'activated' : 'suspended'} successfully`, 'success');
                router.refresh(); // Refresh server data
                // Optimistic update
                setUsers(users.map(u => u.id === user.id ? { ...u, isActive: newStatus, accountStatus: newStatus ? 'ACTIVE' : 'SUSPENDED' } : u));
            } else {
                showToast(res.error || 'Failed to update status', 'error');
            }
        } catch (error) {
            showToast('An error occurred', 'error');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-purple)]">
                        User roles, permissions & department structure
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="gds-btn-premium flex items-center gap-2"
                >
                    <BiPlus className="text-lg" />
                    <span>Create User Account</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <div key={user.id} className="relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(user)}
                                className="p-2 rounded-full bg-white/80 shadow-sm text-gray-500 hover:text-[var(--gds-purple)] transition-colors"
                            >
                                <BiPencil />
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete this user?')) {
                                        const res = await deleteUser(user.id);
                                        if (res.success) {
                                            showToast('User deleted successfully', 'success');
                                            // Optimistic update
                                            setUsers(users.filter(u => u.id !== user.id));
                                            router.refresh();
                                        } else {
                                            showToast(res.error || 'Failed to delete user', 'error');
                                        }
                                    }
                                }}
                                className="p-2 rounded-full bg-white/80 shadow-sm text-gray-500 hover:text-rose-500 transition-colors"
                            >
                                <BiTrash />
                            </button>
                        </div>

                        <div className="gds-glass p-6 h-full flex flex-col justify-between">
                            <div className="mb-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-full bg-[var(--gds-purple)]/10 flex items-center justify-center text-[var(--gds-purple)] text-xl font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {user.accountStatus}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gds-text-main mb-1 line-clamp-1">{user.name}</h3>
                                <p className="text-xs text-gds-text-muted mb-4">{user.email}</p>

                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center gap-2 text-xs text-gds-text-muted">
                                        <BiBadgeCheck className="text-[var(--gds-cyan)]" />
                                        <span className="font-medium text-gray-700">{user.role}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gds-text-muted">
                                        <BiBuilding className="text-[var(--gds-cyan)]" />
                                        <span>{user.department || 'No Department'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gds-text-muted">
                                        <BiUser className="text-[var(--gds-cyan)]" />
                                        <span>{user.position || 'No Position'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--gds-border)] flex justify-between items-center gap-2">
                                <button
                                    onClick={() => handleToggleStatus(user)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${user.isActive
                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                        }`}
                                >
                                    {user.isActive ? 'Suspend User' : 'Activate User'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
            />
        </div>
    );
}
