import { cn } from "@/lib/utils";

interface CatalogLabelProps {
    number: string;
    text: string;
    className?: string;
}

export function CatalogLabel({ number, text, className }: CatalogLabelProps) {
    return (
        <div className={cn("flex items-baseline gap-2 text-xs font-bold tracking-tight text-black uppercase", className)}>
            <span className="opacity-50">{number}</span>
            <span>{text}</span>
        </div>
    );
}
