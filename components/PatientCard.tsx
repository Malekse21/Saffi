"use client";

import { motion } from "framer-motion";
import { Clock, Trash2, LogOut, Calendar, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type PatientStatus = "waiting" | "active" | "away" | "completed";
export type AppointmentType = "walk-in" | "rdv";

export interface Patient {
    id: string;
    ticketNumber: string;
    name: string;
    status: PatientStatus;
    type: AppointmentType;
    arrivalTime: string;
    rdvTime?: string;
    smsSent?: boolean;
}

interface PatientCardProps {
    patient: Patient;
    mode: "digital" | "connect";
    onAction: (id: string, action: "mark-away" | "delete" | "whatsapp") => void;
}

export function PatientCard({ patient, mode, onAction }: PatientCardProps) {
    const isAway = patient.status === "away";
    const isRdv = patient.type === "rdv";
    const isConnect = mode === "connect";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "group relative flex items-center justify-between p-4 border-2 transition-all",
                // Base styles
                "bg-white border-white/20",
                // Away style
                isAway && "bg-striped-yellow border-yellow-400 text-black",
                // Connect mode specific styles
                isConnect && !isAway && "hover:border-indigo-500",
                !isConnect && !isAway && "hover:border-yellow-400"
            )}
        >
            {/* Left: Drag Handle & Info */}
            <div className="flex items-center gap-4">
                <div className={cn(
                    "h-12 w-12 flex items-center justify-center font-display font-bold text-xl rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                    isAway ? "bg-black text-white" : "bg-gray-100 text-black"
                )}>
                    {patient.ticketNumber}
                </div>

                <div>
                    <h4 className={cn("font-bold text-lg leading-tight", isAway ? "text-black" : "text-black")}>
                        {patient.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Arrivé à {patient.arrivalTime}</span>
                        {isRdv && (
                            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                RDV {patient.rdvTime}
                            </span>
                        )}
                        {isConnect && patient.smsSent && (
                            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 flex items-center gap-1">
                                <Smartphone className="h-3 w-3" />
                                SMS
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Status & Actions */}
            <div className="flex items-center gap-3">
                {isAway && (
                    <span className="font-bold text-xs bg-black text-yellow-400 px-2 py-1 border border-black">
                        ABSENT
                    </span>
                )}

                {/* Hover Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onAction(patient.id, "mark-away")}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black"
                        title={isAway ? "Marquer présent" : "Marquer absent"}
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onAction(patient.id, "delete")}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                        title="Supprimer"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
