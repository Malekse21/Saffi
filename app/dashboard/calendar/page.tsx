"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, MapPin, Calendar as CalendarIcon, Clock, Phone, User, Edit, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AddAppointmentModal } from "@/components/dashboard/AddAppointmentModal";
import { toast } from "sonner";

// Type definitions
type Appointment = {
    id: string;
    patient_name: string;
    phone: string;
    motif: string;
    start_time: string;
    status: 'confirmed' | 'cancelled' | 'completed';
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    // Fetch appointments for the selected day
    useEffect(() => {
        fetchDayAppointments(selectedDate);
    }, [selectedDate]);

    // Fetch appointments for the current month (for dots/badges)
    useEffect(() => {
        fetchMonthAppointments(currentDate);
    }, [currentDate]);

    const fetchDayAppointments = async (date: Date) => {
        setIsLoading(true);
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .gte('start_time', startOfDay.toISOString())
                .lte('start_time', endOfDay.toISOString())
                .order('start_time', { ascending: true });

            if (error) throw error;
            setAppointments(data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            toast.error("Erreur lors du chargement des rendez-vous");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMonthAppointments = async (date: Date) => {
        try {
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const { data, error } = await supabase
                .from('appointments')
                .select('start_time')
                .gte('start_time', start.toISOString())
                .lte('start_time', end.toISOString());

            if (error) throw error;
            setMonthAppointments(data || []);
        } catch (error) {
            console.error('Error fetching month appointments:', error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Voulez-vous vraiment supprimer le RDV de ${name} ?`)) return;

        try {
            // 1. Delete linked patient from queue if exists (manual cascade)
            await supabase.from('patients').delete().eq('appointment_id', id);

            // 2. Delete appointment
            const { error } = await supabase.from('appointments').delete().eq('id', id);
            
            if (error) throw error;
            
            toast.success("Rendez-vous supprimé");
            fetchDayAppointments(selectedDate);
            fetchMonthAppointments(currentDate);
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleEdit = (apt: Appointment) => {
        setEditingAppointment(apt);
        setIsModalOpen(true);
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const onDateClick = (day: Date) => {
        setSelectedDate(day);
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                        {format(currentDate, "MMMM yyyy", { locale: fr })}
                    </h2>
                    <div className="flex gap-1">
                        <button onClick={prevMonth} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={nextMonth} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingAppointment(undefined);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-[#A855F7] text-white px-4 py-2 font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all text-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nouveau RDV
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
        return (
            <div className="grid grid-cols-7 mb-4">
                {days.map((day) => (
                    <div key={day} className="text-center font-black uppercase text-gray-400 text-sm py-2">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        const allDays = eachDayOfInterval({
            start: startDate,
            end: endDate
        });

        return (
            <div className="grid grid-cols-7 gap-4">
                {allDays.map((dayItem, idx) => {
                    formattedDate = format(dayItem, "d");
                    const cloneDay = dayItem;
                    
                    // Count appointments for this day
                    const dayAppointmentsCount = monthAppointments.filter(app => 
                        isSameDay(parseISO(app.start_time), dayItem)
                    ).length;

                    const isSelected = isSameDay(dayItem, selectedDate);
                    const isTodayItem = isToday(dayItem);
                    const isCurrentMonth = isSameMonth(dayItem, monthStart);

                    return (
                        <div
                            key={idx}
                            className={`
                                relative min-h-[90px] p-2 border-2 border-black transition-all cursor-pointer group flex flex-col items-start justify-between
                                ${!isCurrentMonth ? "bg-gray-100/50 text-gray-400" : "bg-white"}
                                ${isSelected ? "!bg-[#2C2B57] text-white shadow-[4px_4px_0px_0px_#000]" : "hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1"}
                                ${isTodayItem && !isSelected ? "bg-[repeating-linear-gradient(45deg,#fef3c7,#fef3c7_10px,#fffbeb_10px,#fffbeb_20px)]" : ""}
                            `}
                            onClick={() => onDateClick(cloneDay)}
                        >
                            <span className={`text-base font-bold ${isSelected ? "text-white" : "text-black"}`}>
                                {formattedDate}
                            </span>
                            
                            {/* Purple Pill for appointments */}
                            {dayAppointmentsCount > 0 && (
                                <div className={`
                                    self-end mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border-2
                                    ${isSelected ? "bg-white text-[#2C2B57] border-white" : "bg-[#A855F7] text-white border-black"}
                                `}>
                                    {dayAppointmentsCount}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] overflow-hidden p-4">
            {/* Left: Calendar Grid */}
            <div className="flex-1 overflow-y-auto pr-2">
                {renderHeader()}
                {renderDays()}
                {renderCells()}
            </div>

            {/* Right: Sidebar Day Details */}
            <div className="w-full lg:w-96 border-l-2 border-black pl-8 flex flex-col h-full bg-white/50">
                <div className="mb-6 pb-4 border-b-2 border-black">
                    <h3 className="text-xl font-black uppercase text-gray-500 mb-1">Rendez-vous du</h3>
                    <h2 className="text-3xl font-black text-[#2C2B57] uppercase leading-none">
                        {format(selectedDate, "EEEE d MMMM", { locale: fr })}
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {isLoading ? (
                         <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Chargement...</div>
                    ) : appointments.length > 0 ? (
                        appointments.map((apt) => (
                            <div key={apt.id} className="group relative bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded border-2 border-black">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-black">
                                            {format(parseISO(apt.start_time), "HH:mm")}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEdit(apt)}
                                        className="p-1 hover:bg-gray-100 rounded border border-transparent hover:border-black transition-all"
                                        title="Modifier"
                                    >
                                        <Edit className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(apt.id, apt.patient_name)}
                                        className="p-1 hover:bg-red-50 rounded border border-transparent hover:border-red-500 transition-all"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="font-bold text-lg">{apt.patient_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="w-4 h-4" />
                                        <span>{apt.phone}</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t-2 border-gray-100 text-sm font-medium">
                                        <span className="text-gray-400 uppercase text-xs font-bold mr-2">Motif:</span>
                                        {apt.motif}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="border-2 border-black border-dashed p-8 text-center bg-gray-50">
                            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-bold uppercase">Aucun rendez-vous</p>
                            <p className="text-sm text-gray-400 mt-1">Cliquez sur "Nouveau RDV" pour planifier.</p>
                        </div>
                    )}
                </div>
            </div>

            <AddAppointmentModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                appointment={editingAppointment}
                initialDate={selectedDate}
                onSuccess={() => {
                    fetchDayAppointments(selectedDate);
                    fetchMonthAppointments(currentDate);
                }}
            />
        </div>
    );
}
