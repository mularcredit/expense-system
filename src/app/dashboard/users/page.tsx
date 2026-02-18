'use client';

import { useState, useEffect } from 'react';
import { getPendingUsers, approveUser, rejectUser } from '@/app/actions/admin';
import { PiCheck, PiX, PiUser, PiSpinner } from 'react-icons/pi';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const res = await getPendingUsers();
        if (res.success) {
            setUsers(res.data || []);
        }
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        setProcessing(id);
        const res = await approveUser(id);
        if (res.success) {
            await loadUsers(); // Refresh list
        } else {
            alert('Failed to approve user');
        }
        setProcessing(null);
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject this user?')) return;
        setProcessing(id);
        const res = await rejectUser(id);
        if (res.success) {
            await loadUsers();
        } else {
            alert('Failed to reject user');
        }
        setProcessing(null);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Account Requests</h1>
                    <p className="text-slate-500 text-sm mt-1">Review and approve new user registrations.</p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    {users.length} Pending
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <PiSpinner className="animate-spin text-3xl text-indigo-500" />
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <PiUser className="text-2xl" />
                    </div>
                    <h3 className="text-slate-600 font-medium">No pending requests</h3>
                    <p className="text-slate-400 text-sm mt-1">All caught up! Check back later.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {users.map((user) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg uppercase">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{user.name}</h3>
                                        <p className="text-slate-500 text-sm">{user.email}</p>
                                        <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                                            <span>Position: {user.position || 'N/A'}</span>
                                            <span>•</span>
                                            <span>Requested: {new Date(user.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleReject(user.id)}
                                        disabled={!!processing}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                        title="Reject"
                                    >
                                        <PiX className="text-lg" /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(user.id)}
                                        disabled={!!processing}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2 text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing === user.id ? (
                                            <PiSpinner className="animate-spin" />
                                        ) : (
                                            <PiCheck className="text-lg" />
                                        )}
                                        Approve Access
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
