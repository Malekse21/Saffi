'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react'; // Dynamically load icons
import { cn } from '@/lib/utils';
import { MOTIFS, MotifValue } from "@/lib/motifs";

interface FlipQueueCardProps {
    ticketNumber: string;
    waitTime: number;
    position: number | null;
    isServing: boolean;
    currentMotif: string | null;
}

export default function FlipQueueCard({ ticketNumber, waitTime, position, isServing, currentMotif }: FlipQueueCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [tip, setTip] = useState({ content: "Chargement...", icon_name: "Loader" });

    // Fetch a random tip on mount
    useEffect(() => {
        fetch('/api/tips/random')
            .then(res => res.json())
            .then(data => data && setTip(data))
            .catch(() => setTip({ content: "Le silence est d'or.", icon_name: "Moon" }));
    }, []);

    // Dynamic Icon Component with proper typing
    const IconComponent = (Icons[tip.icon_name as keyof typeof Icons] as React.ComponentType<any>) || Icons.Smile;

    // Calculate progress for the circle (0 to 1) - Reused logic but internal to component if needed, 
    // or we can keep the ring logic here. 
    // For this specific design, we follow the user's prompt which keeps the "Queue Number UI" on front.
    // I will adapt the user's provided code to include the circular progress and other elements from the original page
    // to ensure no functionality is lost, while wrapping it in the flip card.

    return (
        <div className="relative w-full h-full min-h-[300px] perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div
                className="w-full h-full relative preserve-3d"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >

                {/* === FRONT SIDE (The Queue) === */}
                <div className="absolute inset-0 backface-hidden bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col items-center justify-center p-4">
                    {/* Re-implementing the original Circular UI here or similar */}
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                        {/* Ticket Number Badge */}
                        {ticketNumber && !isServing && (
                            <div className="flex flex-col items-center gap-2 shrink-0">
                                <div className="bg-white border-2 border-black px-4 py-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Votre Numéro</p>
                                    <p className="font-display font-black text-2xl text-center leading-none">{ticketNumber}</p>
                                </div>
                                {currentMotif && (
                                    <div className={cn(
                                        "px-3 py-1 border-2 border-black rounded-full text-xs font-bold uppercase tracking-wide",
                                        MOTIFS.find(m => m.value === currentMotif)?.color || "bg-gray-100",
                                        currentMotif === 'urgence' ? "text-white animate-pulse" : "text-black"
                                    )}>
                                        {MOTIFS.find(m => m.value === currentMotif)?.label || currentMotif}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Circular Progress Indicator */}
                        {isServing ? (
                            <div className="flex flex-col items-center justify-center flex-1 w-full bg-[#10B981] p-4 rounded-xl border-2 border-black">
                                <div className="w-[min(30vh,160px)] h-[min(30vh,160px)] rounded-full bg-white border-4 border-black flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_#000]">
                                    <span className="font-display font-black text-6xl text-black leading-none">
                                        {ticketNumber}
                                    </span>
                                </div>
                                <p className="mt-4 font-black text-lg uppercase tracking-wide text-white drop-shadow-md text-center">Entrez maintenant!</p>
                            </div>
                        ) : (
                            <div className="relative w-[min(30vh,200px)] h-[min(30vh,200px)] shrink-0">
                                {/* SVG Circle Progress - Static for now or we pass progress props */}
                                {/* Using a simplified visual for the flip card to avoid complexity with progress props if not strictly needed, 
                                    but let's try to keep the time big. */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full border-4 border-black bg-white">
                                    <div className="text-center">
                                        <p className="font-black text-5xl text-[#2C2B57]">
                                            {waitTime}<span className="text-2xl">min</span>
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                                            temps estimé
                                        </p>
                                        <div className="mt-2 pt-2 border-t-2 border-gray-200 w-16 mx-auto">
                                            <p className="font-black text-3xl text-black leading-none">
                                                {position || '...'}
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                en attente
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <p className="absolute bottom-2 text-[10px] text-gray-400 font-mono flex items-center gap-1">
                            <Icons.RotateCw size={10} />
                            Appuyez pour retourner
                        </p>
                    </div>
                </div>

                {/* === BACK SIDE (The Tip) === */}
                <div
                    className="absolute inset-0 backface-hidden bg-saffi-yellow border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col items-center justify-center p-6 text-center"
                    style={{ transform: 'rotateY(180deg)' }}
                >
                    <div className="mb-4 p-4 bg-white border-2 border-black rounded-full shadow-[4px_4px_0px_0px_#000]">
                        <IconComponent size={40} className="text-black" strokeWidth={2.5} />
                    </div>

                    <h3 className="font-display text-xl font-bold mb-2 uppercase tracking-wide text-black">Le Saviez-vous ?</h3>
                    <p className="font-medium text-black leading-snug max-w-xs mx-auto">
                        "{tip.content}"
                    </p>
                    <p className="absolute bottom-2 text-[10px] text-black/50 font-mono flex items-center gap-1">
                        <Icons.RotateCw size={10} />
                        Appuyez pour voir votre numéro
                    </p>
                </div>

            </motion.div>
        </div>
    );
}
