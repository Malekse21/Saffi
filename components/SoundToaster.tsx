"use client";

import { useEffect } from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { useSound } from '@/hooks/useSound';
import { toast } from 'sonner';

export function SoundToaster() {
    const { playSound } = useSound();

    useEffect(() => {
        // Listen for toast events and play corresponding sounds
        const handleToast = (event: CustomEvent) => {
            const toastType = event.detail?.type;
            
            if (toastType === 'success') {
                playSound('success');
            } else if (toastType === 'error') {
                playSound('error');
            } else if (toastType === 'info') {
                playSound('notification');
            }
        };

        // Intercept toast calls to add sound
        const originalSuccess = toast.success;
        const originalError = toast.error;
        const originalInfo = toast.info;

        toast.success = (...args: any[]) => {
            playSound('success');
            return originalSuccess(...args);
        };

        toast.error = (...args: any[]) => {
            playSound('error');
            return originalError(...args);
        };

        toast.info = (...args: any[]) => {
            playSound('notification');
            return originalInfo(...args);
        };

        return () => {
            // Cleanup: restore original functions
            toast.success = originalSuccess;
            toast.error = originalError;
            toast.info = originalInfo;
        };
    }, [playSound]);

    return <SonnerToaster position="top-center" />;
}
