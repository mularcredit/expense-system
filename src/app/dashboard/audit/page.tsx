import { BiHistory } from "react-icons/bi";

export default function AuditPage() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-blue-bright)]">
                        Complete transaction history & compliance logs
                    </p>
                </div>
            </div>

            <div className="gds-glass p-12 text-center">
                <BiHistory className="text-6xl mx-auto mb-4 text-gds-text-muted opacity-20" />
                <h2 className="text-2xl font-bold text-gds-text-main mb-2">Audit & Compliance</h2>
                <p className="text-gds-text-muted">Comprehensive audit trails and compliance reporting tools.</p>
            </div>
        </div>
    );
}
