"use client";

import { useState } from "react";
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
import { Clock, Wallet, Star, FileText } from "lucide-react";
import { useDashboard } from "../layout";

// Mock Data Strategy
const mockStats = {
    timeSaved: "12h 30m",
    revenueSaved: "600 TND",
    newReviews: "+8",
    patientsPerDay: [
        { name: "Lun", patients: 45 },
        { name: "Mar", patients: 52 },
        { name: "Mer", patients: 38 },
        { name: "Jeu", patients: 65 },
        { name: "Ven", patients: 48 },
        { name: "Sam", patients: 25 },
    ],
    patientRetention: [
        { name: "Nouveaux", value: 30 },
        { name: "Récurrents", value: 70 },
    ]
};

export default function AnalyticsPage() {
    const { primaryColor } = useDashboard();
    const [timeRange, setTimeRange] = useState<"month" | "year">("month");

    return (
        <div className="space-y-4 p-2 h-[calc(100vh-140px)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="font-black text-3xl uppercase tracking-tight">Statistiques & ROI</h1>
                    <p className="text-gray-500 font-bold text-sm mt-0.5">Analysez la valeur ajoutée de votre cabinet.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Filter */}
                    <div className="flex bg-white border-2 border-black p-1 shadow-[4px_4px_0px_0px_#000]">
                        <button
                            onClick={() => setTimeRange("month")}
                            className={`px-4 py-1.5 font-bold uppercase text-xs transition-all ${timeRange === "month" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"}`}
                        >
                            Ce Mois
                        </button>
                        <button
                            onClick={() => setTimeRange("year")}
                            className={`px-4 py-1.5 font-bold uppercase text-xs transition-all ${timeRange === "year" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"}`}
                        >
                            Cette Année
                        </button>
                    </div>

                    {/* PDF Export Button */}
                    <button className="bg-white text-black px-4 py-2 font-bold uppercase tracking-wider text-xs border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Rapport PDF
                    </button>
                </div>
            </div>

            {/* Section 1: ROI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                {/* Card 1: Time Saved */}
                <div className="bg-yellow-300 border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between transition-transform hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-white border-2 border-black rounded-none">
                            <Clock className="h-5 w-5 text-black" />
                        </div>
                        <span className="font-black text-4xl tracking-tighter">{mockStats.timeSaved}</span>
                    </div>
                    <div>
                        <h3 className="font-black text-lg uppercase mb-0.5">Temps Gagné</h3>
                        <p className="font-medium text-black/80 text-sm leading-tight">d'interruptions secrétariat évitées.</p>
                    </div>
                </div>

                {/* Card 2: Revenue Saved */}
                <div className="bg-green-300 border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between transition-transform hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-white border-2 border-black rounded-none">
                            <Wallet className="h-5 w-5 text-black" />
                        </div>
                        <span className="font-black text-4xl tracking-tighter">{mockStats.revenueSaved}</span>
                    </div>
                    <div>
                        <h3 className="font-black text-lg uppercase mb-0.5">Revenu Sécurisé</h3>
                        <p className="font-medium text-black/80 text-sm leading-tight">12 patients rappelés automatiquement.</p>
                    </div>
                </div>

                {/* Card 3: Reputation */}
                <div className="bg-purple-300 border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between transition-transform hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-white border-2 border-black rounded-none">
                            <Star className="h-5 w-5 text-black" />
                        </div>
                        <span className="font-black text-4xl tracking-tighter">{mockStats.newReviews}</span>
                    </div>
                    <div>
                        <h3 className="font-black text-lg uppercase mb-0.5">Avis Google</h3>
                        <p className="font-medium text-black/80 text-sm leading-tight">Nouveaux avis 5 étoiles.</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                {/* Section 2: Patient Volume (Bar Chart) */}
                <div className="lg:col-span-2 bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col h-full">
                    <h3 className="font-black text-xl uppercase mb-4 flex items-center gap-2">
                        <span className="w-3 h-6 bg-black block"></span>
                        Volume Patients
                    </h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockStats.patientsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={{ stroke: '#000', strokeWidth: 2 }}
                                    tickLine={false}
                                    tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold', dy: 10 }}
                                />
                                <YAxis
                                    axisLine={{ stroke: '#000', strokeWidth: 2 }}
                                    tickLine={false}
                                    tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold', dx: -10 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white border-2 border-black p-2 shadow-[4px_4px_0px_0px_#000]">
                                                    <p className="font-bold text-sm mb-1">{label}</p>
                                                    <p className="font-black text-lg">{payload[0].value} Patients</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="patients" fill="white" stroke="black" strokeWidth={2} radius={[0, 0, 0, 0]} activeBar={{ fill: "black", stroke: "black" }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Section 3: Retention Pie Chart */}
                <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col h-full">
                    <h3 className="font-black text-xl uppercase mb-4 flex items-center gap-2">
                        <span className="w-3 h-6 bg-black block"></span>
                        Fidélisation
                    </h3>
                    <div className="flex-1 w-full relative min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mockStats.patientRetention}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="black"
                                    strokeWidth={2}
                                >
                                    {mockStats.patientRetention.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? "white" : "black"} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white border-2 border-black p-2 shadow-[4px_4px_0px_0px_#000]">
                                                    <p className="font-bold text-sm mb-1">{payload[0].name}</p>
                                                    <p className="font-black text-lg">{payload[0].value}%</p>
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
                                    formatter={(value, entry: any) => <span className="text-black font-bold ml-2 text-xs uppercase">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text for Donut */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                            <div className="text-center">
                                <span className="block text-4xl font-black">70%</span>
                                <span className="block text-[10px] font-bold uppercase tracking-widest">Récurrents</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 p-3 bg-green-100 border-2 border-black">
                        <p className="font-bold text-xs text-center">
                            ✅ Succès : Vos patients reviennent.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
