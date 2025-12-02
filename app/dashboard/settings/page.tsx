"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CreditCard, Monitor, Save, Star } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function SettingsPage() {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState("tv");
    const [privacyMode, setPrivacyMode] = useState(false);
    const [gmbLink, setGmbLink] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const { data: userData, error: authError } = await supabase.auth.getUser();

            if (authError) {
                toast.error("Erreur d'authentification.");
                console.error("Auth error:", authError);
                setLoading(false);
                return;
            }

            const user = userData?.user;

            if (user) {
                setUserId(user.id);
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('tv_privacy_mode, gmb_link')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    toast.error("Erreur lors de la récupération de vos paramètres.");
                    console.error(error);
                } else if (profile) {
                    setPrivacyMode(profile.tv_privacy_mode || false);
                    setGmbLink(profile.gmb_link || "");
                }
            } else {
                toast.error("Utilisateur non connecté.");
            }
            setLoading(false);
        };

        fetchProfile();
    }, [supabase]);

    const handleSave = async () => {
        if (!userId) {
            toast.error("Utilisateur non identifié.");
            return;
        }

        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                tv_privacy_mode: privacyMode,
                gmb_link: gmbLink,
            })
            .eq('id', userId);

        if (error) {
            toast.error("Erreur lors de l'enregistrement des paramètres.");
            console.error(error);
        } else {
            toast.success("✅ Paramètres enregistrés !");
        }
        setSaving(false);
    };

    const tabs = [
        { id: "tv", label: "Affichage TV", icon: Monitor },
        { id: "reviews", label: "Avis Google", icon: Star },
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
                {loading ? (
                    <div className="text-center font-bold">Chargement...</div>
                ) : (
                    <>
                        {/* TV Tab */}
                        {activeTab === "tv" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between rounded-lg border-2 border-black bg-gray-50 p-6">
                                    <div className="space-y-1">
                                        <h3 className="font-bold">Mode Confidentialité</h3>
                                        <p className="text-sm text-gray-500">
                                            Masquer les noms des patients sur l'écran TV.
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

                        {/* Reviews Tab */}
                        {activeTab === "reviews" && (
                            <div className="space-y-6">
                                <div className="rounded-lg border-2 border-black bg-gray-50 p-6">
                                    <div className="space-y-2">
                                        <h3 className="font-bold">Lien de partage Google</h3>
                                        <p className="text-sm text-gray-500">
                                            Entrez le lien direct pour laisser un avis sur votre page Google My Business.
                                        </p>
                                        <input
                                            type="url"
                                            value={gmbLink}
                                            onChange={(e) => setGmbLink(e.target.value)}
                                            placeholder="https://g.page/r/..."
                                            className="w-full border-2 border-black px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-black"
                                        />
                                    </div>
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
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 border-2 border-black bg-black px-8 py-3 font-bold text-white shadow-[4px_4px_0px_0px_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-900 disabled:opacity-50"
                                >
                                    <Save className="h-5 w-5" />
                                    {saving ? "Enregistrement..." : "Enregistrer"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
