"use client";

import { useState } from "react";
import { PiPlus, PiCheckCircleFill, PiWarningCircle } from "react-icons/pi";
import { cn } from "@/lib/utils";

interface StripeConnectButtonProps {
    status: string;
}

export function StripeConnectButton({ status }: StripeConnectButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/stripe/connect', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to get Stripe URL');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to connect to Stripe. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'COMPLETED') {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-bold">
                <PiCheckCircleFill className="text-lg" />
                Stripe Connected
            </div>
        );
    }

    return (
        <button
            onClick={handleConnect}
            disabled={isLoading}
            className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm",
                status === 'PENDING'
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-[#635BFF] hover:bg-[#5851E0] text-white"
            )}
        >
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : status === 'PENDING' ? (
                <>
                    <PiWarningCircle className="text-lg" />
                    Complete Stripe Setup
                </>
            ) : (
                <>
                    <PiPlus className="text-lg" />
                    Connect Stripe Account
                </>
            )}
        </button>
    );
}
