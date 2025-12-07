'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share, PlusSquare, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallButton() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showIOSModal, setShowIOSModal] = useState(false);

    useEffect(() => {
        // 1. Check if Standalone (Already Installed)
        const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://');
        setIsStandalone(isRunningStandalone);

        // 2. Check for iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIphone = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIphone);

        // 3. Listen for Android Install Prompt
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSModal(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            // Fallback for desktop or unsupported
            alert("Pour installer cette application, utilisez l'option 'Ajouter à l'écran d'accueil' de votre navigateur.");
        }
    };

    // Hide if already installed or not mobile (optional, but requested to hide if standalone)
    if (isStandalone) return null;

    return (
        <>
            <button
                onClick={handleInstallClick}
                className="h-10 px-3 bg-white border-2 border-black flex items-center gap-2 font-bold hover:bg-yellow-400 transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Installer</span>
            </button>

            {/* iOS Instruction Modal */}
            <AnimatePresence>
                {showIOSModal && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 pointer-events-auto"
                            onClick={() => setShowIOSModal(false)}
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: "0%" }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full bg-white border-t-4 border-black p-6 pb-12 rounded-t-3xl shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.1)] pointer-events-auto relative max-w-md mx-auto"
                        >
                            <button
                                onClick={() => setShowIOSModal(false)}
                                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full border-2 border-transparent hover:border-black transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="text-center mb-8">
                                <h3 className="font-display font-black text-2xl uppercase tracking-wide">Installer Saffi</h3>
                                <p className="text-gray-500 font-medium text-sm mt-1">Accédez à votre ticket en un clic.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-black rounded-lg">
                                    <div className="bg-blue-500 text-white p-3 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                                        <Share className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-lg">1. Appuyez sur Partager</div>
                                        <div className="text-xs text-gray-500">En bas de votre écran Safari.</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-black rounded-lg">
                                    <div className="bg-gray-200 text-black p-3 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                                        <PlusSquare className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-lg">2. Sur l'écran d'accueil</div>
                                        <div className="text-xs text-gray-500">Cherchez l'option dans la liste.</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 border-2 border-yellow-400 rounded-full text-yellow-800 text-xs font-bold uppercase tracking-wider">
                                    <ArrowUp className="h-4 w-4 animate-bounce" />
                                    C'est tout !
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
