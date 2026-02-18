"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { BiEnvelope, BiLockAlt, BiUser } from "react-icons/bi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validatePassword(password)) {
            setError(validatePassword(password) || "");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                router.push("/login?signup=success");
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

    const validatePassword = (pass: string) => {
        if (pass.length < 8) return "Password must be at least 8 characters long";
        if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(pass)) return "Password must contain at least one number";
        if (!/[!@#$%^&*]/.test(pass)) return "Password must contain at least one special character";
        return null;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPassword(val);
        const validationError = validatePassword(val);
        setPasswordError(validationError || "");
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
                                Join Our<br />Platform Today
                            </h2>
                            <p className="text-lg text-white/80 max-w-md">
                                Request access to start managing your business finances efficiently.
                            </p>
                        </div>

                        {/* Partner Logos */}
                        <div>
                            <p className="text-white/60 text-xs uppercase tracking-wider mb-3">Trusted By</p>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                    <Image
                                        src="/assets/branding/south-sudan-revenue-authority-formerly-national-revenue-authority-586928.jpg"
                                        alt="Revenue Authority"
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 object-contain"
                                    />
                                </div>
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                    <Image
                                        src="/assets/branding/logo.857ac6f8bbd7.png"
                                        alt="Civil Aviation"
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 object-contain"
                                    />
                                </div>
                            </div>
                            <div className="text-white/60 text-sm">
                                © 2026 CapitalPay. All rights reserved.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
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
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Access</h1>
                        <p className="text-gray-600 text-sm">Submit a request to join the organization.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm font-semibold text-center border border-rose-200">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-normal text-gray-500 mb-1.5">
                                    Full name
                                </label>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                    icon={<BiUser className="text-gray-400" />}
                                    className="pl-10 transition-colors"
                                />
                            </div>

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
                                    onChange={handlePasswordChange}
                                    placeholder="Create a strong password"
                                    required
                                    minLength={8}
                                    icon={<BiLockAlt className="text-gray-400" />}
                                    className={`pl-10 transition-colors ${passwordError ? 'border-rose-400 focus:border-rose-400' : ''}`}
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
                                                One special character (!@#$%^&*)
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#29258D] hover:bg-[#29258D]/90 font-semibold"
                        >
                            {loading ? "Submitting..." : "Submit Request"}
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="font-semibold text-[#29258D] hover:text-[#29258D]/80 transition-colors"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
