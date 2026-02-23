import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import Image from "next/image";

interface StatsCardProps {
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: IconType;
    color?: "purple" | "cyan" | "emerald" | "blue";
    image?: string;
    bgColor?: string; // e.g. '#EEF2FF'
}

export function StatsCard({ title, value, trend, trendUp, icon: Icon, color = "purple", image, bgColor }: StatsCardProps) {
    const trendColor = trendUp
        ? "text-emerald-600 bg-emerald-50"
        : "text-rose-500 bg-rose-50";

    return (
        <div
            className={cn(
                "relative rounded-2xl border border-gray-100 overflow-hidden",
                "hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group",
                "p-6 pb-5 flex flex-col justify-between",
                "min-h-[148px]"
            )}
            style={{ backgroundColor: bgColor || '#ffffff' }}
        >
            {/* Top row: title + trend badge */}
            <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold text-gray-600 leading-snug max-w-[60%]">
                    {title}
                </p>
                {trend && (
                    <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                        trendColor
                    )}>
                        {trendUp ? "↑" : "↓"} {trend}
                    </span>
                )}
            </div>

            {/* Bottom row: value left, image right */}
            <div className="flex items-end justify-between mt-3">
                <div className="text-[2rem] font-normal text-gray-500 leading-none tracking-tight">
                    {value}
                </div>

                {/* Illustration */}
                <div className="relative w-[90px] h-[90px] shrink-0 -mb-5 -mr-3 group-hover:scale-105 transition-transform duration-300">
                    {image ? (
                        <Image
                            src={image}
                            alt={title}
                            fill
                            className="object-contain drop-shadow-md"
                        />
                    ) : (
                        <div className={cn(
                            "w-full h-full flex items-center justify-center rounded-2xl",
                            color === "purple" && "bg-[#29258D]/10",
                            color === "cyan" && "bg-cyan-500/10",
                            color === "emerald" && "bg-emerald-500/10",
                            color === "blue" && "bg-blue-500/10",
                        )}>
                            <Icon className={cn(
                                "text-4xl",
                                color === "purple" && "text-[#29258D]",
                                color === "cyan" && "text-cyan-500",
                                color === "emerald" && "text-emerald-500",
                                color === "blue" && "text-blue-500",
                            )} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
