"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function AuthVisual() {
    const [isHovered, setIsHovered] = useState(false);

    const cards = [
        { id: 1, color: "bg-[#FACC15]", rotate: -12, x: -50, y: -120, label: "A01" }, // Yellow
        { id: 2, color: "bg-[#F472B6]", rotate: 8, x: 60, y: -40, label: "A02" },   // Pink
        { id: 3, color: "bg-[#60A5FA]", rotate: -5, x: -20, y: 40, label: "A03" },  // Blue
        { id: 4, color: "bg-[#4ADE80]", rotate: 10, x: 40, y: 100, label: "A04" },  // Green
        { id: 5, color: "bg-[#A78BFA]", rotate: -8, x: -60, y: 160, label: "A05" }, // Purple
        { id: 6, color: "bg-[#FB923C]", rotate: 6, x: 30, y: -180, label: "A06" },  // Orange
    ];

    return (
        <div
            className="h-full w-full bg-[#FDFBF7] relative overflow-hidden flex items-center justify-center border-l-2 border-black"
        >
            {/* Dot Pattern Background */}
            <div className="absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* The Queue Container */}
            <div
                className="relative w-64 h-[600px] flex flex-col items-center justify-center"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {cards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        initial={{
                            x: card.x,
                            y: card.y,
                            rotate: card.rotate,
                        }}
                        animate={{
                            x: isHovered ? 0 : card.x,
                            y: isHovered ? (index - 2.5) * 90 : [card.y - 5, card.y + 5, card.y - 5], // Align vertically centered
                            rotate: isHovered ? 0 : card.rotate,
                            scale: isHovered ? 1 : 1,
                        }}
                        transition={{
                            y: {
                                duration: isHovered ? 0.5 : 4, // Fast snap vs slow float
                                repeat: isHovered ? 0 : Infinity,
                                ease: "easeInOut",
                                delay: isHovered ? 0 : index * 0.5, // Stagger the float
                            },
                            default: {
                                type: "spring",
                                stiffness: 100,
                                damping: 20,
                                mass: 1,
                            }
                        }}
                        className={`absolute w-48 h-24 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center px-4 gap-4 ${card.color}`}
                    >
                        {/* Ticket Visuals */}
                        <div className="h-full border-r-2 border-black border-dashed mx-2 opacity-20" />
                        <div className="flex-1 flex flex-col justify-center">
                            <span className="font-display font-black text-2xl text-black">{card.label}</span>
                            <div className="h-1.5 w-12 bg-black/20 rounded-full mt-1" />
                        </div>
                        <div className="h-3 w-3 rounded-full bg-black/10" />
                    </motion.div>
                ))}
            </div>

            {/* Instruction Text */}
            <motion.div
                className="absolute bottom-12 text-black/40 font-mono text-xs uppercase tracking-widest"
                animate={{ opacity: isHovered ? 0 : 1 }}
            >
                Survolez pour organiser
            </motion.div>
        </div>
    );
}
