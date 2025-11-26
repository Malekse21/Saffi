"use client";

import { useState, useEffect, useRef } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { Download, Calendar as CalendarIcon, TrendingUp, Star, Lock } from "lucide-react";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { HiddenReportTemplate } from "@/components/HiddenReportTemplate";
import { getAnalytics, AnalyticsData } from "@/lib/analytics";
import { useDashboard } from "../layout";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";


export default function AnalyticsPage() {
    const { primaryColor, plan } = useDashboard();
    const COLORS = ["#000000", primaryColor, "#2C2B57"];

    const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">("day");
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const reportRef = useRef<HTMLDivElement>(null);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);

    // Fetch analytics whenever the selected time range changes
    useEffect(() => {
        if (plan !== 'connect') {
            setLoading(false);
            return;
        };
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getAnalytics(timeRange);
                setData(result);
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [timeRange, plan]);

    // Fetch patient feedback
    useEffect(() => {
        if (plan !== 'connect') return;
        const fetchFeedback = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data } = await supabase
                    .from('patient_feedback')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (data) setFeedbacks(data);
            }
        };

        fetchFeedback();
    }, [plan]);

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                logging: false,
                useCORS: true,
            });
            const imgData = canvas.toDataURL("image/jpeg", 1.0);
            const pdf = new jsPDF("p", "mm", "a4");
            pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
            pdf.save("Saffi-Analytics.pdf");
        } catch (e) {
            console.error("PDF generation failed", e);
            alert("Erreur lors de la génération du PDF");
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Chargement des statistiques…</p>
                </div>
            </div>
        );
    }

    if (plan === 'digital') {
        return (
            <div className="relative">
                <div className="absolute inset-0 bg-white/50 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-8">
                    <div className="bg-black text-white p-10 border-4 border-black shadow-[10px_10px_0px_0px_#2C2B57]">
                        <Lock className="h-16 w-16 mx-auto mb-4" />
                        <h2 className="font-display font-black text-4xl uppercase tracking-tight text-white">
                            Passez au Plan Connect
                        </h2>
                        <p className="text-gray-300 mt-2 max-w-sm">
                            Accédez à des statistiques détaillées, des rapports PDF et bien plus encore en passant au plan Connect.
                        </p>
                        <Link href="/dashboard/settings"
                            className="mt-6 inline-block bg-[#2C2B57] text-white px-8 py-4 font-black uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_0px_#FFF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#FFF] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                        >
                            Mettre à niveau
                        </Link>
                    </div>
                </div>

                <div className="space-y-8 blur-md select-none pointer-events-none">
                    {/* Header & Controls */}
                    <div className="flex items-center justify-between">
                        <h1 className="font-display font-black text-4xl uppercase tracking-tight">Analytiques & Retours</h1>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-100 border-2 border-black p-1">
                                <button className="px-4 py-2 font-bold uppercase text-sm bg-black text-white shadow-[2px_2px_0px_0px_#000]">Jour</button>
                                <button className="px-4 py-2 font-bold uppercase text-sm text-gray-500">Semaine</button>
                                <button className="px-4 py-2 font-bold uppercase text-sm text-gray-500">Mois</button>
                                <button className="px-4 py-2 font-bold uppercase text-sm text-gray-500">Année</button>
                            </div>
                            <button className="bg-gray-300 text-white px-6 py-3 font-bold uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center gap-2">
                                <Download className="h-5 w-5" /> Télécharger
                            </button>
                        </div>
                    </div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KPICard title="Total Patients" value="123" change="+12%" />
                        <KPICard title="Temps d'Attente Moy." value={`22 min`} change="-5%" positive />
                        <KPICard title="Taux d'Absence" value={`8%`} change="+1.2%" negative />
                    </div>
                </div>
            </div>

        )
    }

    // Empty state when there is no patient data
    if (!data || data.stats.total === 0) {
        return (
            <div className="space-y-8" ref={reportRef}>
                <h1 className="font-display font-black text-4xl uppercase tracking-tight">Analytiques & Retours</h1>
                <div className="bg-white border-2 border-black p-12 shadow-[8px_8px_0px_0px_#000] text-center">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="font-bold text-xl text-gray-400 mb-2">Aucune donnée disponible</h3>
                    <p className="text-gray-500">Ajoutez des patients pour voir vos statistiques.</p>
                    <button
                        onClick={handleDownloadPDF}
                        className="mt-4 bg-[var(--color-primary)] text-white px-6 py-3 font-bold uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
                    >
                        <Download className="h-5 w-5" />
                        Télécharger Rapport
                    </button>
                </div>
            </div>
        );
    }

    // Main analytics view
    return (
        <div className="space-y-8" ref={reportRef}>
            {/* Header & Controls */}
            <div className="flex items-center justify-between">
                <h1 className="font-display font-black text-4xl uppercase tracking-tight">Analytiques & Retours</h1>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 border-2 border-black p-1">
                        {(["day", "week", "month", "year"] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 font-bold uppercase text-sm transition-all ${timeRange === range ? "bg-black text-white shadow-[2px_2px_0px_0px_#000]" : "text-gray-500 hover:text-black"
                                    }`}
                            >
                                {range === "day"
                                    ? "Jour"
                                    : range === "week"
                                        ? "Semaine"
                                        : range === "month"
                                            ? "Mois"
                                            : "Année"}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleDownloadPDF}
                        className="bg-[var(--color-primary)] text-white px-6 py-3 font-bold uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
                    >
                        <Download className="h-5 w-5" />
                        Télécharger Rapport
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard title="Total Patients" value={data.stats.total.toString()} change="+12%" />
                <KPICard title="Temps d'Attente Moy." value={`${data.stats.avgWait} min`} change="-5%" positive />
                <KPICard title="Taux d'Absence" value={`${data.stats.noShows}%`} change="+1.2%" negative />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Affluence Bar Chart */}
                <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_#000] h-[400px] flex flex-col">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                        <BarChart className="h-5 w-5" /> Affluence
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.affluence}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                <XAxis dataKey="name" stroke="#000" tick={{ fill: "#000", fontWeight: "bold", fontSize: 12 }} axisLine={{ strokeWidth: 2 }} tickLine={false} dy={10} />
                                <YAxis stroke="#000" tick={{ fill: "#000", fontWeight: "bold", fontSize: 12 }} axisLine={{ strokeWidth: 2 }} tickLine={false} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: "#f3f4f6" }}
                                    contentStyle={{ backgroundColor: "#000", border: "none", borderRadius: "0px", color: "#fff", fontWeight: "bold" }}
                                />
                                <Bar dataKey="patients" fill="#F3FF34" stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} activeBar={{ fill: "#10B981", stroke: "#000", strokeWidth: 2 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Wait Time Line Chart */}
                <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_#000] h-[400px] flex flex-col">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" /> Temps d'Attente
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.waitTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                <XAxis dataKey="name" stroke="#000" tick={{ fill: "#000", fontWeight: "bold", fontSize: 12 }} axisLine={{ strokeWidth: 2 }} tickLine={false} dy={10} />
                                <YAxis stroke="#000" tick={{ fill: "#000", fontWeight: "bold", fontSize: 12 }} axisLine={{ strokeWidth: 2 }} tickLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#000", border: "none", borderRadius: "0px", color: "#fff", fontWeight: "bold" }}
                                />
                                <Line type="monotone" dataKey="time" stroke={primaryColor} strokeWidth={4} dot={{ fill: "#000", strokeWidth: 2, r: 4 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Patient Type Pie Chart */}
                <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_#000] h-[400px] flex flex-col lg:col-span-2">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                        <PieChart className="h-5 w-5" /> Répartition des Patients
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.patientType}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                    stroke="#000"
                                    strokeWidth={2}
                                >
                                    {data.patientType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#000", border: "none", borderRadius: "0px", color: "#fff", fontWeight: "bold" }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Hidden template for PDF generation */}
            <HiddenReportTemplate
                ref={reportRef}
                date={new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                stats={data.stats}
                chartData={data.affluence}
                waitTimeData={data.waitTime}
                patientTypeData={data.patientType}
                primaryColor={primaryColor}
            />

            {/* Feedback Section */}
            {feedbacks.length > 0 && (
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
                    <div className="border-b-4 border-black p-6">
                        <h2 className="font-display font-black text-2xl uppercase tracking-tight">
                            Retours Patients
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {feedbacks.map((fb) => (
                            <div key={fb.id} className="border-2 border-black p-4 bg-gray-50">
                                <div className="flex items-center gap-2 mb-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className={`h-5 w-5 ${s <= fb.rating ? "fill-[#2C2B57] text-[#2C2B57]" : "fill-gray-300 text-gray-300"}`}
                                        />
                                    ))}
                                    <span className="text-xs text-gray-500 ml-auto font-mono">
                                        {new Date(fb.created_at).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                {fb.feedback_text && (
                                    <p className="text-gray-700 font-medium">{fb.feedback_text}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function KPICard({ title, value, change, positive, negative }: { title: string; value: string; change: string; positive?: boolean; negative?: boolean }) {
    return (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_#000]">
            <p className="text-gray-500 font-bold text-sm uppercase mb-2">{title}</p>
            <div className="flex items-end justify-between">
                <span className="font-display font-black text-5xl">{value}</span>
                <span className={`font-bold text-sm px-2 py-1 border border-black ${positive ? "bg-green-100 text-green-700" : negative ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{change}</span>
            </div>
        </div>
    );
}
