"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Maximize, Minimize, Volume2, VolumeX, Cast } from "lucide-react";
import { cn } from "@/lib/utils";
import { Patient } from "@/components/PatientCard";

export default function TVPage() {
    const [activePatient, setActivePatient] = useState<Patient | null>(null);
    const [queue, setQueue] = useState<Patient[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isAnnounceEnabled, setIsAnnounceEnabled] = useState(true);
    const isAnnounceEnabledRef = useRef(true); // Ref for immediate access in timeouts
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [clinicName, setClinicName] = useState("");

    // Audio Context Ref
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize Audio Context
    const initAudio = () => {
        if (typeof window !== 'undefined') {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext && !audioContextRef.current) {
                audioContextRef.current = new AudioContext();
                console.log("Audio context created");
            }
            if (audioContextRef.current?.state === 'suspended' && isAnnounceEnabledRef.current) {
                audioContextRef.current.resume();
                console.log("Audio context resumed");
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
        // Open a new window for casting/presentation
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

    // Listen for fullscreen change events (e.g. user presses Esc)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const announcePatient = (ticketNumber: string) => {
        if (!isAnnounceEnabledRef.current) {
            console.log("Announcement disabled");
            return;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(`Numéro ${ticketNumber}, c'est votre tour`);
            utterance.lang = 'fr-FR';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
            console.log("Speaking:", ticketNumber);
        }
    };

    const playFallbackSoundWithTicket = (ticketNumber: string) => {
        if (!isAnnounceEnabledRef.current) return;

        const ctx = audioContextRef.current;
        if (!ctx) {
            console.log("Audio context not initialized for fallback");
            return;
        }

        console.log("Playing fallback sound for ticket:", ticketNumber);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // "Ding-Dong" sound effect
        osc.type = 'sine';

        // First note (E5)
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        // Second note (C5) - delayed
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.4);
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.setValueAtTime(0.5, ctx.currentTime + 0.4);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);

        osc2.start(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 1.2);

        // Announce after fallback sound (approx 1.2s)
        setTimeout(() => announcePatient(ticketNumber), 1500);
    };

    const playNotificationSoundWithTicket = (ticketNumber: string) => {
        if (!isAnnounceEnabledRef.current) {
            console.log("Announcement disabled, skipping sound");
            return;
        }
        console.log("=== Attempting to play notification sound for ticket:", ticketNumber);

        // Ensure audio context is initialized and resumed
        if (!audioContextRef.current) {
            console.log("Initializing audio context...");
            initAudio();
        }

        if (audioContextRef.current?.state === 'suspended' && isAnnounceEnabledRef.current) {
            console.log("Resuming audio context...");
            audioContextRef.current.resume();
        }

        try {
            const audio = new Audio('/sounds/announce.mp3');
            audio.onended = () => {
                console.log("Custom sound ended, announcing...");
                if (isAnnounceEnabledRef.current) {
                    setTimeout(() => announcePatient(ticketNumber), 500);
                }
            };
            audio.onerror = (e) => {
                console.log("Custom sound error, using fallback:", e);
                playFallbackSoundWithTicket(ticketNumber);
            };
            audio.play().catch(e => {
                console.error("Audio play failed, using fallback:", e);
                playFallbackSoundWithTicket(ticketNumber);
            });
        } catch (e) {
            console.error("Audio setup failed, using fallback:", e);
            playFallbackSoundWithTicket(ticketNumber);
        }
    };

    // Sync State
    useEffect(() => {
        const syncState = () => {
            const data = localStorage.getItem('saffi_queue_state');
            if (data) {
                const parsed = JSON.parse(data);

                // Get the NEXT patient (first in queue), not the active one
                const nextPatient = parsed.queue?.[0] || null;

                // Check if next patient changed to trigger sound and announcement
                setActivePatient(prev => {
                    if (nextPatient?.id !== prev?.id && nextPatient) {
                        console.log("=== Patient changed from", prev?.ticketNumber, "to", nextPatient.ticketNumber);
                        // Play sound with ticket number
                        playNotificationSoundWithTicket(nextPatient.ticketNumber);
                    }
                    return nextPatient;
                });
                setQueue(parsed.queue?.slice(1) || []); // Show remaining queue (excluding the displayed one)
                if (parsed.clinicName) {
                    setClinicName(parsed.clinicName);
                }
            }
        };

        // Initial sync
        syncState();

        // Poll every 500ms
        const interval = setInterval(syncState, 500);
        window.addEventListener('storage', syncState);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', syncState);
        };
    }, []); // Empty dependency array to avoid re-binding

    // Time update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-initialize audio on first click anywhere
    useEffect(() => {
        const handleInteraction = () => {
            console.log("User interaction detected, initializing audio");
            initAudio();
            window.removeEventListener('click', handleInteraction);
        };
        window.addEventListener('click', handleInteraction);
        return () => window.removeEventListener('click', handleInteraction);
    }, []);

    // Calculate minutes until appointment or estimate based on queue position
    const getMinutesUntil = (rdvTime?: string, queuePosition: number = 0) => {
        if (rdvTime) {
            const now = new Date();
            const [hours, minutes] = rdvTime.split(':').map(Number);
            const rdv = new Date();
            rdv.setHours(hours, minutes, 0, 0);

            const diffMs = rdv.getTime() - now.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            return diffMins > 0 ? diffMins : 0;
        }

        // If no rdvTime, estimate based on queue position (5 min per patient)
        return (queuePosition + 1) * 5;
    };

    const toggleMute = () => {
        const newState = !isAnnounceEnabled;
        setIsAnnounceEnabled(newState);
        isAnnounceEnabledRef.current = newState;

        if (!newState) {
            // Immediately stop any ongoing speech
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            // Suspend audio context to stop any ongoing sounds
            if (audioContextRef.current?.state === 'running') {
                audioContextRef.current.suspend();
            }
        } else {
            // Resume audio context if enabling
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        }
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans flex flex-col">
            {/* Header */}
            <header className="h-32 bg-white border-b-4 border-black flex items-center justify-between px-12 shrink-0">
                <div className="flex items-center gap-8">
                    <span className="font-display font-black text-6xl tracking-tighter uppercase text-black">{clinicName}</span>

                    {/* Controls */}
                    <div className="flex items-center gap-2 bg-gray-50 border-2 border-black p-2">
                        <button
                            onClick={toggleMute}
                            className={cn(
                                "p-3 border-2 border-black transition-all font-black uppercase",
                                isAnnounceEnabled ? "bg-black text-white shadow-[4px_4px_0px_0px_#000]" : "bg-white text-black hover:translate-x-[2px] hover:translate-y-[2px]"
                            )}
                            title={isAnnounceEnabled ? "Désactiver l'annonce vocale" : "Activer l'annonce vocale"}
                        >
                            {isAnnounceEnabled ? <Volume2 className="h-8 w-8" /> : <VolumeX className="h-8 w-8" />}
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-3 bg-white text-black border-2 border-black hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                        >
                            {isFullscreen ? <Minimize className="h-8 w-8" /> : <Maximize className="h-8 w-8" />}
                        </button>
                        <button
                            onClick={handleCast}
                            className="p-3 bg-white text-black border-2 border-black hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            title="Ouvrir dans une nouvelle fenêtre (Caster)"
                        >
                            <Cast className="h-8 w-8" />
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
                    <div className="flex-1 bg-[#6B72FF] border-4 border-black shadow-[16px_16px_0px_0px_#000] flex flex-col items-center justify-center relative overflow-hidden p-12">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activePatient?.id || 'empty'}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="text-center flex flex-col items-center gap-8"
                            >
                                {activePatient ? (
                                    <>
                                        <span className="block font-display font-black text-[25rem] leading-none tracking-tighter text-white drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                                            {activePatient.ticketNumber}
                                        </span>
                                        <div className="bg-white px-12 py-6 border-4 border-black shadow-[8px_8px_0px_0px_#000]">
                                            <span className="text-5xl font-black text-black uppercase">
                                                Dans {getMinutesUntil(activePatient.rdvTime, 0)} min
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="font-display font-black text-[12rem] text-white uppercase leading-none tracking-tight">
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
                            {queue.slice(0, 3).map((patient, index) => {
                                const minutesUntil = getMinutesUntil(patient.rdvTime, index + 1);
                                const isImminent = minutesUntil > 0 && minutesUntil <= 5;

                                return (
                                    <motion.div
                                        key={patient.id}
                                        className={cn(
                                            "border-4 border-black p-8 flex items-center justify-between transition-all",
                                            isImminent && index === 0
                                                ? "bg-[#2C2B57] shadow-[6px_6px_0px_0px_#000]"
                                                : "bg-gray-50 shadow-[4px_4px_0px_0px_#000]"
                                        )}
                                        animate={isImminent && index === 0 ? {
                                            y: [-2, 2, -2]
                                        } : {}}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        <span className={cn(
                                            "font-display font-black text-6xl",
                                            isImminent && index === 0 && "text-white"
                                        )}>
                                            {patient.ticketNumber}
                                        </span>
                                        <span className={cn(
                                            "font-mono font-black text-3xl uppercase",
                                            isImminent && index === 0 ? "text-white" : "text-black"
                                        )}>
                                            {minutesUntil} min
                                        </span>
                                    </motion.div>
                                );
                            })}
                            {queue.length === 0 && (
                                <div className="text-center py-20 text-gray-400 font-black text-2xl border-4 border-dashed border-black bg-gray-50 uppercase">
                                    Aucun patient
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ad Card */}
                    <div className="bg-[#2C2B57] border-4 border-black p-8 h-72 flex flex-col items-center justify-center text-center shadow-[8px_8px_0px_0px_#000] text-white shrink-0">
                        <h3 className="font-display font-black text-5xl mb-4 uppercase tracking-tight">PUBLICITÉ</h3>
                        <p className="font-bold text-3xl uppercase tracking-wide">Votre message ici</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
