import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-[var(--gds-primary)] text-white shadow hover:bg-[var(--gds-primary)]/80",
                secondary:
                    "border-transparent bg-white/10 text-[var(--gds-text-main)] hover:bg-white/20",
                destructive:
                    "border-transparent bg-red-500/10 text-red-600 shadow hover:bg-red-500/20",
                outline: "text-[var(--gds-text-main)] border-[var(--gds-border)]",
                success: "border-transparent bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
                warning: "border-transparent bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
                info: "border-transparent bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20",
                purple: "border-transparent bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
