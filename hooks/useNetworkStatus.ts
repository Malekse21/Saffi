"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Set initial state
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Connexion rétablie ! Synchronisation en cours...", {
                id: "network-status",
                duration: 3000
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning("Mode hors ligne activé. Vos modifications seront sauvegardées localement.", {
                id: "network-status",
                duration: Infinity 
            });
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
}
