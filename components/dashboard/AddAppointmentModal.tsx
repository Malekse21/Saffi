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

    const supabase = createClient();

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
                    className="bg-white w-full max-w-md border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden"
                >
                    <div className="bg-gray-50 border-b-4 border-black p-4 flex items-center justify-between">
                        <h2 className="font-display font-black text-xl uppercase tracking-wide">
                            {appointment ? "Modifier RDV" : "Planifier RDV"}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-black"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <User className="h-4 w-4" /> Nom du Patient *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full bg-white border-2 border-black h-12 px-4 font-bold focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20"
                                placeholder="Nom complet"
                                maxLength={30}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Téléphone *
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="w-full bg-white border-2 border-black h-12 px-4 font-bold focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20"
                                placeholder="Numéro de téléphone"
                                maxLength={8}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Date *
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-full bg-white border-2 border-black h-12 px-2 font-bold focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Heure *
                                </label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    required
                                    className="w-full bg-white border-2 border-black h-12 px-2 font-bold focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20"
                                />
                            </div>
                        </div>

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
