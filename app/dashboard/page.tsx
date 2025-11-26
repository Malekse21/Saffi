"use client";

import { Loader } from "lucide-react";

export default function DashboardHomePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader className="animate-spin text-gray-400 w-12 h-12" />
            <p className="text-lg text-gray-500 font-medium">Redirection en cours...</p>
        </div>
    );
}
