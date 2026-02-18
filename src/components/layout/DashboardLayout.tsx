"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SetupBanner } from "@/components/onboarding/SetupBanner";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { useState } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="font-sans relative bg-[#f8f9fa] min-h-screen" style={{ color: 'var(--gds-text-main)' }}>

            {/* Global Ambient Background - Clean Faint Grey with Subtle Smart Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                {/* Top Right: Subtle Indigo Glow */}
                <div className="absolute top-[-10%] right-[-5%] w-[1000px] h-[1000px] bg-indigo-100/40 rounded-full blur-3xl mix-blend-multiply opacity-50"></div>

                {/* Top Left: Subtle Cyan Glow */}
                <div className="absolute top-[10%] left-[-10%] w-[800px] h-[800px] bg-cyan-100/40 rounded-full blur-3xl mix-blend-multiply opacity-50"></div>

                {/* Bottom: Subtle Balancer */}
                <div className="absolute -bottom-[20%] left-[20%] w-[1200px] h-[800px] bg-slate-100/60 rounded-full blur-3xl mix-blend-multiply"></div>
            </div>

            <Sidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div className="flex flex-col min-h-screen lg:pl-[280px] relative transition-all duration-300 ease-in-out dash-main">
                <Header onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
                <main className="flex-1 p-4 md:p-8 w-full">
                    {/* Onboarding Components */}
                    <SetupBanner />
                    <OnboardingTutorial />

                    {children}
                </main>
            </div>
        </div>
    );
}
