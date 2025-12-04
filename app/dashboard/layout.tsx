"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, QrCode, Settings, LogOut, User, Monitor, Plus, ChevronLeft, ChevronRight, UserCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [time, setTime] = useState<Date | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let channel: any;

        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (data) {
                setProfile(data);
                if (data.avatar_url) updateAvatarUrl(data.avatar_url);
            }

            // Subscribe to realtime changes for this specific profile
            channel = supabase
                .channel(`profile-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`,
                    },
                    (payload) => {
                        console.log("Profile updated:", payload.new);
                        setProfile(payload.new);
                        if (payload.new.avatar_url) updateAvatarUrl(payload.new.avatar_url);
                    }
                )
                .subscribe();
        };

        fetchProfile();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    const updateAvatarUrl = async (path: string) => {
        if (!path) return;
        if (path.startsWith('http')) {
            setAvatarUrl(path);
        } else {
            const { data } = await supabase.storage
                .from('avatars')
                .createSignedUrl(path, 60 * 60 * 24);
            if (data?.signedUrl) setAvatarUrl(data.signedUrl);
        }
    };

    const menuItems = [
        {
            name: "Accueil",
            href: "/dashboard/accueil",
            icon: LayoutDashboard,
            active: pathname === "/dashboard/accueil",
        },
        {
            name: "Analytiques",
            href: "/dashboard/analytics",
            icon: TrendingUp,
            active: pathname === "/dashboard/analytics",
        },
        {
            name: "Borne QR",
            href: "/dashboard/qr-station",
            icon: QrCode,
            active: pathname === "/dashboard/qr-station",
        },
        {
            name: "Réglages",
            href: "/dashboard/settings",
            icon: Settings,
            active: pathname === "/dashboard/settings",
        },
    ];

    return (
        <div className="flex min-h-screen bg-white font-sans text-black">
            {/* Sidebar (Fixed Left) */}
            <aside className={cn(
                "fixed left-0 top-0 z-40 h-screen border-r-2 border-black bg-white hidden print:hidden md:flex md:flex-col transition-all duration-300",
                sidebarCollapsed ? "w-20 p-4 items-center" : "w-64 p-6"
            )}>
                {/* Logo & Toggle */}
                <div className={cn("mb-10 flex items-center", sidebarCollapsed ? "justify-center w-full" : "justify-between w-full")}>
                    {!sidebarCollapsed && <h1 className="text-3xl font-bold tracking-tight">Saffi.</h1>}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 hover:bg-gray-100 border-2 border-black rounded-none transition-colors"
                    >
                        {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </button>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 space-y-4 w-full">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-none border-2 px-4 py-3 text-sm font-bold transition-all",
                                item.active
                                    ? "border-black bg-black text-white shadow-[4px_4px_0px_0px_#000]"
                                    : "border-transparent bg-transparent text-black hover:border-black hover:bg-gray-50",
                                sidebarCollapsed && "justify-center"
                            )}
                            title={sidebarCollapsed ? item.name : undefined}
                        >
                            <item.icon className="h-5 w-5" />
                            {!sidebarCollapsed && item.name}
                        </Link>
                    ))}
                </nav>

                {/* User Profile - Clickable */}
                <Link
                    href="/dashboard/profile"
                    className="mt-auto border-t-2 border-black pt-6 hover:bg-gray-50 transition-colors cursor-pointer w-full"
                >
                    <div className={cn(
                        "flex items-center gap-3",
                        sidebarCollapsed && "justify-center"
                    )}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-gray-100 overflow-hidden relative">
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                            ) : (
                                <User className="h-5 w-5" />
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-bold">
                                    {profile?.full_name ? `Dr. ${profile.full_name}` : "Chargement..."}
                                </p>
                            </div>
                        )}
                    </div>
                </Link>
            </aside>

            {/* Main Content */}
            <div className={cn(
                "flex-1 transition-all duration-300",
                sidebarCollapsed ? "md:ml-20" : "md:ml-64"
            )}>
                {/* Top Bar */}
                <header className="sticky top-0 z-30 flex h-24 items-center justify-between border-b-2 border-black bg-white px-8 print:hidden">
                    {/* Left: Cabinet Name */}
                    <div className="flex flex-col justify-center">
                        <h1 className="text-2xl font-black uppercase tracking-tight leading-none">
                            {profile?.clinic_name || "Cabinet Médical"}
                        </h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                            {profile?.specialty || "Médecine Générale"}
                        </p>
                    </div>

                    {/* Center: SMS Count */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform flex items-center gap-2">
                        <div className="flex items-center gap-3 rounded-full border-2 border-black bg-gray-100 px-6 py-2 font-bold text-lg shadow-[4px_4px_0px_0px_#000]">
                            <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                            <span>{profile?.sms_balance || 0} SMS</span>
                        </div>
                        <Link
                            href="/dashboard/sms-topup"
                            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-solar-yellow text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-y-0 active:shadow-none"
                            title="Recharger SMS"
                        >
                            <Plus className="h-5 w-5 stroke-[3]" />
                        </Link>
                    </div>

                    {/* Right: Date & Time */}
                    <div className="flex flex-col items-end justify-center">
                        <div className="text-3xl font-black tracking-tight leading-none">
                            {time ? time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                        </div>
                        <div className="text-lg font-bold text-gray-500 leading-none mt-1">
                            {time ? time.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' }) : "..."}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="min-h-[calc(100vh-64px)] bg-gray-50/50 p-6 print:p-0 print:bg-white">
                    {children}
                </main>
            </div>
        </div>
    );
}
