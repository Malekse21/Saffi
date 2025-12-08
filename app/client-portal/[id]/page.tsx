"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { HelpCircle, CheckCircle, Clock, MapPin, User, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import ReviewGate from "@/components/ReviewGate";
import { addPatientByClinicId } from "@/lib/patients";
import { createClient } from "@/utils/supabase/client";
import { MOTIFS, MotifValue } from "@/lib/motifs";
import FlipQueueCard from "@/components/FlipQueueCard";
import Navbar from "@/components/patient/Navbar";

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
    const [selectedMotif, setSelectedMotif] = useState<MotifValue>("consultation");
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

    // Calculate weighted wait time based on motifs of patients ahead
    const calculateWaitTime = async (userId: string, myId: string, myCreatedAt: string) => {
        const supabase = createClient();
        
        // Fetch all waiting patients for this doctor
        const { data: queueData, error: queueError } = await supabase
            .from('patients')
            .select('id, motif, created_at')
            .eq('user_id', userId)
            .eq('status', 'waiting')
            .order('created_at', { ascending: true });

        if (queueError) {
            console.error("Error fetching queue:", queueError);
            return { position: 0, waitMinutes: 0 };
        }

        // Calculate position (for display)
        const myIndex = queueData.findIndex(p => p.id === myId);
        const position = myIndex >= 0 ? myIndex + 1 : 0;

        // Fetch doctor's average consultation time
        const { data: profileData } = await supabase
            .from('profiles')
            .select('avg_consultation_time')
            .eq('id', userId)
            .single();

        const avgTime = profileData?.avg_consultation_time || 20; // Default 20 min

        // Use weighted calculation
        const { calculateEstWaitTime } = await import('@/utils/queueCalculator');
        const waitMinutes = calculateEstWaitTime(queueData, myId, avgTime);

        return { position, waitMinutes };
    };

    // Fetch clinic user_id on mount
    useEffect(() => {
        const fetchClinicUserId = async () => {
            const supabase = createClient();
            // Try slug first
            let { data } = await supabase
                .from('profiles')
                .select('id') // user_id is the id in profiles
                .eq('slug', clinicId)
                .maybeSingle();

            if (!data) {
                // Fallback to clinic_id
                const { data: uuidData } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('clinic_id', clinicId)
                    .maybeSingle();
                data = uuidData;
            }

            if (data) {
                setClinicUserId(data.id);
            }
        };

        fetchClinicUserId();
    }, [clinicId]);

    // Current Motif State
    const [currentMotif, setCurrentMotif] = useState<string | null>(null);

    // Restore session on mount
    useEffect(() => {
        const restoreSession = async () => {
            // Check for terminal states first (Completed/Deleted)
            // We skip terminal state check for 'completed' to allow fresh scans
            // If user refreshes immediately after completion, they might see form again, but that's better than being stuck.
            
            const terminalState = sessionStorage.getItem(`saffi_terminal_state_${clinicId}`);
            if (terminalState === 'deleted') {
                setIsDeleted(true);
                setHasSubmittedInfo(true); 
                return;
            }

            const savedSession = localStorage.getItem(`saffi_patient_session_${clinicId}`);
            if (!savedSession) return;

            try {
                const { patientId: savedPatientId } = JSON.parse(savedSession);
                if (!savedPatientId) return;

                const supabase = createClient();
                const { data: patient, error } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', savedPatientId)
                    .single();

                if (error || !patient) {
                    // Invalid session or patient deleted
                    localStorage.removeItem(`saffi_patient_session_${clinicId}`);
                    return;
                }

                // NEW: If patient is completed, DO NOT restore. Clear session and let user start new.
                if (patient.status === 'completed') {
                     localStorage.removeItem(`saffi_patient_session_${clinicId}`);
                     sessionStorage.removeItem(`saffi_terminal_state_${clinicId}`);
                     return;
                }

                // Restore state
                setPatientId(patient.id);
                setTicketNumber(patient.ticket_number);
                setStatus(patient.status);
                setUserName(patient.name);
                setUserPhone(patient.phone || "");
                setIsAway(patient.status === 'away');
                setCurrentMotif(patient.motif || null); // Restore motif
                setHasSubmittedInfo(true);

                // Calculate initial position and wait time if waiting
                if (patient.status === 'waiting' || patient.status === 'away') {
                    const { position: pos, waitMinutes } = await calculateWaitTime(patient.user_id, patient.id, patient.created_at);
                    setPosition(pos);
                    setRemainingMinutes(waitMinutes);
                    setInitialEstimatedMinutes(waitMinutes);
                }
            } catch (e) {
                console.error("Error restoring session:", e);
                localStorage.removeItem(`saffi_patient_session_${clinicId}`);
            }
        };

        restoreSession();
    }, [clinicId]);

    // ... (handleSubmitInfo logic remains mostly same, just need to set currentMotif on success)

    const performJoin = async () => {
        setIsSubmitting(true);
        initAudio();

        try {
            console.log('Attempting to join queue via API:', clinicId);

            // Call the Join API
            const res = await fetch('/api/queue/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: userPhone,
                    name: userName,
                    doctorId: clinicUserId
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to join');

            const patient = data.patient;
            console.log('Patient joined successfully:', patient);

            // Save session
            localStorage.setItem(`saffi_patient_session_${clinicId}`, JSON.stringify({
                patientId: patient.id,
                timestamp: Date.now()
            }));

            setPatientId(patient.id);
            setTicketNumber(patient.ticket_number);
            setStatus(patient.status);
            setCurrentMotif(patient.motif || null);
            setHasSubmittedInfo(true);

            // Calculate position and wait time
            const { position: pos, waitMinutes } = await calculateWaitTime(patient.user_id, patient.id, patient.created_at);
            setPosition(pos);
            setRemainingMinutes(waitMinutes);
            setInitialEstimatedMinutes(waitMinutes);

        } catch (error: any) {
            console.error("Join error:", error);
            alert("Erreur lors de l'ajout à la file d'attente: " + error.message);
            setIsSubmitting(false);
        }
    };

    const handleSubmitInfo = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = userName.trim();
        const phone = userPhone.trim();

        if (!name || isSubmitting) return;
        if (!phone || phone.length !== 8) {
            alert("Numéro de téléphone invalide (8 chiffres)");
            return;
        }

        // Direct Join (API handles matching internally)
        await performJoin();
    };

    // ...

    // Subscribe to real-time updates for this specific patient
    useEffect(() => {
        if (!patientId || !hasSubmittedInfo) return;

        const supabase = createClient();

        const channel = supabase
            .channel(`patient_${patientId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (UPDATE, DELETE)
                    schema: 'public',
                    table: 'patients',
                    filter: `id=eq.${patientId}`,
                },
                async (payload) => {
                    if (payload.eventType === 'DELETE') {
                        // Patient was deleted
                        localStorage.removeItem(`saffi_patient_session_${clinicId}`);
                        sessionStorage.setItem(`saffi_terminal_state_${clinicId}`, 'deleted');
                        setIsDeleted(true);
                        return;
                    }

                    const updatedPatient = payload.new as any;
                    setStatus(updatedPatient.status);
                    if (updatedPatient.motif) {
                        setCurrentMotif(updatedPatient.motif); // Update motif in real-time
                    }

                    if (updatedPatient.status === 'active') {
                        playNotificationSound();
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate([500, 200, 500, 200, 500]);
                        }
                    } else if (updatedPatient.status === 'completed') {
                        localStorage.removeItem(`saffi_patient_session_${clinicId}`);
                        sessionStorage.setItem(`saffi_terminal_state_${clinicId}`, 'completed');
                        setIsReviewGateOpen(true);
                        playPopSound();
                    }

                    // Recalculate position and wait time
                    if (updatedPatient.status === 'waiting') {
                        const { position: pos, waitMinutes } = await calculateWaitTime(updatedPatient.user_id, updatedPatient.id, updatedPatient.created_at);
                        setPosition(pos);
                        setRemainingMinutes(waitMinutes);
                        if (waitMinutes > initialEstimatedMinutes) {
                            setInitialEstimatedMinutes(waitMinutes);
                        }
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
                    filter: `user_id=eq.${clinicUserId}`, // Filter by clinic
                },
                async () => {
                    // Whenever any patient changes in this clinic, recalculate position
                    if (status === 'waiting') {
                        // We rely on the specific patient subscription for position updates for now
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(allPatientsChannel);
        };
    }, [patientId, hasSubmittedInfo, clinicUserId, status]);

    // Auto-end session 1 minute after completion
    useEffect(() => {
        if (status === 'completed') {
            const timer = setTimeout(() => {
                // Clear session
                localStorage.removeItem(`saffi_patient_session_${clinicId}`);

                // Fallback: Redirect to blank page
                window.location.href = "about:blank";
            }, 60000); // 1 minute

            return () => clearTimeout(timer);
        }
    }, [status, clinicId]);

    // Handle Deletion State
    const [isDeleted, setIsDeleted] = useState(false);

    const playPopSound = () => {
        try {
            const ctx = audioContextRef.current;
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };




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
    };

    const isServing = status === 'active';

    // Initial estimated time in minutes
    const [initialEstimatedMinutes, setInitialEstimatedMinutes] = useState<number>(0);
    // Current remaining minutes
    const [remainingMinutes, setRemainingMinutes] = useState<number>(0);
    // Track previous position to avoid resetting timer on re-renders
    const prevPositionRef = useRef<number | null>(null);

    // Countdown timer (wait time is now calculated directly with weighted algorithm)
    useEffect(() => {
        if (remainingMinutes <= 0) return;

        const timer = setInterval(() => {
            setRemainingMinutes(prev => Math.max(0, prev - 1));
        }, 60000); // Decrease every minute

        return () => clearInterval(timer);
    }, [remainingMinutes]);

    // Calculate progress for the circle (0 to 1)
    // 1 means full circle (start), 0 means empty (done)
    const progress = initialEstimatedMinutes > 0 ? remainingMinutes / initialEstimatedMinutes : 0;

    // Fetch clinic details
    const [clinicName, setClinicName] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [wifiCode, setWifiCode] = useState("");

    useEffect(() => {
        const fetchClinicDetails = async () => {
            if (!clinicUserId) return;

            const supabase = createClient();
            const { data } = await supabase
                .from('profiles')
                .select('clinic_name, specialty, wifi_code')
                .eq('id', clinicUserId)
                .single();

            if (data) {
                setClinicName(data.clinic_name || "Cabinet Médical");
                setSpecialty(data.specialty || "");
                setWifiCode(data.wifi_code || "");
            }
        };

        fetchClinicDetails();
    }, [clinicUserId]);

    // Away Confirmation State
    const [showAwayConfirmation, setShowAwayConfirmation] = useState(false);

    // Show info form if not submitted
    if (!hasSubmittedInfo) {
        return (
            <div className="min-h-screen bg-white text-black font-sans flex items-center justify-center p-6 relative overflow-hidden">
                {/* Corner illustrations - matching QR poster */}
                <div className="absolute top-4 right-4 w-12 h-12 bg-pink-400 border-4 border-black rounded-lg"></div>
                <div className="absolute top-4 left-4 w-12 h-12 bg-teal-400 border-4 border-black rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 bg-yellow-300 border-4 border-black rounded-lg rotate-45"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 bg-purple-400 border-4 border-black rounded-full"></div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white border-4 border-black p-8 w-full max-w-md shadow-[8px_8px_0px_0px_#000] relative z-10"
                >
                    <div className="text-center mb-8 space-y-1">
                        <h1 className="font-display font-black text-4xl tracking-tight uppercase">BIENVENUE</h1>
                        <h2 className="font-bold text-lg">{clinicName}</h2>
                        {specialty && (
                            <p className="font-semibold text-sm text-gray-600 italic">{specialty}</p>
                        )}
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

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-600 flex items-center gap-2 uppercase tracking-wider">
                                <HelpCircle className="h-4 w-4" /> Motif de visite *
                            </label>
                            <select
                                value={selectedMotif}
                                onChange={(e) => setSelectedMotif(e.target.value as MotifValue)}
                                className="w-full bg-white border-2 border-black h-12 px-4 text-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all text-lg font-medium appearance-none"
                                required
                                disabled={isSubmitting}
                            >
                                {MOTIFS.filter(m => m.isPublic).map((motif) => (
                                    <option key={motif.value} value={motif.value}>
                                        {motif.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#2C2B57] text-white py-4 font-black text-lg uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Ajout en cours..." : "Rejoindre la file"}
                        </button>
                    </form>

                    <div className="text-center mt-8">
                        <p className="font-semibold text-xs text-gray-500">
                            Powered by <span className="font-display text-[#2C2B57]">Saffi.tn</span>
                        </p>
                    </div>
                </motion.div>
            </div >
        );
    }

    // Show deleted screen
    if (isDeleted) {
        return (
            <div className="h-screen bg-gray-50 text-black font-sans flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="bg-white border-b-4 border-black px-6 py-4 flex items-center justify-between shrink-0 z-10">
                    <div className="flex flex-col">
                        <span className="font-display font-black text-3xl tracking-tighter uppercase leading-none">Saffi.</span>
                        {clinicName && (
                            <span className="text-sm font-bold text-gray-600 uppercase tracking-wide truncate max-w-[200px] mt-1">
                                {clinicName}
                            </span>
                        )}
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 space-y-4 max-w-md mx-auto w-full min-h-0">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white border-4 border-black p-8 w-full shadow-[8px_8px_0px_0px_#000] text-center space-y-6"
                    >
                        <div className="flex justify-center">
                            <div className="bg-red-500 text-white p-4 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                                <User className="h-12 w-12" />
                            </div>
                        </div>
                        <div>
                            <h1 className="font-display font-black text-2xl uppercase tracking-tight mb-2">
                                Session Terminée
                            </h1>
                            <p className="text-gray-600 font-bold">
                                Votre session a été fermée par le cabinet.
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-black text-white border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                        >
                            Retour à l'accueil
                        </button>
                    </motion.div>
                </main>
            </div>
        );
    }

    // Show completed screen (App-like)
    if (status === 'completed') {
        return (
            <div className="h-screen bg-gray-50 text-black font-sans flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="bg-white border-b-4 border-black px-6 py-4 flex items-center justify-between shrink-0 z-10">
                    <div className="flex flex-col">
                        <span className="font-display font-black text-3xl tracking-tighter uppercase leading-none">Saffi.</span>
                        {clinicName && (
                            <span className="text-sm font-bold text-gray-600 uppercase tracking-wide truncate max-w-[200px] mt-1">
                                {clinicName}
                            </span>
                        )}
                    </div>
                    <button className="text-gray-600 hover:text-black transition-colors">
                        <HelpCircle className="h-6 w-6" />
                    </button>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 space-y-4 max-w-md mx-auto w-full min-h-0">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white border-4 border-black p-12 w-full shadow-[8px_8px_0px_0px_#000] text-center space-y-8"
                    >
                        <div className="flex justify-center">
                            <div className="bg-[#10B981] text-white p-4 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                                <CheckCircle className="h-12 w-12" />
                            </div>
                        </div>

                        <div>
                            <h1 className="font-display font-black text-4xl uppercase tracking-tight mb-4">
                                Visite Terminée
                            </h1>
                            <p className="text-gray-600 font-bold text-lg">
                                Merci de votre visite !
                            </p>
                        </div>

                        <div className="pt-8 border-t-2 border-gray-100">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                                À bientôt chez Saffi
                            </p>
                            <button
                                onClick={() => {
                                    localStorage.removeItem(`saffi_patient_session_${clinicId}`);
                                    sessionStorage.removeItem(`saffi_terminal_state_${clinicId}`);
                                    window.location.reload();
                                }}
                                className="mt-6 w-full py-3 bg-black text-white border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                Nouvelle Visite
                            </button>
                        </div>
                    </motion.div>
                </main>

                {/* Review Gate Overlay */}
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

    return (
        <div className="h-screen bg-gray-50 text-black font-sans flex flex-col overflow-hidden relative">
            {/* Navbar */}
            <Navbar clinicName={clinicName} wifiCode={wifiCode} />

            <main className="flex-1 flex flex-col px-4 py-4 space-y-4 max-w-md mx-auto w-full min-h-0">
                {/* Status Message */}
                <div className="text-center shrink-0">
                    <h1 className="font-black text-xl uppercase tracking-tight mb-1">
                        {isServing ? "C'est votre tour!" : position === 1 ? "Vous êtes le prochain !" : "Vous êtes en ligne!"}
                    </h1>
                     {position === 1 && !isServing && (
                        <p className="text-[#2C2B57] font-bold text-sm uppercase tracking-wide animate-pulse">
                            Préparez-vous à entrer
                        </p>
                    )}
                </div>
                {/* Flippable Queue Card */}
                <div className="flex-1 min-h-0 relative">
                     <FlipQueueCard 
                        ticketNumber={ticketNumber || ""}
                        waitTime={remainingMinutes}
                        position={position}
                        isServing={isServing}
                        currentMotif={currentMotif}
                     />
                </div>

                {/* Bottom Actions - Shrinkable */}
                <div className="shrink-0 space-y-3">
                    {/* Je Sors Control */}
                    {!isServing && (
                        <button
                            onClick={() => setShowAwayConfirmation(true)}
                            className={cn(
                                "w-full py-3 font-black text-base flex items-center justify-center gap-2 transition-all border-4 border-black uppercase tracking-wide",
                                isAway
                                    ? "bg-[#10B981] text-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000]"
                                    : "bg-[#2C2B57] text-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000]"
                            )}
                        >
                            {isAway ? (
                                <>
                                    <MapPin className="h-4 w-4" /> Je suis revenu
                                </>
                            ) : (
                                <>
                                    <Clock className="h-4 w-4" /> Je sors un moment
                                </>
                            )}
                        </button>
                    )}

                    {/* Ad Card - Bigger */}
                    <div className="bg-white p-6 border-4 border-dashed border-gray-300 shadow-[2px_2px_0px_0px_#000] text-center flex flex-col items-center justify-center min-h-[120px]">
                        <h3 className="font-display font-black text-2xl leading-tight text-gray-400 uppercase mb-2">
                            Publicité
                        </h3>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">
                            Espace publicitaire disponible
                        </p>
                    </div>
                </div>
            </main>

            {/* Away Confirmation Modal */}
            {showAwayConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white w-full max-w-sm border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6 text-center"
                    >
                        <h3 className="font-display font-black text-xl uppercase mb-4">
                            {isAway ? "Êtes-vous de retour ?" : "Voulez-vous sortir ?"}
                        </h3>
                        <p className="text-gray-600 font-bold mb-6">
                            {isAway
                                ? "Confirmez que vous êtes revenu dans la salle d'attente."
                                : "Votre place sera conservée, mais nous saurons que vous êtes absent momentanément."}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAwayConfirmation(false)}
                                className="flex-1 py-3 border-2 border-black font-bold uppercase hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    toggleAway();
                                    setShowAwayConfirmation(false);
                                }}
                                className="flex-1 py-3 bg-black text-white border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                Confirmer
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

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
