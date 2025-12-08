"use client";

import { useState, useEffect } from "react";
import { X, User, Phone, Clock, HelpCircle, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MOTIFS, MotifValue } from "@/lib/motifs";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { isToday } from "date-fns";
import { updatePatientStatus } from "@/lib/patients"; // Re-use this if convenient, or implement direct insert

interface AddAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    appointment?: any;
    initialDate?: Date;
}

export function AddAppointmentModal({ isOpen, onClose, onSuccess, appointment, initialDate }: AddAppointmentModalProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [selectedMotif, setSelectedMotif] = useState<MotifValue>("consultation");
    const [isPriority, setIsPriority] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [consultationDuration, setConsultationDuration] = useState(30); // Default 30min
    const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
    const [hasConflict, setHasConflict] = useState(false);

    const supabase = createClient(); // Move to top to avoid re-initialization

    // Auto-set priority when "Urgence" is selected
    useEffect(() => {
        if (selectedMotif === 'urgence') {
            setIsPriority(true);
        } else {
            setIsPriority(false);
        }
    }, [selectedMotif]);

    // Pre-fill if editing
    useEffect(() => {
        if (isOpen) {
            if (appointment) {
                setName(appointment.patient_name || "");
                setPhone(appointment.phone || "");
                if (appointment.start_time) {
                    const d = new Date(appointment.start_time);
                    setDate(d.toISOString().split('T')[0]);
                    setTime(d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
                }
                setSelectedMotif(appointment.motif as MotifValue || "consultation");
                // Note: appointments table doesn't have is_priority column usually, 
                // but the queue item does. For now, on edit, we default to false or rely on motif.
                setIsPriority(appointment.motif === 'urgence');
            } else {
                // Reset for new
                setName("");
                setPhone("");
                if (initialDate) {
                     setDate(initialDate.toISOString().split('T')[0]);
                } else {
                     setDate(new Date().toISOString().split('T')[0]);
                }
                setTime("");
                setSelectedMotif("consultation");
            }
        }
    }, [isOpen, appointment, initialDate]);

    // Fetch doctor's consultation duration
    useEffect(() => {
        const fetchConsultationDuration = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('consultation_duration')
                    .eq('id', user.id)
                    .single();
                if (data?.consultation_duration) {
                    setConsultationDuration(data.consultation_duration);
                }
            }
        };
        if (isOpen) {
            fetchConsultationDuration();
        }
    }, [isOpen]);

    // Fetch existing appointments for the selected date
    useEffect(() => {
        const fetchExistingAppointments = async () => {
            if (!date) return;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const { data } = await supabase
                .from('appointments')
                .select('id, start_time')
                .eq('doctor_id', user.id)
                .gte('start_time', startOfDay.toISOString())
                .lte('start_time', endOfDay.toISOString());

            if (data) {
                // Exclude current appointment if editing
                const filtered = appointment 
                    ? data.filter(apt => apt.id !== appointment.id)
                    : data;
                setExistingAppointments(filtered);
            }
        };

        fetchExistingAppointments();
    }, [date, isOpen, appointment]);

    // Check for time conflicts
    useEffect(() => {
        if (!time || !date || existingAppointments.length === 0) {
            setHasConflict(false);
            return;
        }

        const [hours, minutes] = time.split(':').map(Number);
        const newStartTime = new Date(date);
        newStartTime.setHours(hours, minutes, 0, 0);
        
        const newEndTime = new Date(newStartTime.getTime() + consultationDuration * 60000);

        // Check if new appointment overlaps with any existing appointment
        const conflict = existingAppointments.some(apt => {
            const existingStart = new Date(apt.start_time);
            const existingEnd = new Date(existingStart.getTime() + consultationDuration * 60000);

            // Check for overlap: new appointment starts or ends during existing appointment
            const startsWithin = newStartTime >= existingStart && newStartTime < existingEnd;
            const endsWithin = newEndTime > existingStart && newEndTime <= existingEnd;
            const encompasses = newStartTime <= existingStart && newEndTime >= existingEnd;

            return startsWithin || endsWithin || encompasses;
        });

        setHasConflict(conflict);
    }, [time, date, existingAppointments, consultationDuration]);

    // Generate available time slots (8am to 8pm, 30min intervals)
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour <= 19; hour++) {
            for (let minute of [0, 30]) {
                if (hour === 19 && minute === 30) break; // Stop at 19:30
                const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                slots.push(timeString);
            }
        }
        return slots;
    };

    // Check if a time slot is blocked by existing appointments
    const isSlotBlocked = (slotTime: string) => {
        if (!date || existingAppointments.length === 0) return false;

        const [hours, minutes] = slotTime.split(':').map(Number);
        const slotStart = new Date(date);
        slotStart.setHours(hours, minutes, 0, 0);
        
        const slotEnd = new Date(slotStart.getTime() + consultationDuration * 60000);

        return existingAppointments.some(apt => {
            const existingStart = new Date(apt.start_time);
            const existingEnd = new Date(existingStart.getTime() + consultationDuration * 60000);

            const startsWithin = slotStart >= existingStart && slotStart < existingEnd;
            const endsWithin = slotEnd > existingStart && slotEnd <= existingEnd;
            const encompasses = slotStart <= existingStart && slotEnd >= existingEnd;

            return startsWithin || endsWithin || encompasses;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Le nom est obligatoire");
            return;
        }

        if (name.length > 30) {
            toast.error("Le nom ne doit pas dépasser 30 caractères");
            return;
        }

        if (!phone.trim()) {
            toast.error("Le téléphone est obligatoire");
            return;
        }

        if (phone.length > 8) {
            toast.error("Le téléphone ne doit pas dépasser 8 chiffres");
            return;
        }

        if (!date || !time) {
            toast.error("La date et l'heure sont obligatoires");
            return;
        }

        if (hasConflict) {
            toast.error("Ce créneau horaire est déjà occupé");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Utilisateur non connecté");
                setIsSubmitting(false);
                return;
            }

            const startDateTime = new Date(`${date}T${time}`);
            const isoStartTime = startDateTime.toISOString();

            const payload = {
                doctor_id: user.id,
                patient_name: name.trim(),
                phone: phone.trim(),
                motif: selectedMotif,
                start_time: isoStartTime,
                status: appointment ? appointment.status : 'confirmed'
            };

            let data, error;

            // 1. APPOINTMENT: Update or Insert
            if (appointment) {
                // UPDATE Appointment
                const res = await supabase
                    .from('appointments')
                    .update(payload)
                    .eq('id', appointment.id)
                    .select()
                    .single();
                data = res.data;
                error = res.error;

                // UPDATE Patient (Queue) if exists
                // We try to update any patient linked to this appointment
                if (!error) {
                    await supabase
                        .from('patients')
                        .update({
                            name: name.trim(),
                            phone: phone.trim(),
                            motif: selectedMotif,
                            rdv_time: isoStartTime
                        })
                        .eq('appointment_id', appointment.id);
                }

            } else {
                // INSERT Appointment
                const res = await supabase
                    .from('appointments')
                    .insert([payload])
                    .select()
                    .single();
                data = res.data;
                error = res.error;
            }

            if (error) throw error;

            // 2. QUEUE SYNC: Only Insert if NEW and TODAY
            if (!appointment && isToday(startDateTime)) {
                
                const { data: settings } = await supabase
                    .from('queue_settings')
                    .select('last_ticket_number')
                    .eq('user_id', user.id)
                    .single();
                
                const nextTicket = (settings?.last_ticket_number || 0) + 1;

                await supabase
                    .from('queue_settings')
                    .update({ last_ticket_number: nextTicket })
                    .eq('user_id', user.id);

                const ticketNumber = `${nextTicket.toString().padStart(3, '0')}`;

                await supabase
                    .from('patients')
                    .insert([
                        {
                            user_id: user.id,
                            name: name.trim(),
                            phone: phone.trim(),
                            ticket_number: ticketNumber,
                            status: 'scheduled', 
                            type: 'rdv',
                            appointment_id: data.id, 
                            rdv_time: isoStartTime,
                            motif: selectedMotif,
                            is_priority: isPriority
                        }
                    ]);
                
                toast.success("RDV créé et ajouté à la file d'aujourd'hui!");
            } else {
                 if (appointment) toast.success("Rendez-vous modifié avec succès!");
                 else toast.success("Rendez-vous planifié avec succès!");
            }

            onSuccess();
            onClose();
            
            // Reset only if not editing (or just always reset on close, manageable)
            if (!appointment) {
                setName("");
                setPhone("");
                setDate("");
                setTime("");
                setSelectedMotif("consultation");
            }
            
        } catch (error) {
            console.error("Error saving appointment:", error);
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden"
                >
                    <div className="bg-gray-50 border-b-4 border-black p-2.5 flex items-center justify-between">
                        <h2 className="font-display font-black text-base uppercase tracking-wide">
                            {appointment ? "Modifier RDV" : "Planifier RDV"}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-black"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-3 space-y-2.5">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <User className="h-4 w-4" /> Nom du Patient *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full bg-white border-2 border-black h-10 px-3 font-bold focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20"
                                placeholder="Nom complet"
                                maxLength={30}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Téléphone *
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="w-full bg-white border-2 border-black h-10 px-3 font-bold focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20"
                                placeholder="Numéro de téléphone"
                                maxLength={8}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Date *
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-full bg-white border-2 border-black h-10 px-2 font-bold focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20"
                                />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Heure *
                                </label>
                                {/* Time Slot Grid */}
                                <div className="border-2 border-black p-2 bg-gray-50 max-h-[150px] overflow-y-auto">
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {generateTimeSlots().map((slot) => {
                                            const blocked = isSlotBlocked(slot);
                                            const selected = time === slot;
                                            
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => !blocked && setTime(slot)}
                                                    disabled={blocked}
                                                    className={`
                                                        px-2 py-1.5 text-xs font-bold border-2 border-black transition-all
                                                        ${blocked 
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
                                                            : selected
                                                                ? 'bg-[#2C2B57] text-white'
                                                                : 'bg-white hover:bg-gray-100'
                                                        }
                                                    `}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Time Allocation Display */}
                        {time && (
                            <div className="bg-yellow-50 border-2 border-yellow-400 p-3 rounded">
                                <p className="text-xs font-bold text-yellow-800 uppercase mb-2">⏱️ Temps Alloué</p>
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#2C2B57] text-white px-3 py-1.5 border-2 border-black text-sm font-bold">
                                        {time} - {(() => {
                                            if (!time) return "--:--";
                                            const [hours, minutes] = time.split(':').map(Number);
                                            const totalMinutes = hours * 60 + minutes + consultationDuration;
                                            const endHours = Math.floor(totalMinutes / 60) % 24;
                                            const endMinutes = totalMinutes % 60;
                                            return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
                                        })()}
                                    </div>
                                    <div className="bg-yellow-300 text-black px-2 py-1 border-2 border-black text-xs font-bold">
                                        {consultationDuration}min
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Conflict Warning */}
                        {hasConflict && time && (
                            <div className="bg-red-50 border-2 border-red-500 p-3 rounded">
                                <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                                    <span className="text-lg">⚠️</span>
                                    Conflit détecté ! Ce créneau horaire est déjà occupé par un autre rendez-vous.
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" /> Motif
                            </label>
                            <select
                                value={selectedMotif}
                                onChange={(e) => setSelectedMotif(e.target.value as MotifValue)}
                                className="w-full bg-white border-2 border-black h-12 px-4 font-bold focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20"
                            >
                                {MOTIFS.map((motif) => (
                                    <option key={motif.value} value={motif.value}>
                                        {motif.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#A855F7] text-white h-14 font-black text-lg uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 mt-4"
                        >
                            {isSubmitting ? "Enregistrement..." : (appointment ? "Modifier" : "Confirmer le RDV")}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
