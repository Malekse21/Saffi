"use client";

import { useState } from "react";
import { X, User, Phone } from "lucide-react";
import { toast } from "sonner";

interface AddPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPatientAdded: () => void;
}

export function AddPatientModal({ isOpen, onClose, onPatientAdded }: AddPatientModalProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [type, setType] = useState<"walk-in" | "rdv">("walk-in");
    const [rdvTime, setRdvTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Veuillez entrer un nom");
            return;
        }

        if (name.length > 30) {
            toast.error("Le nom ne doit pas dépasser 30 caractères");
            return;
        }

        if (!phone.trim()) {
            toast.error("Veuillez entrer un numéro de téléphone");
            return;
        }

        if (phone.length !== 8) {
            toast.error("Le numéro de téléphone doit contenir exactement 8 chiffres");
            return;
        }

        setIsSubmitting(true);

        try {
            console.log("Starting patient addition...");
            console.log("Name:", name.trim());
            console.log("Phone:", phone.trim());
            console.log("Type:", type);
            console.log("RDV Time raw:", rdvTime);

            const { addPatient } = await import("@/lib/patients");
            console.log("addPatient function imported");

            // Convert time to proper ISO format if it's a rendez-vous
            let formattedRdvTime: string | undefined = undefined;
            if (type === "rdv" && rdvTime) {
                // Create a date with today's date and the selected time
                const today = new Date();
                const [hours, minutes] = rdvTime.split(':');
                today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                formattedRdvTime = today.toISOString();
                console.log("Formatted RDV Time:", formattedRdvTime);
            }

            const result = await addPatient(name.trim(), phone.trim(), type, formattedRdvTime);
            console.log("Patient added successfully:", result);

            toast.success("Patient ajouté avec succès!");
            setName("");
            setPhone("");
            setType("walk-in");
            setRdvTime("");
            onPatientAdded();
            onClose();
        } catch (error: any) {
            console.error("Full error object:", error);
            console.error("Error message:", error?.message);
            console.error("Error stack:", error?.stack);
            console.error("Error string:", String(error));

            // More comprehensive error message
            let errorMessage = "Erreur lors de l'ajout du patient";

            if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.toString && error.toString() !== '[object Object]') {
                errorMessage = error.toString();
            }

            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-md border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#000]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 hover:bg-gray-100 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <h2 className="text-2xl font-black uppercase mb-6">Ajouter un Patient</h2>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-bold mb-2 uppercase">
                            <User className="inline h-4 w-4 mr-2" />
                            Nom Complet *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={30}
                            className="w-full border-2 border-black px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Mohammed Ben Ali"
                            required
                        />
                    </div>

                    {/* Phone Input */}
                    <div>
                        <label className="block text-sm font-bold mb-2 uppercase">
                            <Phone className="inline h-4 w-4 mr-2" />
                            Téléphone *
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            maxLength={8}
                            className="w-full border-2 border-black px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="12345678"
                            required
                        />
                    </div>

                    {/* Type Selection */}
                    <div>
                        <label className="block text-sm font-bold mb-2 uppercase">
                            Type de Visite
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType("walk-in")}
                                className={`border-2 border-black px-4 py-3 font-bold transition-all ${type === "walk-in"
                                        ? "bg-black text-white shadow-[4px_4px_0px_0px_#000]"
                                        : "bg-white text-black hover:bg-gray-50"
                                    }`}
                            >
                                Sans RDV
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("rdv")}
                                className={`border-2 border-black px-4 py-3 font-bold transition-all ${type === "rdv"
                                        ? "bg-black text-white shadow-[4px_4px_0px_0px_#000]"
                                        : "bg-white text-black hover:bg-gray-50"
                                    }`}
                            >
                                Rendez-vous
                            </button>
                        </div>
                    </div>

                    {/* RDV Time (conditional) */}
                    {type === "rdv" && (
                        <div>
                            <label className="block text-sm font-bold mb-2 uppercase">
                                Heure du RDV
                            </label>
                            <input
                                type="time"
                                value={rdvTime}
                                onChange={(e) => setRdvTime(e.target.value)}
                                className="w-full border-2 border-black px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border-2 border-black px-6 py-3 font-bold hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 border-2 border-black bg-black px-6 py-3 font-bold text-white shadow-[4px_4px_0px_0px_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Ajout..." : "Ajouter"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
