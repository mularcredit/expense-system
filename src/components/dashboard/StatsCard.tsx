import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { Card } from "@/components/ui/Card";

interface StatsCardProps {
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: IconType;
    color?: "purple" | "cyan" | "emerald" | "blue";
}

export function StatsCard({ title, value, trend, trendUp, icon: Icon, color = "purple" }: StatsCardProps) {
    const colorStyles = {
        purple: "text-[#29258D] bg-[#29258D]/10 border-[#29258D]/10",
        cyan: "text-[#06B6D4] bg-[#06B6D4]/10 border-[#06B6D4]/10",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10",
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/10",
    };

    return (
        <Card className="p-6 group cursor-pointer relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={cn("p-4 rounded-xl transition-all duration-300 group-hover:scale-110 border", colorStyles[color])}>
                    <Icon className="text-2xl" />
                </div>
                {trend && (
                    <div className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider border",
                        trendUp
                            ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                            : "text-[#29258D] bg-[#29258D]/5 border-[#29258D]/10"
                    )}>
                        {trend}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <h3 className="text-[11px] font-bold tracking-[0.05em] text-gray-400 mb-1 uppercase">{title}</h3>
                <div className="text-3xl font-bold text-[#0f172a] tracking-tight text-shadow-sm">
                    {value}
                </div>
            </div>
        </Card>
    );
}
