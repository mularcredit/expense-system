'use client';

import { useState } from 'react';
import { useApproval } from '@/lib/hooks/useWorkflow';
import { PiCheck, PiX, PiSpinner } from 'react-icons/pi';

interface ApprovalActionsProps {
    approvalId: string;
    itemTitle: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { cn } from '@/lib/utils';

export function ApprovalActions({
    approvalId,
    itemTitle,
    onSuccess,
    onError
}: ApprovalActionsProps) {
    const { approve, reject, loading } = useApproval();
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [comments, setComments] = useState('');
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);

    const handleApprove = async () => {
        try {
            await approve(approvalId, comments);
            setShowCommentModal(false);
            setComments('');
            onSuccess?.();
        } catch (error: any) {
            onError?.(error.message);
        }
    };

    const handleReject = async () => {
        if (!comments.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await reject(approvalId, comments);
            setShowCommentModal(false);
            setComments('');
            onSuccess?.();
        } catch (error: any) {
            onError?.(error.message);
        }
    };

    const openCommentModal = (actionType: 'approve' | 'reject') => {
        setAction(actionType);
        setShowCommentModal(true);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => openCommentModal('approve')}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#29258D] text-white text-xs font-bold rounded-md hover:bg-[#29258D]/90 transition-all disabled:opacity-50 shadow-sm"
                >
                    {loading ? (
                        <PiSpinner className="animate-spin" size={16} />
                    ) : (
                        <PiCheck size={16} />
                    )}
                    Approve
                </button>

                <button
                    onClick={() => openCommentModal('reject')}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-rose-100 text-rose-500 text-xs font-bold rounded-md hover:bg-rose-50 transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <PiSpinner className="animate-spin" size={16} />
                    ) : (
                        <PiX size={16} />
                    )}
                    Reject
                </button>
            </div>

            {/* Comment Modal */}
            {showCommentModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <Card className="max-w-md w-full overflow-hidden animate-scale-in">
                        <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
                            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <span className={cn(
                                    "w-1.5 h-4 rounded-full",
                                    action === 'approve' ? "bg-[#29258D]" : "bg-rose-500"
                                )}></span>
                                {action === 'approve' ? 'Approve' : 'Reject'} Request
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Item</p>
                            <h4 className="text-gray-900 font-bold mb-6">{itemTitle}</h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                        Resolution Notes {action === 'reject' && <span className="text-rose-500">*</span>}
                                    </label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder={action === 'approve' ? 'Add any approval notes (optional)...' : 'Briefly explain the reason for rejection...'}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:bg-white transition-all resize-none"
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={action === 'approve' ? handleApprove : handleReject}
                                disabled={loading}
                                className={cn(
                                    "flex-1 py-2.5 text-xs font-bold rounded-md transition-all shadow-sm text-white",
                                    action === 'approve' ? "bg-[#29258D] hover:bg-[#29258D]/90" : "bg-rose-500 hover:bg-rose-600"
                                )}
                            >
                                {loading ? 'Processing...' : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                            </button>

                            <button
                                onClick={() => {
                                    setShowCommentModal(false);
                                    setComments('');
                                }}
                                disabled={loading}
                                className="flex-1 py-2.5 text-xs font-bold rounded-md bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </>
    );
}

/**
 * Quick approve/reject buttons without modal (for simple cases)
 */
interface QuickApprovalActionsProps {
    approvalId: string;
    onSuccess?: () => void;
}

export function QuickApprovalActions({ approvalId, onSuccess }: QuickApprovalActionsProps) {
    const { approve, reject, loading } = useApproval();

    const handleQuickApprove = async () => {
        try {
            await approve(approvalId);
            onSuccess?.();
        } catch (error) {
            console.error('Approval failed:', error);
        }
    };

    const handleQuickReject = async () => {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            await reject(approvalId, reason);
            onSuccess?.();
        } catch (error) {
            console.error('Rejection failed:', error);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleQuickApprove}
                disabled={loading}
                className="p-2 text-[#29258D] hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                title="Approve"
            >
                <PiCheck size={18} />
            </button>

            <button
                onClick={handleQuickReject}
                disabled={loading}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                title="Reject"
            >
                <PiX size={18} />
            </button>
        </div>
    );
}
