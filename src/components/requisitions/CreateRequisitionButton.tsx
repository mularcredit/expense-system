"use client";

import { useState } from "react";
import { PiPlus } from "react-icons/pi";
import { RequisitionTypeModal } from "./RequisitionTypeModal";

interface CreateRequisitionButtonProps {
    requisitions: any[];
}

export function CreateRequisitionButton({ requisitions }: CreateRequisitionButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter eligible requisitions (PENDING, APPROVED, or PAID)
    const eligibleRequisitions = requisitions.filter(r =>
        ['PENDING', 'APPROVED', 'PAID'].includes(r.status)
    );

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-md font-medium text-xs hover:bg-gray-50 transition-all flex items-center gap-2 shadow-none"
            >
                <PiPlus />
                <span>Create New Requisition</span>
            </button>

            <RequisitionTypeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                existingRequisitions={eligibleRequisitions}
            />
        </>
    );
}
