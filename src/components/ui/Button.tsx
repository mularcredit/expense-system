"use client";

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-[5px] text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-[#29258D] text-white hover:bg-[#29258D]/90 shadow-sm",
                secondary:
                    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm",
                outline:
                    "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900",
                ghost: "hover:bg-gray-100 hover:text-gray-900",
                link: "text-[#29258D] underline-offset-4 hover:underline",
                premium: "bg-gradient-to-r from-emerald-400 to-cyan-400 text-white hover:brightness-110 shadow-lg shadow-emerald-500/25 border border-white/10",
                destructive: "bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20",
                success: "bg-green-600 text-white hover:bg-green-700 shadow-sm border border-green-700/10",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-[5px] px-3",
                lg: "h-11 rounded-[5px] px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, children, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            >
                {children}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
