"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CreditCard, Monitor, User, Save } from "lucide-react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const [privacyMode, setPrivacyMode] = useState(false);

    const tabs = [
        { id: "general", label: "Général", icon: User },
        { id: "tv", label: "Affichage TV", icon: Monitor },
        { id: "billing", label: "Facturation", icon: CreditCard },
    ];

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black">Réglages</h2>
                <p className="text-gray-500 font-medium">Configurez votre cabinet.</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 border-b-2 border-black pb-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 border-2 px-6 py-3 font-bold transition-all",
                            activeTab === tab.id
                                ? "border-black bg-black text-white shadow-[4px_4px_0px_0px_#000]"
                                : "border-transparent bg-transparent text-gray-500 hover:border-black hover:text-black"
                        )}
                    >
                        <tab.icon className="h-5 w-5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="rounded-xl border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000]">
                {/* General Tab */}
                {activeTab === "general" && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wide">
                                Nom du Docteur
                            </label>
                            <input
                                type="text"
                                defaultValue="Dr. Malek"
                                className="w-full border-2 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wide">
                                Durée moyenne de consultation (min)
                            </label>
                            <input
                                type="number"
                                defaultValue="20"
                                className="w-full border-2 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black/10"
                            />
                        </div>
                    </div>
                )}

                {/* TV Tab */}
                {activeTab === "tv" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border-2 border-black bg-gray-50 p-6">
                            <div className="space-y-1">
                                <h3 className="font-bold">Mode Confidentialité</h3>
                                <p className="text-sm text-gray-500">
                                    Masquer les noms complets sur l'écran TV (ex: M. Ben...)
                                </p>
                            </div>

                            {/* Neo-Brutalist Switch */}
                            <button
                                onClick={() => setPrivacyMode(!privacyMode)}
                                className={cn(
                                    "relative h-8 w-14 border-2 border-black transition-colors",
                                    privacyMode ? "bg-black" : "bg-white"
                                )}
                            >
                                <div
                                    className={cn(
                                        "absolute top-0.5 h-6 w-6 border-2 border-black transition-transform",
                                        privacyMode
                                            ? "translate-x-6 bg-white"
                                            : "translate-x-0.5 bg-black"
                                    )}
                                />
                            </button>
                        </div>
                    </div>
                )}

                {/* Billing Tab */}
                {activeTab === "billing" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border-2 border-black bg-gray-50 p-6">
                            <div className="space-y-1">
                                <h3 className="font-bold">Solde SMS</h3>
                                <p className="text-4xl font-black">0</p>
                            </div>
                            <button className="flex items-center gap-2 border-2 border-black bg-black px-6 py-3 font-bold text-white shadow-[4px_4px_0px_0px_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-900">
                                <CreditCard className="h-5 w-5" />
                                Recharger
                            </button>
                        </div>
                    </div>
                )}

                {/* Save Button (Common) */}
                {activeTab !== "billing" && (
                    <div className="mt-8 flex justify-end border-t-2 border-gray-100 pt-6">
                        <button className="flex items-center gap-2 border-2 border-black bg-black px-8 py-3 font-bold text-white shadow-[4px_4px_0px_0px_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-900">
                            <Save className="h-5 w-5" />
                            Enregistrer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
