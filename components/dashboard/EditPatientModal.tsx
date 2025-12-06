"use client";

import { useState, useEffect } from "react";
import { X, User, Phone, Calendar, Clock, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MOTIFS, MotifValue } from "@/lib/motifs";
import { toast } from "sonner";
import { Patient } from "@/lib/patients";

interface EditPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient | null;
    onPatientUpdated: () => void;
}

export function EditPatientModal({ isOpen, onClose, patient, onPatientUpdated }: EditPatientModalProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [type, setType] = useState<"walk-in" | "rdv">("walk-in");
    const [rdvTime, setRdvTime] = useState("");
    const [selectedMotif, setSelectedMotif] = useState<MotifValue>("consultation");
    const [isPriority, setIsPriority] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (patient) {
            setName(patient.name);
            setPhone(patient.phone || "");
            setType(patient.type);
            if (patient.rdv_time) {
                const date = new Date(patient.rdv_time);
                setRdvTime(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
            } else {
                setRdvTime("");
            }
            setSelectedMotif((patient.motif as MotifValue) || "consultation");
            setIsPriority(patient.is_priority || false);
        }
    }, [patient]);

    // Auto-set priority when "Urgence" is selected
    useEffect(() => {
        if (selectedMotif === 'urgence') {
            setIsPriority(true);
        }
    }, [selectedMotif]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!patient) return;

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

        if (type === "rdv" && !rdvTime) {
            toast.error("L'heure du rendez-vous est obligatoire");
            return;
        }

        setIsSubmitting(true);

        try {
            // Format RDV time if present
            let formattedRdvTime = undefined;
            if (type === "rdv" && rdvTime) {
                const today = new Date();
                const [hours, minutes] = rdvTime.split(':');
                today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                formattedRdvTime = today.toISOString();
            }

            const { updatePatient } = await import("@/lib/patients");
            await updatePatient(patient.id, {
                name: name.trim(),
                phone: phone.trim(),
                type,
                rdv_time: formattedRdvTime,
                motif: selectedMotif,
                is_priority: isPriority
            });

            onPatientUpdated();
            onClose();
            toast.success("Patient modifié avec succès!");
        } catch (error) {
            console.error("Error updating patient:", error);
            toast.error("Erreur lors de la modification du patient");
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
                            Modifier Patient
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-black"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <User className="h-4 w-4" /> Nom & Prénom *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={30}
                                required
                                className="w-full bg-white border-2 border-black h-12 px-4 text-black focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20 transition-all font-bold"
                                placeholder="Ex: Ahmed Ben Ali"
                            />
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Téléphone *
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                maxLength={8}
                                required
                                className="w-full bg-white border-2 border-black h-12 px-4 text-black focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20 transition-all font-bold"
                                placeholder="Ex: 55 123 456"
                            />
                        </div>

                        {/* Motif Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" /> Motif de visite
                            </label>
                            <select
                                value={selectedMotif}
                                onChange={(e) => setSelectedMotif(e.target.value as MotifValue)}
                                className="w-full bg-white border-2 border-black h-12 px-4 text-black focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20 transition-all font-bold appearance-none"
                            >
                                {MOTIFS.map((motif) => (
                                    <option key={motif.value} value={motif.value}>
                                        {motif.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Type Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setType("walk-in")}
                                className={`h-12 border-2 border-black font-black uppercase tracking-wide transition-all ${type === "walk-in"
                                        ? "bg-[#2C2B57] text-white shadow-[4px_4px_0px_0px_#000]"
                                        : "bg-white text-gray-500 hover:bg-gray-50"
                                    }`}
                            >
                                Sans RDV
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("rdv")}
                                className={`h-12 border-2 border-black font-black uppercase tracking-wide transition-all ${type === "rdv"
                                        ? "bg-[#2C2B57] text-white shadow-[4px_4px_0px_0px_#000]"
                                        : "bg-white text-gray-500 hover:bg-gray-50"
                                    }`}
                            >
                                Rendez-vous
                            </button>
                        </div>

                        {/* RDV Time Input */}
                        {type === "rdv" && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="space-y-2"
                            >
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Heure du RDV *
                                </label>
                                <input
                                    type="time"
                                    value={rdvTime}
                                    onChange={(e) => setRdvTime(e.target.value)}
                                    className="w-full bg-white border-2 border-black h-12 px-4 text-black focus:outline-none focus:ring-4 focus:ring-[#2C2B57]/20 transition-all font-bold"
                                />
                            </motion.div>
                        )}

                        {/* Priority Toggle (Disabled if Urgence is selected) */}
                        <div className="flex items-center gap-3 p-4 border-2 border-black bg-yellow-50">
                            <input
                                type="checkbox"
                                id="priority"
                                checked={isPriority}
                                onChange={(e) => setIsPriority(e.target.checked)}
                                disabled={selectedMotif === 'urgence'}
                                className="w-5 h-5 border-2 border-black rounded text-[#2C2B57] focus:ring-offset-0 focus:ring-0"
                            />
                            <label htmlFor="priority" className="font-bold text-sm uppercase tracking-wide cursor-pointer select-none">
                                Marquer comme prioritaire
                                {selectedMotif === 'urgence' && <span className="block text-[10px] text-red-600 normal-case">(Automatique pour Urgence)</span>}
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#10B981] text-white h-14 font-black text-lg uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Modifier..." : "Enregistrer"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
