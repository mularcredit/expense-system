"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BiEnvelope, BiArrowBack } from "react-icons/bi";
import { PiCheckCircle } from "react-icons/pi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setSent(true);
            } else {
                const data = await res.json();
                setError(data.error || "Something went wrong.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
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
                        <Link href="/" className="flex items-center gap-3">
                            <Image
                                src="/capitalpay.png"
                                alt="Capital Pay"
                                width={140}
                                height={32}
                                className="h-8 w-auto object-contain"
                            />
                        </Link>

                        <div className="text-white">
                            <h2 className="text-4xl font-bold mb-4">
                                Reset Your<br />Password
                            </h2>
                            <p className="text-lg text-white/80 max-w-md">
                                Enter your email address and we'll send you instructions to reset your password.
                            </p>
                        </div>

                        <div className="text-white/60 text-sm">
                            © 2026 CapitalPay. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
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

                    {!sent ? (
                        <>
                            <div className="mb-8">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                                >
                                    <BiArrowBack />
                                    Back to Login
                                </Link>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                                <p className="text-gray-600 text-sm">
                                    No worries! Enter your email and we'll send you reset instructions.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm font-semibold text-center border border-rose-200">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Email Address
                                    </label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@company.com"
                                        required
                                        icon={<BiEnvelope className="text-gray-400" />}
                                        className="pl-10"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#29258D] hover:bg-[#29258D]/90 font-semibold"
                                >
                                    {loading ? "Sending..." : "Send Reset Instructions"}
                                </Button>

                                <div className="text-center">
                                    <p className="text-sm text-gray-600">
                                        Remember your password?{" "}
                                        <Link
                                            href="/login"
                                            className="font-semibold text-[#29258D] hover:text-[#29258D]/80 transition-colors"
                                        >
                                            Sign in
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <PiCheckCircle className="text-4xl text-emerald-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h1>
                            <p className="text-gray-600 mb-8">
                                We've sent password reset instructions to <strong>{email}</strong>
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Didn't receive the email? Check your spam folder or try again.
                            </p>
                            <Link href="/login">
                                <Button className="bg-[#29258D] hover:bg-[#29258D]/90">
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
