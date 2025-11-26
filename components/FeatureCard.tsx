import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    className?: string;
}

export function FeatureCard({
    title,
    description,
    icon: Icon,
    className,
}: FeatureCardProps) {
    return (
        <div className={cn("flex flex-col gap-4 p-6", className)}>
            <Icon className="h-6 w-6 text-black" strokeWidth={1.5} />
            <div>
                <h3 className="font-sans text-lg font-bold tracking-tight text-black mb-2">
                    {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}
