"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Check } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    isDestructive = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-md border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden"
                >
                    <div className={`border-b-4 border-black p-4 flex items-center justify-between ${isDestructive ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <h2 className={`font-display font-black text-xl uppercase tracking-wide flex items-center gap-2 ${isDestructive ? 'text-red-600' : 'text-black'}`}>
                            {isDestructive && <AlertTriangle className="h-6 w-6" />}
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-black"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <p className="font-bold text-lg text-gray-700">
                            {message}
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 h-12 border-2 border-black font-black uppercase tracking-wide bg-white hover:bg-gray-50 transition-all"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`flex-1 h-12 border-2 border-black font-black uppercase tracking-wide text-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 ${isDestructive ? 'bg-red-600' : 'bg-black'
                                    }`}
                            >
                                <Check className="h-5 w-5" />
                                {confirmLabel}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
