import { X, MessageCircle } from "lucide-react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface RecallModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: {
        id: string;
        name: string;
        phone?: string;
    } | null;
    doctorName?: string;
    onConfirm: () => void;
}

export function RecallModal({ isOpen, onClose, patient, doctorName, onConfirm }: RecallModalProps) {
    if (!isOpen || !patient) return null;

    const handleSend = () => {
        if (!patient.phone) {
            toast.error("Pas de numéro de téléphone pour ce patient");
            return;
        }

        // Format phone number: remove spaces, ensure it starts with 216 if not present
        // (assuming Tunisian numbers based on context "216")
        let cleanNumber = patient.phone.replace(/\s+/g, '').replace(/\D/g, '');
        
        // If it sends with just 8 digits, add 216. If it already has 216, keep it.
        // Simple heuristic: if length is 8, add 216.
        if (cleanNumber.length === 8) {
            cleanNumber = '216' + cleanNumber;
        }

        const safeDoctorName = doctorName || "le médecin";
        const message = `Bonjour ${patient.name}, c'est le cabinet Dr. ${safeDoctorName}. C'est presque votre tour (3ème position). Merci de revenir en salle d'attente.`;
        const encodedMessage = encodeURIComponent(message);
        
        const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
        
        window.open(url, '_blank');
        onConfirm();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] animate-in fade-in zoom-in duration-200">
                {/* Header - Yellow Alert Style */}
                <div className="bg-[#FEF08A] p-4 border-b-2 border-black flex items-center justify-between">
                    <h2 className="text-xl font-bold uppercase flex items-center gap-2">
                        ⚠️ Rappel Nécessaire
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-black/10 rounded-full transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <p className="font-bold text-lg">
                            Le patient <span className="bg-[#FEF08A] px-1 border border-black">{patient.name}</span> est en 3ème position mais est marqué <span className="underline decoration-2 decoration-red-500">"Sorti"</span>.
                        </p>
                        <p className="text-gray-600">
                            Voulez-vous lui envoyer un WhatsApp pour le rappeler ?
                        </p>
                    </div>
                
                    <div className="bg-gray-50 border-2 border-black p-4 space-y-2">
                        <p className="text-xs font-bold uppercase text-gray-500">Message pré-rempli :</p>
                        <p className="text-sm italic">
                            "Bonjour {patient.name}, c'est le cabinet Dr. {doctorName || "..."}. C'est presque votre tour (3ème position). Merci de revenir en salle d'attente."
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 font-bold border-2 border-black uppercase text-sm hover:bg-gray-100 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSend}
                            className="flex-1 px-4 py-3 font-bold border-2 border-black bg-[#4ADE80] shadow-[4px_4px_0px_0px_#000] uppercase text-sm flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                        >
                            <MessageCircle className="h-5 w-5" />
                            Ouvrir WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
