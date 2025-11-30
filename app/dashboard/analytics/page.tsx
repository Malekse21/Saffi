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
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { Clock, Wallet, Star, FileText, Loader2 } from "lucide-react";
import { useDashboard } from "../layout";
import { createClient } from "@/utils/supabase/client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

export default function AnalyticsPage() {
    const { primaryColor } = useDashboard();
    const [timeRange, setTimeRange] = useState<"month" | "year">("month");
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const [stats, setStats] = useState({
        timeSaved: "0h 0m",
        revenueSaved: "0 TND",
        newReviews: "+0",
        patientsPerDay: [] as any[],
        consultationTypes: [] as any[],
        totalPatients: 0,
        rdvPercentage: 0
    });

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            // Get date range
            const now = new Date();
            let startDate = new Date();

            if (timeRange === "month") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else {
                startDate = new Date(now.getFullYear(), 0, 1);
            }

            const { data: patients, error } = await supabase
                .from("patients")
                .select("*")
                .gte("created_at", startDate.toISOString());

            if (error) throw error;

            processData(patients || []);
        } catch (error) {
            console.error("Error fetching analytics:", error);
            toast.error("Erreur lors du chargement des statistiques");
        } finally {
            setLoading(false);
        }
    };

    const processData = (patients: any[]) => {
        // 1. ROI Calculations
        // Assumption: 15 mins saved per patient, 40 TND revenue per patient
        const totalPatients = patients.length;
        const totalMinutesSaved = totalPatients * 15;
        const hours = Math.floor(totalMinutesSaved / 60);
        const minutes = totalMinutesSaved % 60;
        const revenue = totalPatients * 40; // Estimate

        // 2. Consultation Types
        const rdvCount = patients.filter(p => p.type === 'rdv').length;
        const walkInCount = patients.filter(p => p.type === 'walk-in').length;
        const rdvPercentage = totalPatients > 0 ? Math.round((rdvCount / totalPatients) * 100) : 0;

        const consultationTypes = [
            { name: "Sans RDV", value: walkInCount },
            { name: "Sur RDV", value: rdvCount },
        ];

        // 3. Patients Volume (Bar Chart)
        let patientsPerDay = [];

        if (timeRange === "month") {
            // Group by day of month (1-31)
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const dailyCounts = new Array(daysInMonth).fill(0);

            patients.forEach(p => {
                const day = new Date(p.created_at).getDate();
                if (day >= 1 && day <= daysInMonth) {
                    dailyCounts[day - 1]++;
                }
            });

            patientsPerDay = dailyCounts.map((count, index) => ({
                name: `${index + 1}`,
                patients: count
            }));
        } else {
            // Group by month (Jan-Dec)
            const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
            const monthlyCounts = new Array(12).fill(0);

            patients.forEach(p => {
                const month = new Date(p.created_at).getMonth();
                if (month >= 0 && month <= 11) {
                    monthlyCounts[month]++;
                }
            });

            patientsPerDay = months.map((name, index) => ({
                name,
                patients: monthlyCounts[index]
            }));
        }

        setStats({
            timeSaved: `${hours}h ${minutes}m`,
            revenueSaved: `${revenue} TND`,
            newReviews: `+${Math.floor(totalPatients / 10)}`, // Mock: 1 review per 10 patients
            patientsPerDay,
            consultationTypes,
            totalPatients,
            rdvPercentage
        });
    };

    const handleDownloadPDF = async () => {
        if (!containerRef.current) return;

        const toastId = toast.loading("Génération du rapport PDF...");

        try {
            const canvas = await html2canvas(containerRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#f9fafb" // gray-50
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4"
            });

            const imgWidth = 297; // A4 landscape width
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
            pdf.save(`rapport_analytique_${timeRange}_${new Date().toISOString().split('T')[0]}.pdf`);

            toast.success("Rapport téléchargé avec succès", { id: toastId });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Erreur lors de la génération du PDF", { id: toastId });
        }
    };

    return (
        <div ref={containerRef} className="space-y-4 p-2 h-[calc(100vh-140px)] overflow-hidden flex flex-col bg-[#f9fafb]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="font-black text-3xl uppercase tracking-tight">Statistiques & ROI</h1>
                    <p className="text-[#6b7280] font-bold text-sm mt-0.5">Analysez la valeur ajoutée de votre cabinet.</p>
                </div>

                <div className="flex items-center gap-3" data-html2canvas-ignore>
                    {/* Date Filter */}
                    <div className="flex bg-[#ffffff] border-2 border-[#000000] p-1 shadow-[4px_4px_0px_0px_#000000]">
                        <button
                            onClick={() => setTimeRange("month")}
                            className={`px-4 py-1.5 font-bold uppercase text-xs transition-all ${timeRange === "month" ? "bg-[#000000] text-[#ffffff]" : "text-[#6b7280] hover:bg-[#f3f4f6]"}`}
                        >
                            Ce Mois
                        </button>
                        <button
                            onClick={() => setTimeRange("year")}
                            className={`px-4 py-1.5 font-bold uppercase text-xs transition-all ${timeRange === "year" ? "bg-[#000000] text-[#ffffff]" : "text-[#6b7280] hover:bg-[#f3f4f6]"}`}
                        >
                            Cette Année
                        </button>
                    </div>

                    {/* PDF Export Button */}
                    <button
                        onClick={handleDownloadPDF}
                        className="bg-[#ffffff] text-[#000000] px-4 py-2 font-bold uppercase tracking-wider text-xs border-2 border-[#000000] shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        Rapport PDF
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#000000]" />
                </div>
            ) : (
                <>
                    {/* Section 1: ROI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                        {/* Card 1: Time Saved */}
                        <div className="bg-[#fde047] border-2 border-[#000000] p-5 shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between transition-transform hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-[#ffffff] border-2 border-[#000000] rounded-none">
                                    <Clock className="h-5 w-5 text-[#000000]" />
                                </div>
                                <span className="font-black text-4xl tracking-tighter">{stats.timeSaved}</span>
                            </div>
                            <div>
                                <h3 className="font-black text-lg uppercase mb-0.5">Temps Gagné</h3>
                                <p className="font-medium text-[#333333] text-sm leading-tight">Estimé sur {stats.totalPatients} patients.</p>
                            </div>
                        </div>

                        {/* Card 2: Revenue Saved */}
                        <div className="bg-[#86efac] border-2 border-[#000000] p-5 shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between transition-transform hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-[#ffffff] border-2 border-[#000000] rounded-none">
                                    <Wallet className="h-5 w-5 text-[#000000]" />
                                </div>
                                <span className="font-black text-4xl tracking-tighter">{stats.revenueSaved}</span>
                            </div>
                            <div>
                                <h3 className="font-black text-lg uppercase mb-0.5">Revenu Estimé</h3>
                                <p className="font-medium text-[#333333] text-sm leading-tight">Basé sur l'activité.</p>
                            </div>
                        </div>

                        {/* Card 3: Reputation */}
                        <div className="bg-[#d8b4fe] border-2 border-[#000000] p-5 shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between transition-transform hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-[#ffffff] border-2 border-[#000000] rounded-none">
                                    <Star className="h-5 w-5 text-[#000000]" />
                                </div>
                                <span className="font-black text-4xl tracking-tighter">{stats.newReviews}</span>
                            </div>
                            <div>
                                <h3 className="font-black text-lg uppercase mb-0.5">Avis Google</h3>
                                <p className="font-medium text-[#333333] text-sm leading-tight">Nouveaux avis potentiels.</p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                        {/* Section 2: Patient Volume (Bar Chart) */}
                        <div className="lg:col-span-2 bg-[#ffffff] border-2 border-[#000000] p-5 shadow-[4px_4px_0px_0px_#000000] flex flex-col h-full">
                            <h3 className="font-black text-xl uppercase mb-4 flex items-center gap-2">
                                <span className="w-3 h-6 bg-[#000000] block"></span>
                                Volume Patients ({timeRange === 'month' ? 'Journalier' : 'Mensuel'})
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.patientsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                                            tickLine={false}
                                            tick={{ fill: '#000000', fontSize: 12, fontWeight: 'bold', dy: 10 }}
                                            interval={timeRange === 'month' ? 2 : 0} // Show every 3rd day for month view to avoid crowding
                                        />
                                        <YAxis
                                            axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                                            tickLine={false}
                                            tick={{ fill: '#000000', fontSize: 12, fontWeight: 'bold', dx: -10 }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f3f4f6' }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-[#ffffff] border-2 border-[#000000] p-2 shadow-[4px_4px_0px_0px_#000000]">
                                                            <p className="font-bold text-sm mb-1">{timeRange === 'month' ? `Jour ${label}` : label}</p>
                                                            <p className="font-black text-lg">{payload[0].value} Patients</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="patients" fill="#ffffff" stroke="#000000" strokeWidth={2} radius={[0, 0, 0, 0]} activeBar={{ fill: "#000000", stroke: "#000000" }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Section 3: Consultation Types Pie Chart */}
                        <div className="bg-[#ffffff] border-2 border-[#000000] p-5 shadow-[4px_4px_0px_0px_#000000] flex flex-col h-full">
                            <h3 className="font-black text-xl uppercase mb-4 flex items-center gap-2">
                                <span className="w-3 h-6 bg-[#000000] block"></span>
                                Type de Consultation
                            </h3>
                            <div className="flex-1 w-full relative min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.consultationTypes}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            fill="#8884d8"
                                            paddingAngle={0}
                                            dataKey="value"
                                            stroke="#000000"
                                            strokeWidth={2}
                                        >
                                            {stats.consultationTypes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? "#ffffff" : "#000000"} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-[#ffffff] border-2 border-[#000000] p-2 shadow-[4px_4px_0px_0px_#000000]">
                                                            <p className="font-bold text-sm mb-1">{payload[0].name}</p>
                                                            <p className="font-black text-lg">{payload[0].value} Patients</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="square"
                                            formatter={(value, entry: any) => <span className="text-[#000000] font-bold ml-2 text-xs uppercase">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text for Donut */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                    <div className="text-center">
                                        <span className="block text-4xl font-black">{stats.rdvPercentage}%</span>
                                        <span className="block text-[10px] font-bold uppercase tracking-widest">Sur RDV</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
