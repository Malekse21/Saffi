"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { HelpCircle, CheckCircle, Clock, MapPin, User, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import ReviewGate from "@/components/ReviewGate";
import { addPatientByClinicId } from "@/lib/patients";
import { createClient } from "@/utils/supabase/client";

export default function ClientPortalPage() {
    const params = useParams();
    const clinicId = params.id as string;

    const [position, setPosition] = useState<number | null>(null);
    const [status, setStatus] = useState<'waiting' | 'away' | 'active' | 'completed'>('waiting');
    const [isAway, setIsAway] = useState(false);
    const [googleReviewLink, setGoogleReviewLink] = useState("");
    const [isReviewGateOpen, setIsReviewGateOpen] = useState(false);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [ticketNumber, setTicketNumber] = useState<string | null>(null);

    // User Info State
    const [hasSubmittedInfo, setHasSubmittedInfo] = useState(false);
    const [userName, setUserName] = useState("");
    const [userPhone, setUserPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clinicUserId, setClinicUserId] = useState<string | null>(null);

    // Audio Context Ref
    const audioContextRef = useRef<AudioContext | null>(null);

    const initAudio = () => {
        if (typeof window !== 'undefined') {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext && !audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        }
    };

    const playNotificationSound = () => {
        try {
            const ctx = audioContextRef.current;
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

            osc.start();
            osc.stop(ctx.currentTime + 0.8);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    // Calculate position based on patients waiting with earlier created_at
    const calculatePosition = async (userId: string, myCreatedAt: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'waiting')
            .lt('created_at', myCreatedAt);

        if (error) {
            console.error("Error calculating position:", error);
            return 0;
        }

        return data.length + 1; // Position is count of earlier patients + 1
    };

    const handleSubmitInfo = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = userName.trim();
        const phone = userPhone.trim();

        if (!name) {
            alert("Veuillez entrer votre nom");
            return;
        }

        if (name.length > 30) {
            alert("Le nom ne doit pas dépasser 30 caractères");
            return;
        }

        if (!phone) {
            alert("Veuillez entrer votre numéro de téléphone");
            return;
        }

        if (phone.length !== 8) {
            alert("Le numéro de téléphone doit contenir exactement 8 caractères");
            return;
        }

        if (isSubmitting) return;

        setIsSubmitting(true);
        initAudio();

        try {
            console.log('Attempting to add patient with clinic ID:', clinicId);

            // Add patient to queue via Supabase
            const patient = await addPatientByClinicId(clinicId, name, phone);

            console.log('Patient added successfully:', patient);

            setPatientId(patient.id);
            setTicketNumber(patient.ticket_number);
            setStatus(patient.status);
            setHasSubmittedInfo(true);

            // Calculate initial position
            const pos = await calculatePosition(patient.user_id, patient.created_at);
            setPosition(pos);
        } catch (error: any) {
            console.error("Detailed error joining queue:", error);

            // Show more specific error message
            let errorMessage = "Erreur lors de l'ajout à la file d'attente.";

            if (error.message === 'Clinic not found') {
                errorMessage = "Ce cabinet n'existe pas. Veuillez vérifier le QR code.";
            } else if (error.message) {
                errorMessage = `Erreur: ${error.message}`;
            }

            alert(errorMessage + "\n\nDétails dans la console du navigateur.");
            setIsSubmitting(false);
        }
    };

    // Fetch clinic user_id on mount
    useEffect(() => {
        const fetchClinicUserId = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('queue_settings')
                .select('user_id')
                .eq('clinic_id', clinicId)
                .single();

            if (data) {
                setClinicUserId(data.user_id);
            }
        };

        fetchClinicUserId();
    }, [clinicId]);

    // Subscribe to real-time updates for this specific patient
    useEffect(() => {
        if (!patientId || !hasSubmittedInfo) return;

        const supabase = createClient();

        const channel = supabase
            .channel(`patient_${patientId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'patients',
                    filter: `id=eq.${patientId}`,
                },
                async (payload) => {
                    const updatedPatient = payload.new as any;
                    setStatus(updatedPatient.status);

                    if (updatedPatient.status === 'active') {
                        playNotificationSound();
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate([500, 200, 500, 200, 500]);
                        }
                    } else if (updatedPatient.status === 'completed') {
                        setIsReviewGateOpen(true);
                    }

                    // Recalculate position
                    if (updatedPatient.status === 'waiting') {
                        const pos = await calculatePosition(updatedPatient.user_id, updatedPatient.created_at);
                        setPosition(pos);
                    }
                }
            )
            .subscribe();

        // Also listen to all patient changes to update position
        const allPatientsChannel = supabase
            .channel('all_patients_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'patients',
                },
                async () => {
                    // Recalculate position when any patient changes
                    if (patientId && status === 'waiting') {
                        const supabase = createClient();
                        const { data: myPatient } = await supabase
                            .from('patients')
                            .select('user_id, created_at')
                            .eq('id', patientId)
                            .single();

                        if (myPatient) {
                            const pos = await calculatePosition(myPatient.user_id, myPatient.created_at);
                            setPosition(pos);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(allPatientsChannel);
        };
    }, [patientId, hasSubmittedInfo, status]);

    // Auto-open review gate after 10 seconds of joining the queue
    useEffect(() => {
        if (!hasSubmittedInfo) return;

        const timer = setTimeout(() => {
            setIsReviewGateOpen(true);
        }, 10000); // 10 seconds

        return () => clearTimeout(timer);
    }, [hasSubmittedInfo]);

    const toggleAway = async () => {
        if (!patientId) return;

        const supabase = createClient();
        const newStatus = isAway ? 'waiting' : 'away';

        await supabase
            .from('patients')
            .update({ status: newStatus })
            .eq('id', patientId);

        setIsAway(!isAway);
        setStatus(newStatus);
        alert(isAway ? "Statut mis à jour : Vous êtes de retour." : "Statut mis à jour : Vous êtes sorti.");
    };

    const isServing = status === 'active';

    // Calculate estimated time (5 minutes per person in queue)
    const estimatedMinutes = position ? position * 5 : 0;
    const estimatedTime = new Date(Date.now() + estimatedMinutes * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Show info form if not submitted
    if (!hasSubmittedInfo) {
        return (
            <div className="min-h-screen bg-gray-50 text-black font-sans flex items-center justify-center px-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white border-4 border-black p-8 w-full max-w-md shadow-[8px_8px_0px_0px_#000]"
                >
                    <div className="text-center mb-8">
                        <span className="font-display font-black text-5xl tracking-tighter uppercase">Saffi.</span>
                        <p className="text-gray-600 mt-3 font-bold text-sm uppercase tracking-wide">Rejoindre la file d'attente</p>
                    </div>

                    <form onSubmit={handleSubmitInfo} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-600 flex items-center gap-2 uppercase tracking-wider">
                                <User className="h-4 w-4" /> Nom & Prénom *
                            </label>
                            <input
                                type="text"
                                autoFocus
                                placeholder="Ex: Amine Tounsi"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full bg-white border-2 border-black p-4 text-black focus:outline-none focus:bg-[#2C2B57]/5 transition-colors text-lg font-medium"
                                maxLength={30}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-600 flex items-center gap-2 uppercase tracking-wider">
                                <Phone className="h-4 w-4" /> Téléphone *
                            </label>
                            <input
                                type="tel"
                                placeholder="Ex: 55123456"
                                value={userPhone}
                                onChange={(e) => setUserPhone(e.target.value)}
                                className="w-full bg-white border-2 border-black p-4 text-black focus:outline-none focus:bg-[#2C2B57]/5 transition-colors text-lg font-medium"
                                maxLength={8}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#2C2B57] text-white py-4 font-black text-lg uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Ajout en cours..." : "Rejoindre la file"}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-black font-sans pb-8">
            {/* Simple Header */}
            <header className="bg-white border-b-4 border-black px-6 py-6 flex items-center justify-between">
                <span className="font-display font-black text-3xl tracking-tighter uppercase">Saffi.</span>
                <button className="text-gray-600 hover:text-black transition-colors">
                    <HelpCircle className="h-6 w-6" />
                </button>
            </header>

            <main className="px-6 pt-8 space-y-8 max-w-2xl mx-auto">
                {/* Status Message */}
                <div className="text-center">
                    <h1 className="font-black text-2xl uppercase tracking-tight mb-1">
                        {isServing ? "C'est votre tour!" : "Vous êtes en ligne!"}
                    </h1>
                </div>

                {/* Circular Progress Card */}
                <motion.div
                    layout
                    className={cn(
                        "relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-12 transition-colors duration-500",
                        isServing && "bg-[#10B981]"
                    )}
                >


                    <div className="flex flex-col items-center justify-center space-y-8">
                        {/* Ticket Number Badge */}
                        {ticketNumber && !isServing && (
                            <div className="bg-white border-2 border-black px-6 py-3">
                                <p className="text-xs font-black uppercase tracking-wider text-gray-500">Votre Numéro</p>
                                <p className="font-display font-black text-3xl text-center">{ticketNumber}</p>
                            </div>
                        )}

                        {/* Circular Progress Indicator */}
                        {isServing ? (
                            <div className="flex flex-col items-center">
                                <div className="w-80 h-80 rounded-full bg-white border-4 border-black flex flex-col items-center justify-center">
                                    <span className="font-display font-black text-9xl text-black">
                                        {ticketNumber}
                                    </span>
                                </div>
                                <p className="mt-6 font-black text-xl uppercase tracking-wide">Entrez maintenant!</p>
                            </div>
                        ) : (
                            <div className="relative w-80 h-80">
                                {/* SVG Circle Progress */}
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                                    {/* Background circle */}
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="90"
                                        fill="none"
                                        stroke="#E5E7EB"
                                        strokeWidth="12"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="90"
                                        fill="none"
                                        stroke="#2C2B57"
                                        strokeWidth="12"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 90}`}
                                        strokeDashoffset={`${2 * Math.PI * 90 * (1 - (position ? Math.min(position / 10, 1) : 0))}`}
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>

                                {/* Center Content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-center">
                                        <p className="font-black text-7xl text-[#2C2B57]">
                                            {estimatedMinutes}<span className="text-4xl">min</span>
                                        </p>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-2">
                                            temps estimé
                                        </p>
                                        <div className="mt-4 pt-4 border-t-2 border-gray-200">
                                            <p className="font-black text-5xl text-black">
                                                {position || '...'}
                                            </p>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                                                en attente
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                </motion.div>

                {/* Je Sors Control */}
                {!isServing && (
                    <button
                        onClick={toggleAway}
                        className={cn(
                            "w-full py-4 font-black text-lg flex items-center justify-center gap-3 transition-all border-4 border-black uppercase tracking-wide",
                            isAway
                                ? "bg-[#10B981] text-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]"
                                : "bg-[#2C2B57] text-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]"
                        )}
                    >
                        {isAway ? (
                            <>
                                <MapPin className="h-5 w-5" /> Je suis revenu
                            </>
                        ) : (
                            <>
                                <Clock className="h-5 w-5" /> Je sors un moment
                            </>
                        )}
                    </button>
                )}

                {/* Ad Card */}
                <div className="bg-white p-8 border-4 border-dashed border-gray-300 shadow-[4px_4px_0px_0px_#000] text-center space-y-4">
                    <h3 className="font-display font-black text-3xl leading-tight text-gray-400 uppercase">
                        Publicité
                    </h3>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wide">
                        Espace publicitaire disponible
                    </p>
                </div>
            </main>

            {/* Review Gate */}
            {isReviewGateOpen && (
                <ReviewGate
                    clinicUserId={clinicUserId}
                    googleReviewLink={googleReviewLink}
                    onClose={() => setIsReviewGateOpen(false)}
                />
            )}
        </div>
    );
}
