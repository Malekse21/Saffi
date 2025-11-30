"use client";

import { Check, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmsPackProps {
    amount: number;
    price: number;
    features: string[];
    recommended?: boolean;
}

function SmsPackCard({ amount, price, features, recommended = false }: SmsPackProps) {
    return (
        <div className={cn(
            "flex flex-col p-8 neo-border neo-shadow rounded-xl transition-transform hover:-translate-y-1",
            recommended ? "bg-black text-white" : "bg-white text-black"
        )}>
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                        "h-12 w-12 rounded-lg flex items-center justify-center border-2",
                        recommended ? "bg-solar-yellow border-white text-black" : "bg-gray-100 border-black text-black"
                    )}>
                        <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className={cn("text-2xl font-bold", recommended ? "text-white" : "text-black")}>
                        {amount} SMS
                    </h3>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-5xl font-black tracking-tight">{price}</span>
                    <span className={cn("text-lg font-medium", recommended ? "text-gray-400" : "text-gray-500")}>
                        TND
                    </span>
                </div>
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
                Acheter
            </button>
        </div>
    );
}

export default function SmsTopupPage() {
    const packs = [
        {
            amount: 100,
            price: 15,
            features: [
                "Validité illimitée",
                "Support prioritaire",
                "Statistiques d'envoi"
            ]
        },
        {
            amount: 500,
            price: 60,
            recommended: true,
            features: [
                "Validité illimitée",
                "Support prioritaire",
                "Statistiques détaillées",
                "Économisez 20%"
            ]
        },
        {
            amount: 1000,
            price: 100,
            features: [
                "Validité illimitée",
                "Support dédié",
                "Statistiques avancées",
                "Économisez 33%"
            ]
        }
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-12">
                <h1 className="text-4xl font-black uppercase tracking-tight mb-4">Recharge SMS</h1>
                <p className="text-xl text-gray-600 max-w-2xl">
                    Choisissez le pack SMS qui correspond à vos besoins. Les SMS n'expirent jamais.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {packs.map((pack) => (
                    <SmsPackCard key={pack.amount} {...pack} />
                ))}
            </div>
        </div>
    );
}
