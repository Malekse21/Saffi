"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface NeoButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'accent' | 'outline';
    onClick?: () => void;
    className?: string;
    fullWidth?: boolean;
}

const NeoButton: React.FC<NeoButtonProps> = ({
    children,
    variant = 'primary',
    onClick,
    className = '',
    fullWidth = false
}) => {
    const baseStyles = "font-display font-bold text-lg border-2 border-black px-6 py-3 transition-all duration-200 flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-saffi-yellow text-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm",
        secondary: "bg-saffi-indigo text-white shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm",
        accent: "bg-saffi-green text-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm",
        outline: "bg-white text-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm hover:bg-gray-50",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </motion.button>
    );
};

export default NeoButton;
