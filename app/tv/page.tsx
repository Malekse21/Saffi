"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Maximize, Minimize, Volume2, VolumeX, Cast } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPatients, subscribeToPatients } from "@/lib/patients";

// Define local Patient type for TV display
interface TVPatient {
    id: string;
    ticketNumber: string;
    name: string;
    status: 'waiting' | 'active' | 'completed' | 'away';
    type: 'walk-in' | 'rdv';
    rdvTime?: string;
    position: number;
}

export default function TVPage() {
    const [activePatient, setActivePatient] = useState<TVPatient | null>(null);
    const [queue, setQueue] = useState<TVPatient[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isAnnounceEnabled, setIsAnnounceEnabled] = useState(true);
    const isAnnounceEnabledRef = useRef(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [clinicName, setClinicName] = useState("Cabinet Dr. Malek");

    // Audio Context Ref
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize Audio Context
    const initAudio = () => {
        if (typeof window !== 'undefined') {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext && !audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }
            if (audioContextRef.current?.state === 'suspended' && isAnnounceEnabledRef.current) {
                audioContextRef.current.resume();
            }
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => {
                console.error(`Error attempting to enable fullscreen: ${e.message}`);
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const handleCast = () => {
        const width = 1920;
        const height = 1080;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(
            window.location.href,
            'SaffiTV',
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
        );
    };

    // Listen for fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const announcePatient = (ticketNumber: string) => {
        if (!isAnnounceEnabledRef.current) return;

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            // Format ticket number for better speech (e.g., "A 1" -> "A un")
            const text = `Patient numéro ${ticketNumber}, au cabinet s'il vous plaît`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    const playNotificationSound = (ticketNumber: string) => {
        if (!isAnnounceEnabledRef.current) return;

        // Ensure audio context is ready
        if (!audioContextRef.current) initAudio();
        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();

        try {
            // Try playing a chime sound
            const ctx = audioContextRef.current;
            if (ctx) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                // Simple chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);

                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

                osc.start();
                osc.stop(ctx.currentTime + 0.5);

                // Announce after sound
                setTimeout(() => announcePatient(ticketNumber), 800);
            }
        } catch (e) {
            console.error("Audio error:", e);
            announcePatient(ticketNumber);
        }
    };

    // Fetch and subscribe to data
    useEffect(() => {
        const loadData = async () => {
            try {
                const patients = await getPatients();

                // Transform data
                const active = patients.find((p: any) => p.status === 'active');
                const waiting = patients
                    .filter((p: any) => p.status === 'waiting' || p.status === 'away')
                    .map((p: any, index: number) => ({
                        id: p.id,
                        ticketNumber: `#${index + 1}`, // Simple numbering based on position
                        name: p.name,
                        status: p.status,
                        type: p.type,
                        rdvTime: p.rdv_time ? new Date(p.rdv_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
                        position: index + 1
                    }));

                // Check for status change to trigger announcement
                setActivePatient(prev => {
                    if (active && active.id !== prev?.id) {
                        // New active patient!
                        const ticketNum = `#${waiting.length + 1}`; // Just a placeholder, ideally we use actual ticket number if available
                        // Actually, let's use the name or a generated number. 
                        // Since we don't have persistent ticket numbers in the DB schema shown earlier (it was just 'ticket_number' string),
                        // let's use the one from DB if available, or generate one.
                        // The DBPatient type has ticket_number.
                        playNotificationSound(active.ticket_number || "Suivant");

                        return {
                            id: active.id,
                            ticketNumber: active.ticket_number || "---",
                            name: active.name,
                            status: active.status,
                            type: active.type,
                            rdvTime: active.rdv_time,
                            position: 0
                        };
                    }
                    return active ? {
                        id: active.id,
                        ticketNumber: active.ticket_number || "---",
                        name: active.name,
                        status: active.status,
                        type: active.type,
                        rdvTime: active.rdv_time,
                        position: 0
                    } : null;
                });

                setQueue(waiting);
            } catch (error) {
                console.error("Error loading TV data:", error);
            }
        };

        loadData();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToPatients(() => {
            loadData();
        });

        // Time update
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        return () => {
            unsubscribe();
            clearInterval(timer);
        };
    }, []);

    // Auto-initialize audio on interaction
    useEffect(() => {
        const handleInteraction = () => {
            initAudio();
            window.removeEventListener('click', handleInteraction);
        };
        window.addEventListener('click', handleInteraction);
        return () => window.removeEventListener('click', handleInteraction);
    }, []);

    const toggleMute = () => {
        const newState = !isAnnounceEnabled;
        setIsAnnounceEnabled(newState);
        isAnnounceEnabledRef.current = newState;
        if (!newState && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans flex flex-col">
            {/* Header */}
            <header className="h-32 bg-white border-b-4 border-black flex items-center justify-between px-12 shrink-0">
                <div className="flex items-center gap-8">
                    <span className="font-display font-black text-6xl tracking-tighter uppercase text-black">{clinicName}</span>

                    {/* Controls */}
                    <div className="flex items-center gap-2 bg-gray-50 border-2 border-black p-2 opacity-0 hover:opacity-100 transition-opacity">
                        <button onClick={toggleMute} className="p-3 border-2 border-black">
                            {isAnnounceEnabled ? <Volume2 className="h-8 w-8" /> : <VolumeX className="h-8 w-8" />}
                        </button>
                        <button onClick={toggleFullscreen} className="p-3 border-2 border-black">
                            {isFullscreen ? <Minimize className="h-8 w-8" /> : <Maximize className="h-8 w-8" />}
                        </button>
                    </div>
                </div>

                <div className="text-right">
                    <h2 className="font-display font-black text-6xl text-black">
                        {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </h2>
                </div>
            </header>

            <main className="flex-1 grid grid-cols-12 gap-8 p-8 bg-gray-50">
                {/* Left: Active Patient (8 cols) */}
                <div className="col-span-8 flex flex-col gap-8 h-full">
                    {/* Active Patient Card - Deep Navy Blue Background */}
                    <div className="flex-1 bg-[#1e1b4b] border-4 border-black shadow-[16px_16px_0px_0px_#000] flex flex-col items-center justify-center relative overflow-hidden p-12">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activePatient?.id || 'empty'}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                                className="text-center flex flex-col items-center gap-8"
                            >
                                {activePatient ? (
                                    <>
                                        <span className="font-bold text-4xl text-white/80 uppercase tracking-widest mb-4">
                                            En Consultation
                                        </span>
                                        <span className="block font-display font-black text-[12rem] leading-none tracking-tighter text-white drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                                            {activePatient.name}
                                        </span>
                                        <div className="bg-white px-12 py-6 border-4 border-black shadow-[8px_8px_0px_0px_#000] mt-8">
                                            <span className="text-6xl font-black text-black uppercase">
                                                {activePatient.ticketNumber}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="font-display font-black text-[8rem] text-white uppercase leading-none tracking-tight opacity-50">
                                        EN ATTENTE
                                    </span>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right: Next & Ad (4 cols) */}
                <div className="col-span-4 flex flex-col gap-8 h-full">
                    {/* Next Patients */}
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-8 flex-1 overflow-hidden flex flex-col">
                        <h3 className="font-black text-4xl text-black mb-8 flex items-center gap-4 shrink-0 border-b-4 border-black pb-6 uppercase tracking-tight">
                            <Clock className="h-10 w-10" /> SUIVANTS
                        </h3>
                        <div className="space-y-6 overflow-y-auto pr-2">
                            {queue.slice(0, 4).map((patient, index) => (
                                <motion.div
                                    key={patient.id}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="border-4 border-black p-6 flex items-center justify-between bg-gray-50 shadow-[4px_4px_0px_0px_#000]"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold text-2xl text-gray-900 truncate max-w-[200px]">
                                            {patient.name}
                                        </span>
                                        <span className="text-sm font-bold text-gray-500 uppercase">
                                            {patient.type === 'rdv' ? 'Rendez-vous' : 'Sans RDV'}
                                        </span>
                                    </div>
                                    <span className="font-black text-4xl bg-black text-white px-4 py-2">
                                        {patient.ticketNumber}
                                    </span>
                                </motion.div>
                            ))}
                            {queue.length === 0 && (
                                <div className="text-center py-20 text-gray-400 font-black text-2xl border-4 border-dashed border-black bg-gray-50 uppercase">
                                    Aucun patient
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ad Card - Deep Navy Blue */}
                    <div className="bg-[#1e1b4b] border-4 border-black p-8 h-64 flex flex-col items-center justify-center text-center shadow-[8px_8px_0px_0px_#000] text-white shrink-0">
                        <h3 className="font-display font-black text-4xl mb-2 uppercase tracking-tight">Bienvenue</h3>
                        <p className="font-bold text-xl uppercase tracking-wide opacity-80">Cabinet Dr. Malek</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
