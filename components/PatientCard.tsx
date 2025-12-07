import { GripVertical, MessageCircle, MoreVertical, Edit, AlertTriangle, Trash2, UserX, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Patient } from "@/lib/patients";
import { MOTIFS } from "@/lib/motifs";
import { useState } from "react";

interface PatientCardProps {
    patient: Patient;
    enableDrag?: boolean;
    showSMSStatus?: boolean;
    onEdit?: (patient: Patient) => void;
    onMarkUrgency?: (patient: Patient) => void;
    onDelete?: (patient: Patient) => void;
    onStatusChange?: (patient: Patient, newStatus: 'waiting' | 'away' | 'scheduled') => void;
}

export function PatientCard({
    patient,
    enableDrag = false,
    showSMSStatus = false,
    onEdit,
    onMarkUrgency,
    onDelete,
    onStatusChange
}: PatientCardProps) {
    const isAway = patient.status === 'away';
    const isScheduled = patient.status === 'scheduled';
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Find motif details
    const motif = MOTIFS.find(m => m.value === patient.motif);

    return (
        <div
            className={cn(
                "relative border-2 border-black p-4 flex items-center justify-between bg-white shadow-[4px_4px_0px_0px_#000] transition-all",
                isAway && "bg-gray-200 grayscale-[0.5]",
                isScheduled && "bg-gray-200 grayscale-[0.5] border-dashed",
                isMenuOpen ? "z-50" : "z-0"
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Ticket Number Badge */}
                        {patient.ticket_number && (
                            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold border-2 border-black">
                                {patient.ticket_number}
                            </span>
                        )}

                        {/* Motif Badge */}
                        {motif && (
                            <span className={cn(
                                "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border-2 border-black rounded-full",
                                motif.color,
                                motif.value === 'urgence' ? 'text-white' : 'text-black'
                            )}>
                                {motif.label}
                            </span>
                        )}

                        {/* RDV Time Badge */}
                        {patient.appointmentTime && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border-2 border-black rounded-full bg-[#9333EA] text-white">
                                {patient.appointmentTime}
                            </span>
                        )}


                    </div>

                    <h3 className="font-bold text-lg leading-tight">{patient.name}</h3>
                    {patient.phone && (
                        <p className="text-gray-600 text-xs">{patient.phone}</p>
                    )}
                    {isScheduled && (
                         <div className="mt-1 inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded border border-black text-[10px] font-bold uppercase text-gray-500">
                             📅 Pas encore arrivé
                         </div>
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

                {/* Menu Button */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <MoreVertical className="h-5 w-5 text-gray-600" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] z-20 py-1">
                                <button
                                    onClick={() => {
                                        onEdit?.(patient);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit className="h-4 w-4" /> Modifier
                                </button>
                                <button
                                    onClick={() => {
                                        const newStatus = isAway ? 'waiting' : (isScheduled ? 'waiting' : 'away');
                                        onStatusChange?.(patient, newStatus);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
                                >
                                    {isAway ? (
                                        <><UserCheck className="h-4 w-4" /> Marquer Présent</>
                                    ) : isScheduled ? (
                                        <><UserCheck className="h-4 w-4" /> Marquer Arrivé</>
                                    ) : (
                                        <><UserX className="h-4 w-4" /> Marquer Absent</>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        onMarkUrgency?.(patient);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <AlertTriangle className="h-4 w-4" /> Marquer Urgence
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete?.(patient);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                                >
                                    <Trash2 className="h-4 w-4" /> Supprimer
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
