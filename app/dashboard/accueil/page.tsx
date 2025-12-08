"use client";

import { useState, useEffect } from "react";
import { PatientCard } from "@/components/PatientCard";
import { Patient, updatePatient } from "@/lib/patients";
import { AddPatientModal } from "@/components/dashboard/AddPatientModal";
import { EditPatientModal } from "@/components/dashboard/EditPatientModal";
import { Tv, Plus } from "lucide-react";
import { toast } from "sonner";
import { getPatients, subscribeToPatients, updatePatientStatus, deletePatient } from "@/lib/patients";
import { ExcelImporter } from "@/components/ExcelImporter";
import { ConfirmationModal } from "@/components/dashboard/ConfirmationModal";
import { RecallModal } from "@/components/RecallModal";
import { createClient } from "@/utils/supabase/client";
import { useSound } from "@/hooks/useSound";

type DBPatient = {
    id: string;
    user_id: string;
    ticket_number: string;
    name: string;
    status: 'waiting' | 'active' | 'completed' | 'away' | 'scheduled';
    type: 'walk-in' | 'rdv';
    arrival_time: string;
    rdv_time?: string;
    phone?: string;
    created_at: string;
    updated_at: string;
    motif?: string;
    is_priority?: boolean;
    recall_sent?: boolean;
};

export default function AccueilPage() {
    const { playSound } = useSound();
    const [patients, setPatients] = useState<DBPatient[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Recall Logic State
    // Recall Logic State
    const [recallCandidate, setRecallCandidate] = useState<Patient | null>(null);
    const [doctorName, setDoctorName] = useState<string>("");

    // Confirmation Modal State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        action: () => void;
        isDestructive?: boolean;
    }>({
        isOpen: false,
        title: "",
        message: "",
        action: () => { },
        isDestructive: false
    });

    // Fetch patients on mount
    useEffect(() => {
        loadPatients();
        fetchDoctorName();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToPatients(
            () => {
                loadPatients();
            },
            (status) => {
                if (status === 'SUBSCRIBED') {
                    toast.success("Connexion temps réel établie");
                } else if (status === 'CHANNEL_ERROR') {
                    toast.error("Erreur de connexion temps réel");
                }
            }
        );

        return () => unsubscribe();
    }, []);

    const loadPatients = async () => {
        try {
            const data = await getPatients() as DBPatient[];
            setPatients(data);
            checkQueueForRecall(data);
        } catch (error) {
            console.error("Error loading patients:", error);
            toast.error("Erreur lors du chargement des patients");
        } finally {
            setIsLoading(false);
        }
    };

    // Map database status to component status
    const mapStatus = (dbStatus: string): 'waiting' | 'active' | 'away' | 'completed' | 'scheduled' => {
        switch (dbStatus) {
            case 'active': return 'active';
            case 'waiting': return 'waiting';
            case 'away': return 'away';
            case 'completed': return 'completed';
            case 'scheduled': return 'scheduled';
            default: return 'waiting';
        }
    };

    // Transform patient data to match component interface
    const transformPatient = (p: DBPatient, position: number = 1): Patient => ({
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        phone: p.phone,
        status: mapStatus(p.status),
        type: p.type,
        arrival_time: p.arrival_time,
        rdv_time: p.rdv_time,
        appointmentTime: p.rdv_time ? new Date(p.rdv_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
        is_priority: p.is_priority,
        position: position,
        ticket_number: p.ticket_number,
        motif: p.motif,
        created_at: p.created_at,
        updated_at: p.updated_at,
        recall_sent: p.recall_sent
    });

    const activePatient = patients.find(p => p.status === 'active');
    const queuePatients = patients
        .filter(p => p.status === 'waiting' || p.status === 'away' || p.status === 'scheduled')
        .sort((a, b) => {
            // Priority first
            if (a.is_priority !== b.is_priority) return (a.is_priority ? -1 : 1);
            
            // Then by time (Effective Time: RDV Time for appointments, Arrival/Creation for walk-ins)
            const timeA = new Date(a.rdv_time || a.created_at).getTime();
            const timeB = new Date(b.rdv_time || b.created_at).getTime();
            
            return timeA - timeB;
        });

    const completedCount = patients.filter(p => p.status === 'completed').length;

    const transformedQueuePatients = queuePatients.map((p, index) => transformPatient(p, index + 1));

    const handleCallNext = async () => {
        try {
            // If there is an active patient, mark them as completed
            if (activePatient) {
                await updatePatientStatus(activePatient.id, 'completed');
                playSound('success'); // Sound for completing patient
            }

            // Get next waiting patient (skip 'away' patients)
            const nextPatient = queuePatients.find(p => p.status === 'waiting');

            if (nextPatient) {
                await updatePatientStatus(nextPatient.id, 'active');
                playSound('callPatient'); // Special sound for calling patient
                toast.success(`Patient ${nextPatient.name} appelé!`);
            } else {
                // Check if there are any patients at all (including away)
                if (queuePatients.length > 0) {
                    toast.info("Tous les patients en attente sont absents");
                } else {
                    toast.info("Aucun patient en attente");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'appel du patient");
        }
    };

    const handleTVClick = () => {
        window.open('/tv', '_blank');
        toast.success("Mode TV ouvert dans une nouvelle fenêtre");
    };

    const handleAddPatient = () => {
        playSound('click');
        setIsModalOpen(true);
    };

    const handleEditPatient = (patient: Patient) => {
        setEditingPatient(patient);
        setIsEditModalOpen(true);
    };

    const handleMarkUrgency = (patient: Patient) => {
        setConfirmation({
            isOpen: true,
            title: "Marquer comme Urgent",
            message: `Voulez-vous marquer ${patient.name} comme urgent ? Cela le placera en tête de file.`,
            action: async () => {
                try {
                    await updatePatient(patient.id, { is_priority: true, motif: 'urgence' });

                    const waitingPatients = patients.filter(p => p.status === 'waiting' && p.id !== patient.id);
                    const newOrder = [patient.id, ...waitingPatients.map(p => p.id)];

                    const { reorderPatients } = await import("@/lib/patients");
                    await reorderPatients(newOrder);

                    toast.success("Patient marqué comme urgent et déplacé en tête de file");
                    loadPatients();
                } catch (error) {
                    console.error(error);
                    toast.error("Erreur lors de la mise à jour");
                }
            },
            isDestructive: false
        });
    };

    const handleDeletePatient = (patient: Patient) => {
        setConfirmation({
            isOpen: true,
            title: "Supprimer le Patient",
            message: `Voulez-vous vraiment supprimer ${patient.name} ? Cette action est irréversible.`,
            action: async () => {
                try {
                    await deletePatient(patient.id);
                    toast.success("Patient supprimé");
                    loadPatients();
                } catch (error) {
                    console.error(error);
                    toast.error("Erreur lors de la suppression");
                }
            },
            isDestructive: true
        });
    };

    const handleStatusChange = async (patient: Patient, newStatus: 'waiting' | 'away') => {
        try {
            await updatePatientStatus(patient.id, newStatus);
            toast.success(`Statut mis à jour: ${newStatus === 'away' ? 'Absent' : 'En attente'}`);
            loadPatients();
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour du statut");
        }
    };

    const checkQueueForRecall = (currentPatients: DBPatient[]) => {
        // Filter waiting or away patients
        const queue = currentPatients.filter(p => p.status === 'waiting' || p.status === 'away');
        console.log("Recall Check - Queue/Waiting:", queue.length);
        
        // Check if we have at least 3 patients
        if (queue.length >= 3) {
            // Get the 3rd patient (index 2)
            const thirdPatient = queue[2];
            console.log(`3rd Patient: ${thirdPatient.name} | Status: ${thirdPatient.status} | RecallSent: ${thirdPatient.recall_sent}`);
            
            // Check condition: Status is 'away' AND not yet recalled
            if (thirdPatient.status === 'away' && !thirdPatient.recall_sent) {
                console.log(">>> TRIGGERING RECALL MODAL <<<");
                // Determine position for display (it's 3rd)
                const transformed = transformPatient(thirdPatient, 3);
                setRecallCandidate(transformed);
            } else {
                console.log("Recall conditions not met (Not away OR already sent)");
            }
        }
    };

    const handleRecallConfirm = async () => {
        if (!recallCandidate) return;

        try {
            await updatePatient(recallCandidate.id, { recall_sent: true });
            toast.success("Rappel marqué comme envoyé");
            setRecallCandidate(null);
            loadPatients(); 
        } catch (error) {
            console.error("Error updating recall status:", error);
            toast.error("Erreur lors de la mise à jour du statut de rappel");
        }
    };

    const fetchDoctorName = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();
            if (data?.full_name) {
                setDoctorName(data.full_name);
            }
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_#000]">
                        <p className="text-sm font-bold uppercase text-gray-600 mb-1">En Attente</p>
                        <p className="text-3xl font-bold">{queuePatients.length}</p>
                    </div>
                    <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_#000]">
                        <p className="text-sm font-bold uppercase text-gray-600 mb-1">Sans RDV</p>
                        <p className="text-3xl font-bold">{queuePatients.filter(p => p.type === 'walk-in').length}</p>
                    </div>
                    <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_#000]">
                        <p className="text-sm font-bold uppercase text-gray-600 mb-1">Rendez-vous</p>
                        <p className="text-3xl font-bold">{queuePatients.filter(p => p.type === 'rdv').length}</p>
                    </div>
                    <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_#000]">
                        <p className="text-sm font-bold uppercase text-gray-600 mb-1">Terminés</p>
                        <p className="text-3xl font-bold">{completedCount}</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Patient Section */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-2xl font-bold uppercase mb-4 pb-2 border-b-2 border-black">
                            En Consultation
                        </h2>
                        {activePatient ? (
                            <PatientCard
                                patient={transformPatient(activePatient)}
                                onEdit={handleEditPatient}
                                onMarkUrgency={handleMarkUrgency}
                                onDelete={handleDeletePatient}
                                onStatusChange={handleStatusChange}
                            />
                        ) : (
                            <div className="border-2 border-black border-dashed p-8 text-center bg-gray-50">
                                <p className="text-gray-500 font-medium">Aucun patient en consultation</p>
                            </div>
                        )}

                        {/* Call Next Patient Button */}
                        <button
                            onClick={handleCallNext}
                            disabled={queuePatients.length === 0}
                            className="w-full bg-[#1e1b4b] text-white py-3 px-6 font-bold uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {activePatient ? "Appeler le Patient Suivant" : "Appeler le Premier Patient"}
                        </button>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleTVClick}
                                className="w-full flex items-center justify-center gap-2 border-2 border-black bg-black px-6 py-3 text-sm font-bold text-white shadow-[4px_4px_0px_0px_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-900"
                            >
                                <Tv className="h-5 w-5" />
                                MODE TV
                            </button>
                            <button
                                onClick={handleAddPatient}
                                className="w-full flex items-center justify-center gap-2 border-2 border-black bg-black px-6 py-3 text-sm font-bold text-white shadow-[4px_4px_0px_0px_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-900"
                            >
                                <Plus className="h-5 w-5" />
                                AJOUTER PATIENT
                            </button>
                            <ExcelImporter onImportSuccess={loadPatients} />
                        </div>
                    </div>

                    {/* Queue Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
                            <h2 className="text-2xl font-bold uppercase">
                                File d'Attente
                            </h2>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_#000] animate-pulse">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 bg-gray-200 border-2 border-black"></div>
                                                <div className="space-y-2">
                                                    <div className="h-5 w-32 bg-gray-300"></div>
                                                    <div className="h-3 w-24 bg-gray-200"></div>
                                                </div>
                                            </div>
                                            <div className="h-6 w-6 bg-gray-200"></div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <div className="h-8 w-20 bg-gray-200 border-2 border-black"></div>
                                            <div className="h-8 w-20 bg-gray-200 border-2 border-black"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transformedQueuePatients.length > 0 ? (
                                    transformedQueuePatients.map((patient) => (
                                        <PatientCard
                                            key={patient.id}
                                            patient={patient}
                                            onEdit={handleEditPatient}
                                            onMarkUrgency={handleMarkUrgency}
                                            onDelete={handleDeletePatient}
                                            onStatusChange={handleStatusChange}
                                        />
                                    ))
                                ) : (
                                    <div className="border-2 border-black border-dashed p-8 text-center bg-gray-50">
                                        <p className="text-gray-500 font-medium">Aucun patient en attente</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Patient Modal */}
            <AddPatientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onPatientAdded={loadPatients}
            />

            {/* Edit Patient Modal */}
            <EditPatientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                patient={editingPatient}
                onPatientUpdated={loadPatients}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.action}
                title={confirmation.title}
                message={confirmation.message}
                isDestructive={confirmation.isDestructive}
            />

            {/* Recall Modal */}
            <RecallModal
                isOpen={!!recallCandidate}
                onClose={() => setRecallCandidate(null)}
                patient={recallCandidate}
                doctorName={doctorName}
                onConfirm={handleRecallConfirm}
            />
        </>
    );
}
