"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { createClient } from "@/utils/supabase/client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, QrCode, Settings, LogOut, User, Monitor, Plus, ChevronLeft, ChevronRight, UserCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardContextType {
    primaryColor: string;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [time, setTime] = useState<Date | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [primaryColor, setPrimaryColor] = useState("#2C2B57"); // Default color

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchProfileData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile, error } = await supabase
                    .from("profiles")
                    .select("primary_color")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    if (profile.primary_color) {
                        setPrimaryColor(profile.primary_color);
                    }
                } else if (error) {
                    console.error("Error fetching profile for dashboard layout:", JSON.stringify(error, null, 2));
                }
            }
        };

        fetchProfileData();
    }, []);

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
            href: "/dashboard/qr",
            icon: QrCode,
            active: pathname === "/dashboard/qr",
        },
        {
            name: "Réglages",
            href: "/dashboard/settings",
            icon: Settings,
            active: pathname === "/dashboard/settings",
        },
    ];

    return (
        <DashboardContext.Provider value={{ primaryColor }}>
            <div className="flex min-h-screen bg-white font-sans text-black" style={{ '--color-primary': primaryColor } as React.CSSProperties}>
                {/* Sidebar (Fixed Left) */}
                <aside className={cn(
                    "fixed left-0 top-0 z-40 h-screen border-r-2 border-black bg-white p-6 hidden print:hidden md:flex md:flex-col transition-all duration-300",
                    sidebarCollapsed ? "w-20" : "w-64"
                )}>
                    {/* Logo & Toggle */}
                    <div className="mb-10 flex items-center justify-between">
                        {!sidebarCollapsed && <h1 className="text-3xl font-bold tracking-tight">Saffi.</h1>}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 hover:bg-gray-100 border-2 border-black rounded-none transition-colors"
                        >
                            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                        </button>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 space-y-4">
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
                        className="mt-auto border-t-2 border-black pt-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <div className={cn(
                            "flex items-center gap-3",
                            sidebarCollapsed && "justify-center"
                        )}>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-gray-100">
                                <User className="h-5 w-5" />
                            </div>
                            {!sidebarCollapsed && (
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate text-sm font-bold">Dr. Malek</p>
                                    <p className="truncate text-xs text-gray-500">Admin</p>
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
                                Cabinet Dr. Malek
                            </h1>
                            <p className="text-sm font-medium text-gray-500 mt-1">
                                Médecine Générale
                            </p>
                        </div>

                        {/* Center: SMS Count */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                            <div className="flex items-center gap-3 rounded-full border-2 border-black bg-gray-100 px-6 py-2 font-bold text-lg shadow-[4px_4px_0px_0px_#000]">
                                <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                                <span>0 SMS</span>
                            </div>
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
        </DashboardContext.Provider>
    );
}
