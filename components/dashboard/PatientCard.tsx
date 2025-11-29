"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from "@/lib/utils";

export interface Patient {
    id: string;
    name: string;
    phone?: string;
    status: 'waiting' | 'serving' | 'away' | 'completed';
    type: 'walk-in' | 'rdv';
    appointmentTime?: string;
    isPriority?: boolean;
    position?: number;
}

interface PatientCardProps {
    patient: Patient;
    isActive?: boolean;
    onCallNext?: () => void;
    showDragHandle?: boolean;
}

export function PatientCard({
    patient,
    isActive = false,
    onCallNext,
    showDragHandle = false
}: PatientCardProps) {
    const isRdv = patient.type === 'rdv';
    const isAway = patient.status === 'away';

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: patient.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative border-2 border-black p-6 transition-all bg-white",
                isActive ? "shadow-[6px_6px_0px_0px_#000]" : "shadow-[4px_4px_0px_0px_#000]",
                isAway && "opacity-60"
            )}
        >
            <div className="flex items-start gap-4">
                {/* Drag Handle */}
                {showDragHandle && (
                    <button
                        className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 transition-colors"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-5 w-5 text-gray-400" />
                    </button>
                )}

                {/* Patient Info */}
                <div className="flex-1">
                    {/* Ticket Number Badge */}
                    <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-black text-white font-bold text-sm">
                            #{patient.position || 1}
                        </span>
                        {isRdv && (
                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-purple-500 px-3 py-1 text-xs font-bold text-white">
                                RDV
                            </span>
                        )}
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold mb-2">{patient.name}</h3>

                    {/* Details */}
                    <div className="space-y-1 text-sm font-medium text-gray-600">
                        {patient.phone && <p>📞 {patient.phone}</p>}
                        {patient.appointmentTime && <p>🕐 {patient.appointmentTime}</p>}
                    </div>
                </div>
            </div>

            {/* Call Next Button */}
            {isActive && onCallNext && (
                <button
                    onClick={onCallNext}
                    className="mt-4 w-full bg-[#10B981] text-white py-3 px-6 font-bold uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                    Appeler le Patient Suivant
                </button>
            )}
        </div>
    );
}
