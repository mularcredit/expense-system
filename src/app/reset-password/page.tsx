"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BiLockAlt, BiArrowBack } from "react-icons/bi";
import { PiCheckCircle } from "react-icons/pi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token");
        }
    }, [token]);

    const validatePassword = (pass: string) => {
        if (pass.length < 8) return "Password must be at least 8 characters long";
        if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(pass)) return "Password must contain at least one number";
        if (!/[!@#$%^&*]/.test(pass)) return "Password must contain at least one special character";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
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
                                Create New<br />Password
                            </h2>
                            <p className="text-lg text-white/80 max-w-md">
                                Choose a strong password to secure your account.
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

                    {!success ? (
                        <>
                            <div className="mb-8">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                                >
                                    <BiArrowBack />
                                    Back to Login
                                </Link>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
                                <p className="text-gray-600 text-sm">
                                    Enter your new password below.
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
                                        New Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        required
                                        minLength={8}
                                        icon={<BiLockAlt className="text-gray-400" />}
                                        className="pl-10"
                                    />
                                    {password && (
                                        <div className="mt-3 space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs">
                                                <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                <span className={password.length >= 8 ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                                                    At least 8 characters
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                <span className={/[A-Z]/.test(password) ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                                                    One uppercase letter
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                <span className={/[0-9]/.test(password) ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                                                    One number
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <div className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*]/.test(password) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                <span className={/[!@#$%^&*]/.test(password) ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                                                    One special character
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Confirm Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        required
                                        icon={<BiLockAlt className="text-gray-400" />}
                                        className="pl-10"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || !token}
                                    className="w-full bg-[#29258D] hover:bg-[#29258D]/90 font-semibold"
                                >
                                    {loading ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <PiCheckCircle className="text-4xl text-emerald-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-3">Password Reset Successful!</h1>
                            <p className="text-gray-600 mb-8">
                                Your password has been reset successfully. Redirecting to login...
                            </p>
                            <Link href="/login">
                                <Button className="bg-[#29258D] hover:bg-[#29258D]/90">
                                    Go to Login
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
