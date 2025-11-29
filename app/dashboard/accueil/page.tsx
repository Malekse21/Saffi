"use client";

import { useState, useEffect } from "react";
import { PatientCard, Patient } from "@/components/dashboard/PatientCard";
import { SortablePatientCard } from "@/components/dashboard/SortablePatientCard";
import { AddPatientModal } from "@/components/dashboard/AddPatientModal";
import { Tv, Plus } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getPatients, subscribeToPatients, updatePatientStatus } from "@/lib/patients";

type DBPatient = {
    id: string;
    user_id: string;
    ticket_number: string;
    name: string;
    status: 'waiting' | 'active' | 'completed' | 'away';
    type: 'walk-in' | 'rdv';
    arrival_time: string;
    rdv_time?: string;
    phone?: string;
    created_at: string;
    updated_at: string;
};

export default function AccueilPage() {
    const [patients, setPatients] = useState<DBPatient[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Setup drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch patients on mount
    useEffect(() => {
        loadPatients();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToPatients(() => {
            loadPatients();
        });

        return () => unsubscribe();
    }, []);

    const loadPatients = async () => {
        try {
            const data = await getPatients() as DBPatient[];
            setPatients(data);
        } catch (error) {
            console.error("Error loading patients:", error);
            toast.error("Erreur lors du chargement des patients");
        } finally {
            setIsLoading(false);
        }
    };

    // Map database status to component status
    const mapStatus = (dbStatus: string): 'waiting' | 'serving' | 'away' | 'completed' => {
        switch (dbStatus) {
            case 'active': return 'serving';
            case 'waiting': return 'waiting';
            case 'away': return 'away';
            case 'completed': return 'completed';
            default: return 'waiting';
        }
    };

    // Transform patient data to match component interface
    const transformPatient = (p: DBPatient, position: number = 1): Patient => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        status: mapStatus(p.status),
        type: p.type,
        appointmentTime: p.rdv_time ? new Date(p.rdv_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
        isPriority: false,
        position: position
    });

    const activePatient = patients.find(p => p.status === 'active');
    const queuePatients = patients.filter(p => p.status === 'waiting' || p.status === 'away');
    const completedCount = patients.filter(p => p.status === 'completed').length;

    const transformedQueuePatients = queuePatients.map((p, index) => transformPatient(p, index + 1));

    const handleCallNext = async () => {
        if (!activePatient) return;

        try {
            await updatePatientStatus(activePatient.id, 'completed');

            // Get next waiting patient
            const nextPatient = queuePatients[0];
            if (nextPatient) {
                await updatePatientStatus(nextPatient.id, 'active');
            }

            toast.success("Prochain patient appelé!");
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
        setIsModalOpen(true);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = transformedQueuePatients.findIndex(p => p.id === active.id);
            const newIndex = transformedQueuePatients.findIndex(p => p.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // Update order locally
                const newOrder = arrayMove(queuePatients, oldIndex, newIndex);
                const updatedPatients = [...patients];

                // Replace the queue patients in the original array
                const nonQueuePatients = updatedPatients.filter(p => p.status !== 'waiting' && p.status !== 'away');
                setPatients([...nonQueuePatients, ...newOrder]);

                toast.success("Ordre mis à jour");
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
                                isActive={true}
                            />
                        ) : (
                            <div className="border-2 border-black border-dashed p-8 text-center bg-gray-50">
                                <p className="text-gray-500 font-medium">Aucun patient en consultation</p>
                            </div>
                        )}

                        {/* Call Next Patient Button */}
                        {queuePatients.length > 0 && (
                            <button
                                onClick={handleCallNext}
                                disabled={!activePatient && queuePatients.length === 0}
                                className="w-full bg-[#1e1b4b] text-white py-3 px-6 font-bold uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {activePatient ? "Appeler le Patient Suivant" : "Appeler le Premier Patient"}
                            </button>
                        )}

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
                        </div>
                    </div>

                    {/* Queue Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
                            <h2 className="text-2xl font-bold uppercase">
                                File d'Attente
                            </h2>
                            <p className="text-sm font-medium text-gray-600">
                                Glisser pour réorganiser
                            </p>
                        </div>

                        {isLoading ? (
                            <div className="border-2 border-black border-dashed p-8 text-center bg-gray-50">
                                <p className="text-gray-500 font-medium">Chargement...</p>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={transformedQueuePatients.map(p => p.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-4">
                                        {transformedQueuePatients.length > 0 ? (
                                            transformedQueuePatients.map((patient) => (
                                                <SortablePatientCard
                                                    key={patient.id}
                                                    patient={patient}
                                                />
                                            ))
                                        ) : (
                                            <div className="border-2 border-black border-dashed p-8 text-center bg-gray-50">
                                                <p className="text-gray-500 font-medium">Aucun patient en attente</p>
                                            </div>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
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
        </>
    );
}
