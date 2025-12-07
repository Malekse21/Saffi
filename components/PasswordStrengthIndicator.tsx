"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
    password?: string;
}

export function PasswordStrengthIndicator({ password = "" }: PasswordStrengthIndicatorProps) {
    const [score, setScore] = useState(0);

    const checks = [
        { label: "Minimum 6 caractères", met: password.length >= 6 },
        { label: "Une majuscule", met: /[A-Z]/.test(password) },
        { label: "Un chiffre", met: /[0-9]/.test(password) },
        { label: "Un caractère spécial", met: /[^A-Za-z0-9]/.test(password) },
    ];

    useEffect(() => {
        const metCount = checks.filter((c) => c.met).length;
        // Boost score a bit for length > 8
        let calculatedScore = metCount;
        if (password.length > 8) calculatedScore += 1;
        
        // Cap at 4
        setScore(Math.min(calculatedScore, 4));
    }, [password]);

    const getStrengthColor = () => {
        if (score === 0) return "bg-gray-200";
        if (score <= 2) return "bg-red-500";
        if (score === 3) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getStrengthLabel = () => {
        if (password.length === 0) return "";
        if (score <= 2) return "Faible";
        if (score === 3) return "Moyen";
        return "Fort";
    };

    return (
        <div className="space-y-2 mt-2">
            {/* Progress Bar */}
            <div className="flex items-center justify-between gap-3">
                <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${getStrengthColor()} transition-all duration-300`}
                        style={{ width: `${(score / 4) * 100}%` }}
                    />
                </div>
                {password.length > 0 && (
                    <span className={`text-xs font-bold uppercase ${
                        score <= 2 ? 'text-red-500' : score === 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                        {getStrengthLabel()}
                    </span>
                )}
            </div>

            {/* Checklist (Optional: Only show if weak/medium or always show) */}
            {/* We'll show it only if there is input to give feedback */}
            {password.length > 0 && score < 4 && (
                <div className="text-xs text-gray-500 space-y-1">
                    {checks.map((check, index) => (
                        <div key={index} className={`flex items-center gap-1 ${check.met ? 'text-green-600' : 'text-gray-400'}`}>
                            {check.met ? <Check className="h-3 w-3" /> : <div className="h-1 w-1 rounded-full bg-gray-300 mx-1" />}
                            <span>{check.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
