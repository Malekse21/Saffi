'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Calendar,
    Check,
    ChevronRight,
    Moon,
    Sun,
    Coffee,
    ArrowRight,
    Users,
    Wifi
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// --- Types ---
type ConsultationDuration = 15 | 20 | 30 | 45;
type Plan = 'digital' | 'connect';

interface OnboardingData {
    duration: ConsultationDuration | null;
    openingTime: string;
    closingTime: string;
    hasLunchBreak: boolean;
    plan: Plan | null;
}

// --- Save to Supabase ---
const saveStepData = async (data: Partial<OnboardingData>, isComplete: boolean = false) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        const updateData: any = {
            consultation_duration: data.duration,
            opening_time: data.openingTime,
            closing_time: data.closingTime,
            has_lunch_break: data.hasLunchBreak,
            clinic_id: user.user_metadata?.clinic_id, // Store clinic_id from metadata
            plan: data.plan,
        };

        // Only set onboarding_completed to true on final step
        if (isComplete) {
            updateData.onboarding_completed = true;
        }

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);

        if (error) console.error('Error saving onboarding data:', error);
    }
};

export default function OnboardingWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
    const [loading, setLoading] = useState(false);
    const [doctorName, setDoctorName] = useState('');

    const [formData, setFormData] = useState<OnboardingData>({
        duration: null,
        openingTime: '08:00',
        closingTime: '17:00',
        hasLunchBreak: true,
        plan: null,
    });

    // Get doctor name on mount
    React.useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.full_name) {
                setDoctorName(user.user_metadata.full_name);
            }
        };
        fetchUser();
    }, []);

    const nextStep = async () => {
        setLoading(true);
        // Save data but don't mark as complete yet
        await saveStepData(formData, false);
        setLoading(false);
        setDirection(1);
        setStep((prev) => prev + 1);
    };

    const completeOnboarding = async () => {
        setLoading(true);
        // Final save with onboarding_completed = true
        await saveStepData(formData, true);
        setLoading(false);
        // Redirect immediately after saving
        router.push('/dashboard');
    };

    // Progress calculation
    const progress = (step / 4) * 100;

    // Animation Variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <div className="min-h-screen w-full bg-white bg-[linear-gradient(to_right,#e0e0e0_1px,transparent_1px),linear-gradient(to_bottom,#e0e0e0_1px,transparent_1px)] bg-[size:24px_24px] flex items-center justify-center p-4 font-sans text-black">

            {/* Main Card */}
            <div className="w-full max-w-xl bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000000] relative overflow-hidden">

                {/* Progress Bar Container */}
                <div className="w-full h-4 border-b-2 border-black bg-gray-100">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="h-full bg-[#2C2B57]"
                    />
                </div>

                {/* Content Area */}
                <div className="p-8 md:p-12 min-h-[500px] flex flex-col justify-center">
                    <AnimatePresence mode='wait' custom={direction}>
                        {step === 1 && (
                            <StepDuration
                                key="step1"
                                custom={direction}
                                variants={slideVariants}
                                value={formData.duration}
                                onChange={(val: ConsultationDuration) => setFormData({ ...formData, duration: val })}
                                onNext={nextStep}
                            />
                        )}
                        {step === 2 && (
                            <StepSchedule
                                key="step2"
                                custom={direction}
                                variants={slideVariants}
                                data={formData}
                                onChange={(updates: Partial<OnboardingData>) => setFormData({ ...formData, ...updates })}
                                onNext={nextStep}
                            />
                        )}
                        {step === 3 && (
                            <StepPlan
                                key="step3"
                                custom={direction}
                                variants={slideVariants}
                                value={formData.plan}
                                onChange={(val: Plan) => setFormData({ ...formData, plan: val })}
                                onNext={nextStep}
                            />
                        )}
                        {step === 4 && (
                            <StepSuccess
                                key="step4"
                                custom={direction}
                                variants={slideVariants}
                                doctorName={doctorName || "Docteur"}
                                onComplete={completeOnboarding}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer info (Steps 1-3 only) */}
                {step < 4 && (
                    <div className="bg-gray-50 border-t-2 border-black p-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Étape {step} sur 3 • Configuration Initiale
                    </div>
                )}
            </div>
        </div>
    );
}

// --- STEP 1: DURATION ---
function StepDuration({ custom, variants, value, onChange, onNext }: any) {
    const options: { val: ConsultationDuration; label: string; desc: string }[] = [
        { val: 15, label: "15 min", desc: "Flash / Express" },
        { val: 20, label: "20 min", desc: "Standard" },
        { val: 30, label: "30 min", desc: "Spécialiste" },
        { val: 45, label: "45 min+", desc: "Psy / Chirurgie" },
    ];

    return (
        <motion.div
            custom={custom}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col gap-6"
        >
            <div className="space-y-2">
                <h2 className="font-display text-4xl font-bold tracking-tight">Le Rythme.</h2>
                <p className="text-gray-500 font-medium">Combien de temps dure une consultation en moyenne ?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {options.map((opt) => (
                    <motion.button
                        key={opt.val}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onChange(opt.val)}
                        className={`
              p-6 border-2 border-black text-left flex flex-col gap-1 transition-all
              ${value === opt.val
                                ? 'bg-black text-white shadow-[4px_4px_0px_0px_#2C2B57]'
                                : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_#000]'
                            }
            `}
                    >
                        <span className="text-2xl font-black font-display">{opt.label}</span>
                        <span className={`text-xs font-bold uppercase ${value === opt.val ? 'text-gray-200' : 'text-gray-500'}`}>
                            {opt.desc}
                        </span>
                    </motion.button>
                ))}
            </div>

            <button
                disabled={!value}
                onClick={onNext}
                className={`
          mt-4 w-full py-4 border-2 border-black font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2
          ${value ? 'bg-[#2C2B57] hover:bg-black shadow-[4px_4px_0px_0px_#000]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
        `}
            >
                Suivant <ChevronRight />
            </button>
        </motion.div>
    );
}

// --- STEP 2: SCHEDULE ---
function StepSchedule({ custom, variants, data, onChange, onNext }: any) {
    return (
        <motion.div
            custom={custom}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col gap-8"
        >
            <div className="space-y-2">
                <h2 className="font-display text-4xl font-bold tracking-tight">Vos Horaires.</h2>
                <p className="text-gray-500 font-medium">À quelle heure ouvrez-vous et fermez-vous le cabinet ?</p>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <Sun size={16} /> Ouverture
                        </label>
                        <input
                            type="time"
                            value={data.openingTime}
                            onChange={(e) => onChange({ openingTime: e.target.value })}
                            className="w-full p-3 bg-white border-2 border-black font-mono text-xl focus:outline-none focus:bg-gray-100 shadow-[4px_4px_0px_0px_#000]"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <Moon size={16} /> Fermeture
                        </label>
                        <input
                            type="time"
                            value={data.closingTime}
                            onChange={(e) => onChange({ closingTime: e.target.value })}
                            className="w-full p-3 bg-white border-2 border-black font-mono text-xl focus:outline-none focus:bg-gray-100 shadow-[4px_4px_0px_0px_#000]"
                        />
                    </div>
                </div>

                {/* Lunch Toggle */}
                <div
                    onClick={() => onChange({ hasLunchBreak: !data.hasLunchBreak })}
                    className="cursor-pointer border-2 border-black p-4 flex items-center justify-between bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_#000]"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 border-2 border-black ${data.hasLunchBreak ? 'bg-[#2C2B57]' : 'bg-gray-200'}`}>
                            <Coffee size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Pause Déjeuner ?</p>
                            <p className="text-xs text-gray-500">Fermer la file entre 12h et 14h</p>
                        </div>
                    </div>
                    <div className={`w-14 h-8 border-2 border-black rounded-full flex items-center px-1 transition-colors ${data.hasLunchBreak ? 'bg-black' : 'bg-gray-200'}`}>
                        <motion.div
                            layout
                            className={`w-5 h-5 border-2 border-black rounded-full ${data.hasLunchBreak ? 'bg-[#2C2B57]' : 'bg-white'}`}
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={onNext}
                className="mt-2 w-full py-4 bg-[#2C2B57] border-2 border-black font-bold text-lg uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:bg-black flex items-center justify-center gap-2"
            >
                Suivant <ChevronRight />
            </button>
        </motion.div>
    );
}


// --- STEP 3: Plan ---
function StepPlan({ custom, variants, value, onChange, onNext }: any) {
    const options: { val: Plan; label: string; desc: string, icon: any }[] = [
        { val: 'digital', label: "Digital", desc: "QR Code & File d'attente", icon: <Users size={24} /> },
        { val: 'connect', label: "Connect", desc: "TV & Annonces vocales", icon: <Wifi size={24} /> },
    ];

    return (
        <motion.div
            custom={custom}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col gap-6"
        >
            <div className="space-y-2">
                <h2 className="font-display text-4xl font-bold tracking-tight">Votre Plan.</h2>
                <p className="text-gray-500 font-medium">Choisissez le plan qui vous convient.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {options.map((opt) => (
                    <motion.button
                        key={opt.val}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onChange(opt.val)}
                        className={`
              p-6 border-2 border-black text-left flex flex-col gap-2 transition-all
              ${value === opt.val
                                ? 'bg-black text-white shadow-[4px_4px_0px_0px_#2C2B57]'
                                : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_#000]'
                            }
            `}
                    >
                        <div className={`p-2 border-2 border-black w-fit ${value === opt.val ? 'bg-[#2C2B57] text-white' : 'bg-gray-200'}`}>
                            {opt.icon}
                        </div>
                        <span className="text-2xl font-black font-display">{opt.label}</span>
                        <span className={`text-xs font-bold uppercase ${value === opt.val ? 'text-gray-200' : 'text-gray-500'}`}>
                            {opt.desc}
                        </span>
                    </motion.button>
                ))}
            </div>

            <button
                disabled={!value}
                onClick={onNext}
                className={`
          mt-4 w-full py-4 border-2 border-black font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2
          ${value ? 'bg-[#2C2B57] hover:bg-black shadow-[4px_4px_0px_0px_#000]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
        `}
            >
                Suivant <ChevronRight />
            </button>
        </motion.div>
    );
}


// --- STEP 4: SUCCESS ---
function StepSuccess({ custom, variants, doctorName, onComplete }: any) {
    const qrValue = `https://saffi.tn/join/${doctorName.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <motion.div
            custom={custom}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center text-center gap-6"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-[#2C2B57] border-2 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_#000] mb-2"
            >
                <Check className="text-white" size={40} strokeWidth={4} />
            </motion.div>

            <div className="space-y-2">
                <h2 className="font-display text-4xl font-black tracking-tight">C&apos;est prêt, Docteur !</h2>
                <p className="text-gray-500 font-medium">Votre salle d&apos;attente virtuelle est active.</p>
            </div>

            {/* The Generated QR */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-4 border-2 border-black shadow-[8px_8px_0px_0px_#000] rotate-1"
            >
                <QRCodeSVG value={qrValue} size={150} />
                <p className="mt-2 text-xs font-mono font-bold uppercase">Scan Me</p>
            </motion.div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 w-full py-4 bg-[#2C2B57] border-2 border-black font-bold text-lg text-white uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:bg-black flex items-center justify-center gap-2"
                onClick={onComplete}
            >
                Accéder au Dashboard <ArrowRight strokeWidth={3} />
            </motion.button>
        </motion.div>
    );
}