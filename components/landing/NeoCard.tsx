"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface NeoCardProps {
    children: React.ReactNode;
    className?: string;
    color?: 'white' | 'yellow' | 'indigo' | 'paper';
    noShadow?: boolean;
}

const NeoCard: React.FC<NeoCardProps> = ({
    children,
    className = '',
    color = 'white',
    noShadow = false
}) => {
    const bgColors = {
        white: 'bg-white',
        yellow: 'bg-saffi-yellow',
        indigo: 'bg-saffi-indigo',
        paper: 'bg-paper',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`border-2 border-black ${bgColors[color]} ${!noShadow ? 'shadow-neo' : ''} p-6 ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default NeoCard;
