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
                "p-5 pb-4 flex flex-col justify-between",
                "min-h-[130px] lg:min-h-[148px]"
            )}
            style={{ backgroundColor: bgColor || '#ffffff' }}
        >
            {/* Top row: title + trend badge */}
            <div className="flex items-start justify-between gap-1 overflow-hidden">
                <p className="text-[10px] font-bold text-gray-500/80 leading-tight uppercase tracking-wider truncate">
                    {title}
                </p>
                {trend && (
                    <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                        trendColor
                    )}>
                        {trendUp ? "↑" : "↓"} {trend}
                    </span>
                )}
            </div>

            {/* Bottom row: value left, image right */}
            <div className="flex items-end justify-between mt-auto gap-2 min-w-0">
                <div className="text-xl md:text-2xl lg:text-3xl xl:text-2xl 2xl:text-3xl font-normal text-gray-700 leading-none tracking-tight truncate flex-1 min-w-0" title={value}>
                    {value}
                </div>

                {/* Illustration */}
                <div className="relative w-[60px] h-[60px] lg:w-[80px] lg:h-[80px] xl:w-[90px] xl:h-[90px] shrink-0 -mb-4 -mr-2 group-hover:scale-110 transition-transform duration-300">
                    {image ? (
                        <Image
                            src={image}
                            alt={title}
                            fill
                            className="object-contain drop-shadow-sm opacity-90 group-hover:opacity-100 transition-opacity"
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
                                "text-3xl lg:text-4xl",
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
