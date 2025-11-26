import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BentoCardProps {
    title: string;
    children: ReactNode;
    className?: string;
    size?: "small" | "medium" | "large";
}

export function BentoCard({ title, children, className, size = "medium" }: BentoCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl neo-border neo-shadow bg-white p-8 flex flex-col",
                size === "large" && "md:col-span-2 md:row-span-2",
                size === "medium" && "md:col-span-1",
                size === "small" && "md:col-span-1",
                className
            )}
        >
            <div className="relative z-10 flex-1">
                {children}
            </div>
            <h3 className="relative z-10 mt-4 text-xl font-bold tracking-tight text-black">
                {title}
            </h3>
        </div>
    );
}
