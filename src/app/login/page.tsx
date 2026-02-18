"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { BiEnvelope, BiLockAlt } from "react-icons/bi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginComponent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const signupSuccess = searchParams.get("signup") === "success";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signIn("credentials", {
                email,
                password,
                callbackUrl: "/dashboard",
            });
        } catch (err) {
            setError("Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex font-sans">
            {/* Left Side - Background Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <Image
                    src="/32437012675_8a4088cc6b_o-1024x683.avif"
                    alt="Background"
                    fill
                    className="object-cover object-center"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#29258D]/90 to-black/70 backdrop-blur-[1px]">
                    <div className="h-full flex flex-col justify-between p-12">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3">
                            <Image
                                src="/capitalpay.png"
                                alt="Capital Pay"
                                width={140}
                                height={32}
                                className="h-8 w-auto object-contain"
                            />
                        </Link>

                        {/* Center Content */}
                        <div className="text-white">
                            <h2 className="text-4xl font-bold mb-4">
                                Streamline Your<br />Business Finances
                            </h2>
                            <p className="text-lg text-white/80 max-w-md">
                                Manage expenses, invoices, and accounting all in one powerful platform.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="text-white/60 text-sm">
                            © 2026 CapitalPay. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <Link href="/" className="inline-block">
                            <Image
                                src="/capitalpay.png"
                                alt="Capital Pay"
                                width={120}
                                height={28}
                                className="h-7 w-auto object-contain"
                            />
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-600 text-sm">Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {signupSuccess && (
                            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold text-center border border-emerald-200">
                                Request submitted! Please wait for admin approval.
                            </div>
                        )}
                        {error && (
                            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm font-semibold text-center border border-rose-200">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-normal text-gray-500 mb-1.5">
                                    Email address
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    required
                                    icon={<BiEnvelope className="text-gray-400" />}
                                    className="pl-10 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-normal text-gray-500 mb-1.5">
                                    Password
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    icon={<BiLockAlt className="text-gray-400" />}
                                    className="pl-10 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-[#29258D] focus:ring-[#29258D]"
                                />
                                <span className="text-sm font-medium text-gray-700">Remember me</span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-sm font-semibold text-[#29258D] hover:text-[#29258D]/80 transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#29258D] hover:bg-[#29258D]/90 font-semibold"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{" "}
                                <Link
                                    href="/signup"
                                    className="font-semibold text-[#29258D] hover:text-[#29258D]/80 transition-colors"
                                >
                                    Request Access
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-900">Loading...</div>}>
            <LoginComponent />
        </Suspense>
    );
}
