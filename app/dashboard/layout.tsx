"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    BarChart3,
    QrCode,
    Settings,
    LogOut,
    Menu,
    Tv,
    Volume2,
    VolumeX,
    Cast,
    Clock,
    User as UserIcon, // Renamed to avoid conflict with `User` type
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { Toaster } from "sonner";
import { User } from "@supabase/supabase-js";

// --- Types ---

interface Profile {
    onboarding_completed: boolean;
    plan: string;
}

interface DashboardContextType {
    clinicName: string;
    setClinicName: (name: string) => void;
    clinicId: string;
    setClinicId: (id: string) => void;
    googleReviewLink: string;
    setGoogleReviewLink: (link: string) => void;
    isVoiceEnabled: boolean;
    setIsVoiceEnabled: (enabled: boolean) => void;
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
    plan: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboard() {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
    return ctx;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const [clinicName, setClinicName] = useState<string>("");
    const [clinicId, setClinicId] = useState<string>("");
    const [googleReviewLink, setGoogleReviewLink] = useState<string>("");
    const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
    const [primaryColor, setPrimaryColor] = useState<string>("#2C2B57");
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
    const [currentTime, setCurrentTime] = useState<string>(
        new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
    const [plan, setPlan] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

    // Load persisted UI state on mount
    useEffect(() => {
        const saved = localStorage.getItem("saffi_dashboard_settings");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.clinicName) setClinicName(parsed.clinicName);
            if (parsed.clinicId) setClinicId(parsed.clinicId);
            if (parsed.googleReviewLink) setGoogleReviewLink(parsed.googleReviewLink);
            if (parsed.isVoiceEnabled !== undefined) setIsVoiceEnabled(parsed.isVoiceEnabled);
        }
    }, []);

    // Fetch user metadata and check plan/onboarding status
    useEffect(() => {
        let mounted = true;

        const fetchUserAndProfile = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            setCurrentUser(user);

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("onboarding_completed, plan")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
                // Handle error appropriately, maybe redirect to an error page or show a message
                return;
            }

            if (mounted) {
                setCurrentProfile(profile);
                setPlan(profile.plan);

                if (!profile || profile.onboarding_completed === false || !profile.plan) {
                    router.push("/onboarding");
                    return;
                }

                // Redirect based on plan if user is on the root dashboard page
                if (pathname === '/dashboard' || pathname === '/dashboard/') {
                    if (profile.plan === 'digital') {
                        router.push('/dashboard/digital');
                    } else if (profile.plan === 'connect') {
                        router.push('/dashboard/connect');
                    }
                }

                const meta = user.user_metadata || {};
                const name = meta.clinic_name || "";
                const id = meta.clinic_id || "";
                if (name) setClinicName(name);
                if (id) setClinicId(id);

                // Persist to localStorage for fast reloads
                const current = JSON.parse(localStorage.getItem("saffi_dashboard_settings") || "{}");
                localStorage.setItem(
                    "saffi_dashboard_settings",
                    JSON.stringify({ ...current, clinicName: name, clinicId: id })
                );
                // Also store clinicName for TV mode queue state
                const queueState = JSON.parse(localStorage.getItem("saffi_queue_state") || "{}");
                localStorage.setItem(
                    "saffi_queue_state",
                    JSON.stringify({ ...queueState, clinicName: name })
                );
            }
        };

        fetchUserAndProfile();

        return () => { mounted = false; };

    }, [router, pathname]);

    // Persist UI state changes
    useEffect(() => {
        const payload = { clinicName, clinicId, googleReviewLink, isVoiceEnabled };
        localStorage.setItem("saffi_dashboard_settings", JSON.stringify(payload));
    }, [clinicName, clinicId, googleReviewLink, isVoiceEnabled]);


    // Clock ticker
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const handleOpenTV = () => window.open("/tv", "_blank");

    return (
        <DashboardContext.Provider
            value={{
                clinicName,
                setClinicName,
                clinicId,
                setClinicId,
                googleReviewLink,
                setGoogleReviewLink,
                isVoiceEnabled,
                setIsVoiceEnabled,
                primaryColor,
                setPrimaryColor,
                plan,
            }}
        >
            <Toaster position="top-right" richColors />
            <div className="min-h-screen bg-white flex font-sans text-black selection:bg-black selection:text-white" style={{ '--color-primary': primaryColor } as React.CSSProperties}>
                {/* Sidebar */}
                <aside
                    className={cn(
                        "bg-white border-r-2 border-black flex flex-col fixed h-full z-20 transition-all duration-300",
                        sidebarCollapsed ? "w-20" : "w-72"
                    )}
                >
                    <div
                        className={cn(
                            "h-24 flex items-center px-6 border-b-2 border-black bg-white",
                            sidebarCollapsed ? "justify-center" : "justify-between"
                        )}
                    >
                        {!sidebarCollapsed && (
                            <span className="font-display font-black text-4xl tracking-tighter uppercase text-black">
                                Saffi.
                            </span>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 hover:bg-gray-100 rounded border-2 border-transparent hover:border-black transition-all"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="flex-1 py-8 px-4 space-y-3">
                        {(plan === 'digital' || plan === null) && (
                            <SidebarItem
                                href="/dashboard/digital"
                                icon={LayoutDashboard}
                                label={plan === 'digital' ? "Tableau de Bord" : "Digital"}
                                isActive={pathname.startsWith("/dashboard/digital")}
                                collapsed={sidebarCollapsed}
                            />
                        )}
                        {(plan === 'connect' || plan === null) && (
                            <SidebarItem
                                href="/dashboard/connect"
                                icon={Cast}
                                label={plan === 'connect' ? "Tableau de Bord" : "Connect"}
                                isActive={pathname.startsWith("/dashboard/connect")}
                                collapsed={sidebarCollapsed}
                            />
                        )}

                        <SidebarItem href="/dashboard/analytics" icon={BarChart3} label="Statistiques" isActive={pathname === "/dashboard/analytics"} collapsed={sidebarCollapsed} />
                        <SidebarItem href="/dashboard/qr" icon={QrCode} label="Borne QR" isActive={pathname === "/dashboard/qr"} collapsed={sidebarCollapsed} />
                        <div className="pt-4 mt-4 border-t-2 border-black/10">
                            <SidebarItem href="/dashboard/settings" icon={Settings} label="Réglages" isActive={pathname === "/dashboard/settings"} collapsed={sidebarCollapsed} />
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <div className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300", sidebarCollapsed ? "ml-20" : "ml-72")}>
                    {/* Top Bar */}
                    <header className="h-24 bg-white border-b-2 border-black flex items-center justify-between px-8 sticky top-0 z-10">
                        <div className="flex items-center gap-6">
                            <h2 className="font-display font-black text-2xl uppercase tracking-tight">{clinicName}</h2>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-lg font-bold text-gray-600 flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                {currentTime}
                            </div>
                            {/* TV Button */}
                            <button
                                onClick={handleOpenTV}
                                className="bg-[var(--color-primary)] text-white px-6 py-3 font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center gap-3 transition-all"
                            >
                                <Tv className="h-6 w-6" /> TV Mode
                            </button>
                            {/* Simuler Patient Scan */}
                            <button
                                onClick={() => window.open(`/client-portal/${clinicId}`, "_blank")}
                                className="bg-[#2C2B57] text-white px-6 py-3 font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center gap-3 transition-all ml-2"
                            >
                                <UserIcon className="h-6 w-6" /> Simuler Patient
                            </button>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 bg-white p-8">{children}</main>
                </div>
            </div>
        </DashboardContext.Provider>
    );
}

function SidebarItem({ href, icon: Icon, label, isActive, collapsed }: { href: string; icon: any; label: string; isActive: boolean; collapsed: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-4 px-6 py-4 font-bold transition-all border-2",
                collapsed ? "justify-center px-2" : "",
                isActive
                    ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_#000]"
                    : "bg-white text-gray-500 border-transparent hover:border-black hover:bg-gray-50 hover:text-black"
            )}
            title={collapsed ? label : undefined}
        >
            <Icon className={cn("h-6 w-6 stroke-[2.5]", isActive ? "text-white" : "text-current")} />
            {!collapsed && <span className="uppercase tracking-wide text-sm">{label}</span>}
        </Link>
    );
}