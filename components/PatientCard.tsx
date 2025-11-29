"use client";

import { GripVertical, MessageCircle } from "lucide-react";
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
    enableDrag?: boolean;
    showSMSStatus?: boolean;
}

export function PatientCard({
    patient,
    enableDrag = false,
    showSMSStatus = false
}: PatientCardProps) {
    const isAway = patient.status === 'away';
    const isRdv = patient.type === 'rdv';

    return (
        <div
            className={cn(
                "relative border-2 border-black p-4 flex items-center justify-between bg-white shadow-[4px_4px_0px_0px_#000] transition-all",
                isAway && "bg-[linear-gradient(135deg,#FACC15_25%,#ffffff_25%,#ffffff_50%,#FACC15_50%,#FACC15_75%,#ffffff_75%,#ffffff_100%)] bg-[length:20px_20px]"
            )}
        >
            <div className="flex items-center gap-4 flex-1">
                {/* Drag Handle */}
                {enableDrag && (
                    <div className="cursor-grab active:cursor-grabbing text-black">
                        <GripVertical className="h-6 w-6" />
                    </div>
                )}

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {/* Position Badge */}
                        {patient.position && (
                            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold border-2 border-black">
                                #{patient.position}
                            </span>
                        )}

                        {/* Type Badge */}
                        {isRdv ? (
                            <span className="bg-[#9333EA] text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wide border-2 border-black">
                                RDV
                            </span>
                        ) : (
                            <span className="bg-[#10B981] text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wide border-2 border-black">
                                Walk-in
                            </span>
                        )}

                        {/* Priority Badge */}
                        {patient.isPriority && (
                            <span className="bg-[#EF4444] text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wide border-2 border-black">
                                Priority
                            </span>
                        )}
                    </div>

                    <h3 className="font-bold text-lg leading-tight">{patient.name}</h3>
                    {patient.phone && (
                        <p className="text-gray-600 text-xs">{patient.phone}</p>
                    )}
                </div>
            </div>

            {/* Right Side Actions/Status */}
            <div className="flex items-center gap-2">
                {/* SMS Icon */}
                {showSMSStatus && isAway && (
                    <div className="bg-white border-2 border-black p-2 rounded-full shadow-[2px_2px_0px_0px_#000]" title="Auto-SMS will be sent">
                        <MessageCircle className="h-5 w-5 text-[#2C2B57]" />
                    </div>
                )}
            </div>
        </div>
    );
}
