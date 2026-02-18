"use client";

import { useState } from "react";
import { PiReceipt } from "react-icons/pi";
import { RequisitionTypeModal } from "@/components/requisitions/RequisitionTypeModal";
import { getEligibleRequisitions } from "@/app/dashboard/requisitions/new/multi-item-actions";

export function GlobalNewRequisitionButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requisitions, setRequisitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);

    const handleOpen = async () => {
        setIsModalOpen(true);

        // Fetch data if not already loaded or if list is empty (to refresh)
        if (!dataLoaded || requisitions.length === 0) {
            setLoading(true);
            try {
                const data = await getEligibleRequisitions();
                setRequisitions(data);
                setDataLoaded(true);
            } catch (error) {
                console.error("Failed to fetch requisitions", error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="px-3 py-2 rounded-lg border border-transparent transition-all group flex items-center gap-2 hover:border-purple-500/30 hover:bg-purple-500/5 hover:scale-105 bg-white/50"
                title="New Requisition"
            >
                <PiReceipt className="text-lg transition-colors text-gray-500 group-hover:text-purple-600" />
                <span className="text-xs font-bold transition-colors text-gray-500 group-hover:text-purple-600 hidden lg:inline">Requisition</span>
            </button>

            <RequisitionTypeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                existingRequisitions={requisitions}
                isLoading={loading}
            />
        </>
    );
}
