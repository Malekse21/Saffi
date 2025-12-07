"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CreditCard, Monitor, Save, Star, User, LogOut, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "@/components/dashboard/ConfirmationModal";

export default function SettingsPage() {
    const supabase = createClient();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("tv");
    const [privacyMode, setPrivacyMode] = useState(false);
    const [gmbLink, setGmbLink] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [wifiCode, setWifiCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Confirmation Modal State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        action: () => void;
        isDestructive?: boolean;
        confirmLabel?: string;
    }>({
        isOpen: false,
        title: "",
        message: "",
        action: () => { },
        isDestructive: false
    });

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
                    .select('tv_privacy_mode, gmb_link, whatsapp, wifi_code')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    // Log error but don't show toast if it's just missing columns
                    console.error(error);
                    if (!error.message?.includes('column')) {
                        toast.error("Erreur lors de la récupération de vos paramètres.");
                    }
                } else if (profile) {
                    setPrivacyMode(profile.tv_privacy_mode || false);
                    setGmbLink(profile.gmb_link || "");
                    setWhatsapp(profile.whatsapp || "");
                    setWifiCode(profile.wifi_code || "");
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
                whatsapp: whatsapp,
                wifi_code: wifiCode,
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

    const handleLogout = async () => {
        setConfirmation({
            isOpen: true,
            title: "Déconnexion",
            message: "Êtes-vous sûr de vouloir vous déconnecter ?",
            confirmLabel: "Me Déconnecter",
            action: async () => {
                await supabase.auth.signOut();
                router.push("/login");
                router.refresh();
            }
        });
    };

    const handleDeleteAccount = async () => {
        setConfirmation({
            isOpen: true,
            title: "Supprimer mon compte",
            message: "ATTENTION : Cette action est irréversible. Toutes vos données seront définitivement effacées. Êtes-vous sûr ?",
            isDestructive: true,
            confirmLabel: "Supprimer Définitivement",
            action: async () => {
                try {
                    const { error } = await supabase.rpc('delete_own_user');
                    if (error) throw error;
                    
                    await supabase.auth.signOut();
                    toast.success("Compte supprimé avec succès");
                    router.push("/login");
                } catch (error) {
                    console.error("Delete Error:", error);
                    toast.error("Erreur lors de la suppression du compte. Le support a été notifié.");
                }
            }
        });
    };

    const tabs = [
        { id: "tv", label: "Affichage TV", icon: Monitor },
        { id: "reviews", label: "Avis Google", icon: Star },
        { id: "billing", label: "Facturation", icon: CreditCard },
        { id: "account", label: "Compte", icon: User },
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
                                {/* Google Reviews */}
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

                                {/* WhatsApp */}
                                <div className="rounded-lg border-2 border-black bg-gray-50 p-6">
                                    <div className="space-y-2">
                                        <h3 className="font-bold">Numéro WhatsApp</h3>
                                        <p className="text-sm text-gray-500">
                                            Numéro WhatsApp pour contacter le cabinet (ex: +216 12 345 678).
                                        </p>
                                        <input
                                            type="tel"
                                            value={whatsapp}
                                            onChange={(e) => setWhatsapp(e.target.value)}
                                            placeholder="+216 12 345 678"
                                            className="w-full border-2 border-black px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-black"
                                        />
                                    </div>
                                </div>

                                {/* WiFi Code */}
                                <div className="rounded-lg border-2 border-black bg-gray-50 p-6">
                                    <div className="space-y-2">
                                        <h3 className="font-bold">Code WiFi</h3>
                                        <p className="text-sm text-gray-500">
                                            Code WiFi que les patients peuvent copier en appuyant sur l'icône WiFi dans leur interface.
                                        </p>
                                        <input
                                            type="text"
                                            value={wifiCode}
                                            onChange={(e) => setWifiCode(e.target.value)}
                                            placeholder="MotDePasseWiFi123"
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
                                </div>
                            </div>
                        )}

                        {/* Account Tab */}
                        {activeTab === "account" && (
                            <div className="space-y-8">
                                {/* Logout Section */}
                                <div className="bg-gray-50 border-2 border-black rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <LogOut className="h-5 w-5" />
                                            Déconnexion
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Se déconnecter de cette session sur cet appareil.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-6 py-2 bg-white border-2 border-black font-bold uppercase hover:bg-gray-100 transition-colors"
                                    >
                                        Se Déconnecter
                                    </button>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
                                    <h3 className="font-bold text-lg text-red-600 flex items-center gap-2 mb-2">
                                        <Trash2 className="h-5 w-5" />
                                        Zone de Danger
                                    </h3>
                                    <p className="text-sm text-red-700 mb-6 font-medium">
                                        La suppression de votre compte est définitive et entraînera la perte de toutes vos données (patients, configurations, etc.).
                                    </p>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleDeleteAccount}
                                            className="px-6 py-2 bg-red-600 text-white font-bold uppercase border-2 border-red-800 shadow-[4px_4px_0px_0px_#991b1b] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#991b1b] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_#991b1b] transition-all"
                                        >
                                            Supprimer mon Compte
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button (Common for settings tabs only) */}
                        {activeTab !== "billing" && activeTab !== "account" && (
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

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.action}
                title={confirmation.title}
                message={confirmation.message}
                isDestructive={confirmation.isDestructive}
                confirmLabel={confirmation.confirmLabel}
            />
        </div>
    );
}
