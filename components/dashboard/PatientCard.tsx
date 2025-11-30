"use client";


import { cn } from "@/lib/utils";

export interface Patient {
    id: string;
    name: string;
    phone?: string;
    status: 'waiting' | 'serving' | 'away' | 'completed';
    type: 'walk-in' | 'rdv';
    appointmentTime?: string;
    isPriority?: boolean;
    ticketNumber?: string;
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

    return (
        <div
            className={cn(
                "relative border-2 border-black p-6 transition-all",
                isActive ? "shadow-[6px_6px_0px_0px_#000] bg-white" : "shadow-[4px_4px_0px_0px_#000]",
                isAway ? "bg-gray-200" : "bg-white"
            )}
        >
            <div className="flex items-start gap-4">
                {/* Patient Info */}
                <div className="flex-1">
                    {/* Ticket Number Badge */}
                    <div className="flex items-center gap-3 mb-3">
                        <span className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-black font-bold text-sm",
                            isAway ? "bg-gray-400 text-white" : "bg-black text-white"
                        )}>
                            {patient.ticketNumber || patient.position || '#'}
                        </span>
                        {isRdv && (
                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-purple-500 px-3 py-1 text-xs font-bold text-white">
                                RDV
                            </span>
                        )}
                        {isAway && (
                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-gray-500 px-3 py-1 text-xs font-bold text-white uppercase">
                                OUT
                            </span>
                        )}
                    </div>

                    {/* Name */}
                    <h3 className={cn(
                        "text-xl font-bold mb-2",
                        isAway && "text-gray-500"
                    )}>{patient.name}</h3>

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
