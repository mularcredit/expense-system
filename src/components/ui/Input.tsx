"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    label?: string; // Add label to interface
    error?: string; // Add error to interface
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, icon, label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-xs font-normal leading-none text-gray-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {label}
                    </label>
                )}
                <div className="relative group w-full">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#29258D] transition-colors">
                            {icon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-10 w-full rounded-[5px] border border-gray-300 bg-transparent px-3 py-2 text-xs ring-offset-transparent file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus:bg-transparent active:bg-transparent focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 transition-all shadow-none appearance-none",
                            icon ? "pl-10" : "",
                            error ? "border-red-500 focus-visible:ring-red-500" : "",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs font-medium text-red-500 animate-slide-in-right">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
