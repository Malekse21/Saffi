import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingCardProps {
    title: string;
    price: string;
    description: string;
    features: string[];
    recommended?: boolean;
    className?: string;
}

export function PricingCard({
    title,
    price,
    description,
    features,
    recommended = false,
    className
}: PricingCardProps) {
    return (
        <div className={cn(
            "flex flex-col p-8 neo-border neo-shadow rounded-xl transition-transform hover:-translate-y-1",
            recommended ? "bg-black text-white" : "bg-white text-black",
            className
        )}>
            <div className="mb-8">
                <h3 className={cn("text-2xl font-bold mb-2", recommended ? "text-white" : "text-black")}>
                    {title}
                </h3>
                <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-5xl font-black tracking-tight">{price}</span>
                    <span className={cn("text-lg font-medium", recommended ? "text-gray-400" : "text-gray-500")}>
                        TND/mois
                    </span>
                </div>
                <p className={cn("text-sm font-medium", recommended ? "text-gray-400" : "text-gray-500")}>
                    {description}
                </p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <div className={cn(
                            "mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0",
                            recommended ? "bg-solar-yellow text-black" : "bg-black text-white"
                        )}>
                            <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span className="text-sm font-medium leading-tight">{feature}</span>
                    </li>
                ))}
            </ul>

            <button className={cn(
                "w-full py-4 rounded-lg font-bold text-sm uppercase tracking-wider neo-border transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
                recommended
                    ? "bg-solar-yellow text-black shadow-[4px_4px_0px_0px_#333]"
                    : "bg-black text-white shadow-[4px_4px_0px_0px_#000] hover:bg-gray-900"
            )}>
                Choisir {title}
            </button>
        </div>
    );
}
