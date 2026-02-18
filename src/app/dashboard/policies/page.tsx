import { BiShieldAlt, BiPlus } from "react-icons/bi";
import prisma from "@/lib/prisma";
import { PolicyManager } from "@/components/dashboard/PolicyManager";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PoliciesPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/login");

    const policies = await prisma.policy.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-8 animate-fade-in-up pb-12">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-blue-bright)]">
                        Automated compliance rules & spend controls
                    </p>
                </div>
            </div>

            <PolicyManager policies={policies} />
        </div>
    );
}
