import { forwardRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

interface ReportProps {
    date: string;
    stats: {
        total: number;
        avgWait: number;
        noShows: number;
    };
    chartData: any[];
    waitTimeData: any[];
    patientTypeData: any[];
    primaryColor: string;
}

export const HiddenReportTemplate = forwardRef<HTMLDivElement, ReportProps>(({ date, stats, chartData, waitTimeData, patientTypeData, primaryColor }, ref) => {
    const COLORS = ['#0088FE', primaryColor, '#FFBB28', '#FF8042'];
    return (
        <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
            <div ref={ref} className="w-[210mm] h-[297mm] bg-white p-12 flex flex-col gap-8 text-black font-sans" style={{ width: '210mm', height: '297mm' }}>
                {/* Header */}
                <div className="border-b-4 border-black pb-8 flex justify-between items-end">
                    <div>
                        <h1 className="font-display font-black text-6xl uppercase tracking-tighter">Rapport</h1>
                        <p className="text-2xl font-bold text-gray-500">Activité Journalière</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-xl">{date}</p>
                        <p className="text-sm text-gray-400">Généré par Saffi.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="border-4 border-black p-6 bg-gray-50">
                        <p className="text-sm font-bold text-gray-500 uppercase">Total Patients</p>
                        <p className="font-display font-black text-6xl mt-2">{stats.total}</p>
                    </div>
                    <div className="border-4 border-black p-6 bg-gray-50">
                        <p className="text-sm font-bold text-gray-500 uppercase">Temps Moyen</p>
                        <p className="font-display font-black text-6xl mt-2">{stats.avgWait}<span className="text-2xl">min</span></p>
                    </div>
                    <div className="border-4 border-black p-6 bg-gray-50">
                        <p className="text-sm font-bold text-gray-500 uppercase">Absents</p>
                        <p className="font-display font-black text-6xl mt-2 text-red-500">{stats.noShows}</p>
                    </div>
                </div>

                {/* Main Chart Section */}
                <div className="flex-1 border-4 border-black p-6 flex flex-col min-h-[300px]">
                    <h3 className="font-bold text-xl mb-4 uppercase">Affluence par Heure</h3>
                    <div className="flex-1 w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                <XAxis dataKey="name" stroke="#000" tick={{ fill: '#000', fontWeight: 'bold', fontSize: 10 }} />
                                <YAxis stroke="#000" tick={{ fill: '#000', fontWeight: 'bold', fontSize: 10 }} />
                                <Bar dataKey="patients" fill="#FACC15" stroke="#000" strokeWidth={2} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Charts Grid */}
                <div className="grid grid-cols-2 gap-6 h-[300px]">
                    {/* Wait Time Chart */}
                    <div className="border-4 border-black p-6 flex flex-col">
                        <h3 className="font-bold text-xl mb-4 uppercase">Temps d'Attente</h3>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={waitTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="name" stroke="#000" tick={{ fill: '#000', fontWeight: 'bold', fontSize: 10 }} />
                                    <YAxis stroke="#000" tick={{ fill: '#000', fontWeight: 'bold', fontSize: 10 }} />
                                    <Line type="monotone" dataKey="time" stroke={primaryColor} strokeWidth={3} dot={{ fill: '#000', r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Distribution Chart */}
                    <div className="border-4 border-black p-6 flex flex-col">
                        <h3 className="font-bold text-xl mb-4 uppercase">Répartition</h3>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={patientTypeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: { name?: string, percent?: number }) => `${name || ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        stroke="#000"
                                        strokeWidth={2}
                                    >
                                        {patientTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t-4 border-black pt-8 text-center">
                    <p className="font-bold text-gray-400">Document confidentiel - Usage interne uniquement</p>
                </div>
            </div>
        </div>
    );
});

HiddenReportTemplate.displayName = "HiddenReportTemplate";
