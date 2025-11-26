"use client";

import { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import {
    Megaphone,
    UserPlus,
    Clock,
    Trash,
    GripVertical,
    Calendar,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "../layout";
import {
    Patient,
    getPatients,
    getActivePatient,
    addPatient,
    updatePatientStatus,
    deletePatient,
    subscribeToPatients
} from "@/lib/patients";

export default function ConnectPlanPage() {
    const { clinicName } = useDashboard();
    const [queue, setQueue] = useState<Patient[]>([]);
    const [activePatient, setActivePatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPatientName, setNewPatientName] = useState("");
    const [newPatientPhone, setNewPatientPhone] = useState("");

    // Load patients from Supabase on mount
    useEffect(() => {
        loadPatients();
    }, []);

    // Subscribe to real-time updates
    useEffect(() => {
        const unsubscribe = subscribeToPatients(() => {
            loadPatients();
        });

        return () => unsubscribe();
    }, []);

    // Sync to localStorage for TV
    useEffect(() => {
        localStorage.setItem('saffi_queue_state', JSON.stringify({
            activePatient,
            queue,
            clinicName
        }));
    }, [activePatient, queue, clinicName]);

    const loadPatients = async () => {
        try {
            const [patients, active] = await Promise.all([
                getPatients(),
                getActivePatient()
            ]);

            // Filter out active patient from queue
            const waitingPatients = patients.filter(p => p.status !== 'active' && p.status !== 'completed');
            setQueue(waitingPatients);
            setActivePatient(active);
        } catch (error) {
            console.error('Error loading patients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCallNext = async () => {
        const nextPatientIndex = queue.findIndex(p => p.status !== "away");

        if (nextPatientIndex === -1) {
            if (queue.length > 0) {
                alert("Tous les patients sont absents !");
                return;
            } else {
                // Mark current active as completed
                if (activePatient) {
                    await updatePatientStatus(activePatient.id, 'completed');
                }
                setActivePatient(null);
                return;
            }
        }

        const nextPatient = queue[nextPatientIndex];

        try {
            // Mark current active as completed
            if (activePatient) {
                await updatePatientStatus(activePatient.id, 'completed');
            }

            // Mark next patient as active
            await updatePatientStatus(nextPatient.id, 'active');
            await loadPatients();
        } catch (error) {
            console.error('Error calling next patient:', error);
            alert('Erreur lors de l\'appel du patient');
        }
    };

    const handleMarkAway = async (id: string) => {
        const patient = queue.find(p => p.id === id);
        if (!patient) return;

        const newStatus = patient.status === "away" ? "waiting" : "away";

        try {
            await updatePatientStatus(id, newStatus);
            await loadPatients();
        } catch (error) {
            console.error('Error updating patient status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Supprimer ce patient ?")) {
            try {
                await deletePatient(id);
                await loadPatients();
            } catch (error) {
                console.error('Error deleting patient:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };

    const handleReorder = (newOrder: Patient[]) => {
        setQueue(newOrder);
        // Note: You could add a function to update order in database if needed
    };

    const handleAddPatient = async () => {
        const name = newPatientName.trim();
        const phone = newPatientPhone.trim();

        if (!name) {
            alert("Veuillez entrer un nom");
            return;
        }

        if (name.length > 30) {
            alert("Le nom ne doit pas dépasser 30 caractères");
            return;
        }

        if (!phone) {
            alert("Veuillez entrer un numéro de téléphone");
            return;
        }

        if (phone.length !== 8) {
            alert("Le numéro de téléphone doit contenir exactement 8 caractères");
            return;
        }

        try {
            await addPatient(name, phone);
            setNewPatientName("");
            setNewPatientPhone("");
            setIsModalOpen(false);
            await loadPatients();
        } catch (error) {
            console.error('Error adding patient:', error);
            alert('Erreur lors de l\'ajout du patient');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active Patient */}
                    <div className="bg-[var(--color-primary)] text-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_#000] flex flex-col justify-center items-center relative overflow-hidden">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold uppercase tracking-widest">Live</span>
                        </div>
                        {activePatient ? (
                            <>
                                <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">En Consultation</div>
                                <div className="text-8xl font-display font-black mb-4">#{activePatient.ticket_number}</div>
                                <div className="text-2xl font-bold mb-6">{activePatient.name}</div>
                                <button
                                    onClick={handleCallNext}
                                    className="bg-white text-[var(--color-primary)] px-8 py-4 font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center gap-3 transition-all"
                                >
                                    <Megaphone className="h-6 w-6" /> Appeler Suivant
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="text-center opacity-70">
                                    <Users className="h-24 w-24 mx-auto mb-4" />
                                    <div className="text-xl font-bold">Aucun patient actif</div>
                                    <p className="text-sm mt-2">Cliquez sur "Appeler Suivant" pour commencer</p>
                                </div>
                                <button
                                    onClick={handleCallNext}
                                    disabled={queue.length === 0}
                                    className="mt-6 bg-white text-[var(--color-primary)] px-8 py-4 font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Megaphone className="h-6 w-6" /> Appeler Suivant
                                </button>
                            </>
                        )}
                    </div>

                    {/* Queue Stats */}
                    <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-display font-black text-2xl uppercase tracking-tight">Statistiques</h2>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[var(--color-primary)] text-white px-4 py-2 font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center gap-2 transition-all text-xs"
                            >
                                <UserPlus className="h-5 w-5" /> Ajouter Patient
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 border-2 border-black p-4">
                                <div className="text-4xl font-display font-black text-[var(--color-primary)]">{queue.filter(p => p.status === "waiting").length}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-1">En Attente</div>
                            </div>
                            <div className="bg-gray-50 border-2 border-black p-4">
                                <div className="text-4xl font-display font-black text-orange-500">{queue.filter(p => p.status === "away").length}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-1">Absents</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Queue List with Drag & Drop */}
                <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000]">
                    <div className="border-b-2 border-black p-6">
                        <h2 className="font-display font-black text-2xl uppercase tracking-tight">File d'Attente</h2>
                        <p className="text-xs text-gray-500 mt-1">Glissez pour réorganiser</p>
                    </div>
                    <div className="p-6">
                        {queue.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="font-bold text-xl text-gray-400 mb-2">Aucun patient en file</h3>
                                <p className="text-gray-500 mb-6">Commencez par ajouter votre premier patient</p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-[var(--color-primary)] text-white px-6 py-3 font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none inline-flex items-center gap-3 transition-all"
                                >
                                    <UserPlus className="h-6 w-6" /> Ajouter Patient
                                </button>
                            </div>
                        ) : (
                            <Reorder.Group axis="y" values={queue} onReorder={handleReorder} className="space-y-3">
                                {queue.map((patient) => (
                                    <Reorder.Item
                                        key={patient.id}
                                        value={patient}
                                        className={cn(
                                            "flex items-center justify-between p-4 border-2 border-black cursor-grab active:cursor-grabbing transition-all",
                                            patient.status === "away" ? "bg-orange-100 opacity-60" : "bg-gray-50 hover:bg-gray-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <GripVertical className="h-5 w-5 text-gray-400" />
                                            <div className="text-3xl font-display font-black text-[var(--color-primary)]">#{patient.ticket_number}</div>
                                            <div>
                                                <div className="font-bold text-lg">{patient.name}</div>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(patient.arrival_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {patient.type === "rdv" && (
                                                        <span className="flex items-center gap-1 text-blue-600">
                                                            <Calendar className="h-3 w-3" />
                                                            RDV
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleMarkAway(patient.id)}
                                                className={cn(
                                                    "px-4 py-2 font-bold text-xs uppercase tracking-wider border-2 border-black transition-all",
                                                    patient.status === "away"
                                                        ? "bg-green-400 hover:bg-green-500"
                                                        : "bg-orange-400 hover:bg-orange-500"
                                                )}
                                            >
                                                {patient.status === "away" ? "Présent" : "Absent"}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(patient.id)}
                                                className="bg-red-500 text-white p-2 border-2 border-black hover:bg-red-600 transition-all"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Patient Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] max-w-md w-full p-6">
                        <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-6">Nouveau Patient</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Nom *</label>
                                <input
                                    type="text"
                                    value={newPatientName}
                                    onChange={(e) => setNewPatientName(e.target.value)}
                                    className="w-full p-3 border-2 border-black focus:outline-none focus:bg-[#2C2B57]/5"
                                    placeholder="Mohamed Ali"
                                    maxLength={30}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Téléphone *</label>
                                <input
                                    type="tel"
                                    value={newPatientPhone}
                                    onChange={(e) => setNewPatientPhone(e.target.value)}
                                    className="w-full p-3 border-2 border-black focus:outline-none focus:bg-[#2C2B57]/5"
                                    placeholder="55123456"
                                    maxLength={8}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 bg-gray-200 text-black px-6 py-3 font-bold uppercase tracking-wider border-2 border-black hover:bg-gray-300 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAddPatient}
                                className="flex-1 bg-[var(--color-primary)] text-white px-6 py-3 font-bold uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
