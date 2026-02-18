import { BiFile, BiPlus } from "react-icons/bi";

export default function ContractsPage() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-cyan)]">
                        Vendor agreements, renewals & compliance
                    </p>
                </div>
                <button className="gds-btn-premium flex items-center gap-2">
                    <BiPlus className="text-lg" />
                    <span>New contract</span>
                </button>
            </div>

            <div className="gds-glass p-12 text-center">
                <BiFile className="text-6xl mx-auto mb-4 text-gds-text-muted opacity-20" />
                <h2 className="text-2xl font-bold text-gds-text-main mb-2">Contract Repository</h2>
                <p className="text-gds-text-muted">Centralized contract management with automated renewal alerts.</p>
            </div>
        </div>
    );
}
