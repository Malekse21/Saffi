"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings as SettingsIcon,
    Zap,
    Clock,
    Bell,
    Tv,
    CreditCard,
    Calendar,
    MessageSquare,
    Volume2,
    Save,
    CheckCircle2,
    Globe,
    Timer,
    FileText,
    Download,
    CreditCard as CardIcon,
    TrendingUp,
    Users,
    Wifi
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useDashboard } from "../layout";

// TypeScript Interface
interface SettingsData {
    // General & Schedule
    clinic_display_name: string;
    avg_consultation_duration: number;
    opening_time: string;
    closing_time: string;
    auto_close_queue: boolean;
    closed_queue_message: string;
    primary_color: string;

    // Queue Algorithm
    delay_mode_minutes: number;

    // TV & Announcements
    announcement_style: 'number_only' | 'number_name' | 'silence';
    announcement_language: 'fr' | 'ar';
    announcement_volume: number;

    // Billing
    subscription_plan: 'digital' | 'connect';
    subscription_status: 'active' | 'cancelled' | 'expired';
    sms_balance: number;
}

interface Invoice {
    id: string;
    invoice_number: string;
    amount: number;
    currency: string;
    description: string;
    payment_method: string;
    status: string;
    pdf_url: string;
    created_at: string;
}

// Custom Toggle Switch Component
interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

const ToggleSwitch = ({ checked, onChange, disabled = false }: ToggleSwitchProps) => {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`
                relative w-14 h-8 border-2 border-black rounded-full transition-all
                ${checked ? 'bg-[#10B981]' : 'bg-gray-200'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-[2px_2px_0px_0px_#000]'}
            `}
        >
            <motion.div
                className="absolute top-0.5 w-6 h-6 bg-black rounded-full border border-white"
                animate={{
                    left: checked ? '24px' : '2px'
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        </button>
    );
};

// Tab Button Component
interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const TabButton = ({ active, onClick, icon, label }: TabButtonProps) => {
    return (
        <button
            onClick={onClick}
            className={`
                px-6 py-3 font-black uppercase tracking-wider text-sm border-2 border-black transition-all flex items-center gap-2
                ${active
                    ? 'bg-[#2C2B57] text-white shadow-[4px_4px_0px_0px_#000]'
                    : 'bg-white hover:bg-gray-50'
                }
            `}
        >
            {icon}
            {label}
        </button>
    );
};

// Plan Selector Component
const PlanSelector = ({ value, onChange }: { value: 'digital' | 'connect', onChange: (plan: 'digital' | 'connect') => void }) => {
    const plans = [
        { id: 'digital', name: 'Digital', description: "QR Code & File d'attente", icon: <Users size={20} /> },
        { id: 'connect', name: 'Connect', description: 'TV & Annonces vocales', icon: <Wifi size={20} /> }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => (
                <button
                    key={plan.id}
                    type="button"
                    onClick={() => onChange(plan.id as 'digital' | 'connect')}
                    className={`p-6 border-2 border-black text-left transition-all ${value === plan.id ? 'bg-black text-white shadow-[4px_4px_0px_0px_#FACC15]' : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_#000]'}`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 border-2 border-black w-fit ${value === plan.id ? 'bg-[#FACC15] text-black' : 'bg-gray-200'}`}>
                            {plan.icon}
                        </div>
                        <h3 className="font-display font-black text-2xl">{plan.name}</h3>
                    </div>

                    <p className={`text-sm font-bold uppercase ${value === plan.id ? 'text-gray-400' : 'text-gray-500'}`}>{plan.description}</p>
                </button>
            ))}
        </div>
    );
};


export default function SettingsPage() {
    const { setClinicName, setPrimaryColor } = useDashboard();
    const [activeTab, setActiveTab] = useState<'general' | 'queue' | 'tv' | 'billing'>('general');
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const { register, handleSubmit, watch, setValue, formState: { isDirty } } = useForm<SettingsData>({
        defaultValues: {
            clinic_display_name: 'Cabinet Médical',
            avg_consultation_duration: 20,
            opening_time: '08:00',
            closing_time: '17:00',
            auto_close_queue: true,
            closed_queue_message: "Le cabinet ne prend plus de patients aujourd'hui. Revenez demain à 08h00.",
            primary_color: '#2C2B57',
            delay_mode_minutes: 0,
            announcement_style: 'number_only',
            announcement_language: 'fr',
            announcement_volume: 80,
            subscription_plan: 'digital',
            subscription_status: 'active',
            sms_balance: 0
        }
    });

    // Watch values
    const autoCloseQueue = watch('auto_close_queue');
    const primaryColor = watch('primary_color');
    const delayModeMinutes = watch('delay_mode_minutes');
    const announcementVolume = watch('announcement_volume');
    const subscriptionPlan = watch('subscription_plan');


    // Load settings on mount
    useEffect(() => {
        loadSettings();
        loadInvoices();
    }, []);

    const loadSettings = async () => {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);

        const { data, error } = await supabase
            .from('queue_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error loading settings:', error);
            if (error.code === 'PGRST116') {
                await supabase
                    .from('queue_settings')
                    .insert({
                        user_id: user.id,
                        clinic_display_name: 'Cabinet Médical',
                        avg_consultation_duration: 20,
                        opening_time: '08:00:00',
                        closing_time: '17:00:00',
                        auto_close_queue: true,
                        closed_queue_message: "Le cabinet ne prend plus de patients aujourd'hui. Revenez demain à 08h00.",
                        primary_color: '#2C2B57',
                        delay_mode_minutes: 0,
                        announcement_style: 'number_only',
                        announcement_language: 'fr',
                        announcement_volume: 80,
                        subscription_plan: 'digital',
                        subscription_status: 'active',
                        sms_balance: 0
                    });
            }
            return;
        }

        if (data) {
            setValue('clinic_display_name', data.clinic_display_name || 'Cabinet Médical');
            setValue('avg_consultation_duration', data.avg_consultation_duration || 20);
            setValue('opening_time', data.opening_time?.substring(0, 5) || '08:00');
            setValue('closing_time', data.closing_time?.substring(0, 5) || '17:00');
            setValue('auto_close_queue', data.auto_close_queue ?? true);
            setValue('closed_queue_message', data.closed_queue_message || "Le cabinet ne prend plus de patients aujourd'hui. Revenez demain à 08h00.");
            setValue('primary_color', data.primary_color || '#2C2B57');
            setValue('delay_mode_minutes', data.delay_mode_minutes || 0);
            setValue('announcement_style', data.announcement_style || 'number_only');
            setValue('announcement_language', data.announcement_language || 'fr');
            setValue('announcement_volume', data.announcement_volume || 80);
            setValue('subscription_plan', data.subscription_plan || 'digital');
            setValue('subscription_status', data.subscription_status || 'active');
            setValue('sms_balance', data.sms_balance || 0);
        }
    };

    const loadInvoices = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setInvoices(data as Invoice[]);
        }
    };

    const onSubmit = async (data: SettingsData) => {
        if (!userId) return;

        setIsSaving(true);
        const supabase = createClient();

        const { error } = await supabase
            .from('queue_settings')
            .update({
                clinic_display_name: data.clinic_display_name,
                avg_consultation_duration: data.avg_consultation_duration,
                opening_time: data.opening_time + ':00',
                closing_time: data.closing_time + ':00',
                auto_close_queue: data.auto_close_queue,
                closed_queue_message: data.closed_queue_message,
                primary_color: data.primary_color,
                delay_mode_minutes: data.delay_mode_minutes,
                announcement_style: data.announcement_style,
                announcement_language: data.announcement_language,
                announcement_volume: data.announcement_volume,
                subscription_plan: data.subscription_plan,
                subscription_status: data.subscription_status,
                sms_balance: data.sms_balance
            })
            .eq('user_id', userId);

        setIsSaving(false);

        if (error) {
            console.error("Error saving settings. Message: ", error.message, "Full error: ", error);
            toast.error(`Erreur lors de l'enregistrement: ${error.message || 'Une erreur inconnue est survenue.'}`);
        } else {
            // Update dashboard context with new clinic name
            setClinicName(data.clinic_display_name);
            if (setPrimaryColor) {
                setPrimaryColor(data.primary_color);
            }

            setShowSuccessMessage(true);
            toast.success('Paramètres enregistrés avec succès !');
            setTimeout(() => setShowSuccessMessage(false), 3000);
            loadSettings();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
                <div className="flex items-center gap-3">
                    <SettingsIcon className="h-8 w-8" />
                    <h1 className="font-display font-black text-3xl uppercase tracking-tight">Paramètres</h1>
                </div>
                <p className="text-gray-600 mt-2">Gérez les préférences de votre cabinet</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <TabButton
                    active={activeTab === 'general'}
                    onClick={() => setActiveTab('general')}
                    icon={<Clock className="h-5 w-5" />}
                    label="Général & Horaires"
                />
                <TabButton
                    active={activeTab === 'queue'}
                    onClick={() => setActiveTab('queue')}
                    icon={<Timer className="h-5 w-5" />}
                    label="La File & Algorithme"
                />
                <TabButton
                    active={activeTab === 'tv'}
                    onClick={() => setActiveTab('tv')}
                    icon={<Tv className="h-5 w-5" />}
                    label="TV & Annonces"
                />
                <TabButton
                    active={activeTab === 'billing'}
                    onClick={() => setActiveTab('billing')}
                    icon={<CreditCard className="h-5 w-5" />}
                    label="Facturation & SMS"
                />
            </div>

            {/* Tab Content */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <AnimatePresence mode="wait">
                    {/* General & Schedule Tab */}
                    {activeTab === 'general' && (
                        <motion.div
                            key="general"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_#000] space-y-6"
                        >
                            <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6">
                                Général & Horaires
                            </h2>

                            {/* Clinic Name */}
                            <div className="p-6 bg-gray-50 border-2 border-black space-y-3">
                                <label className="flex items-center gap-2 font-bold text-lg">
                                    <FileText className="h-5 w-5 text-[var(--color-primary)]" />
                                    Nom du Cabinet (Affichage TV)
                                </label>
                                <input
                                    type="text"
                                    {...register('clinic_display_name')}
                                    className="w-full p-3 border-2 border-black font-bold text-lg focus:outline-none focus:bg-[#2C2B57]/5"
                                    placeholder="Cabinet Dr. Ben Ali"
                                />
                                <p className="text-sm text-gray-600">
                                    Ce nom s'affiche sur l'écran TV et sur le ticket mobile du patient.
                                </p>
                            </div>

                            {/* Average Consultation Duration */}
                            <div className="p-6 bg-gray-50 border-2 border-black space-y-3">
                                <label className="flex items-center gap-2 font-bold text-lg">
                                    <Timer className="h-5 w-5 text-[var(--color-primary)]" />
                                    Durée Moyenne de Consultation
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        min="5"
                                        max="120"
                                        {...register('avg_consultation_duration', { setValueAs: (v) => (v === "" ? null : parseInt(v, 10)) })}
                                        className="w-32 p-3 border-2 border-black font-bold text-2xl text-center focus:outline-none focus:bg-[#2C2B57]/5"
                                    />
                                    <span className="font-bold text-lg">minutes</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Le "Magic Number" utilisé pour calculer le temps d'attente estimé pour chaque patient.
                                </p>
                            </div>

                            {/* Opening Hours */}
                            <div className="p-6 bg-gray-50 border-2 border-black space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 font-bold text-lg">
                                        <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
                                        Horaires d'Ouverture
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold">Fermeture Automatique</span>
                                        <ToggleSwitch
                                            checked={autoCloseQueue}
                                            onChange={(checked) => setValue('auto_close_queue', checked, { shouldDirty: true })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Heure d'Ouverture</label>
                                        <input
                                            type="time"
                                            {...register('opening_time')}
                                            className="w-full p-3 border-2 border-black font-bold text-lg focus:outline-none focus:bg-[#2C2B57]/5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Heure de Fermeture</label>
                                        <input
                                            type="time"
                                            {...register('closing_time')}
                                            className="w-full p-3 border-2 border-black font-bold text-lg focus:outline-none focus:bg-[#2C2B57]/5"
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Empêche les patients de scanner le QR code en dehors des heures d'ouverture.
                                </p>
                            </div>

                            {/* Closed Queue Message */}
                            <div className="p-6 bg-gray-50 border-2 border-black space-y-3">
                                <label className="flex items-center gap-2 font-bold text-lg">
                                    <Bell className="h-5 w-5 text-[var(--color-primary)]" />
                                    Message de "File Fermée"
                                </label>
                                <textarea
                                    {...register('closed_queue_message')}
                                    rows={3}
                                    className="w-full p-3 border-2 border-black focus:outline-none focus:bg-[#2C2B57]/5"
                                    placeholder="Le cabinet ne prend plus de patients aujourd'hui..."
                                />
                                <p className="text-sm text-gray-600">
                                    Message affiché aux patients qui tentent de rejoindre la file en dehors des heures.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Queue Algorithm Tab */}
                    {activeTab === 'queue' && (
                        <motion.div
                            key="queue"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_#000]"
                        >
                            <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6">
                                La File & Algorithme
                            </h2>

                            {/* Delay Mode */}
                            <div className="p-6 bg-gradient-to-br from-orange-100 to-orange-50 border-2 border-black space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="flex items-center gap-2 font-bold text-xl">
                                            <Clock className="h-6 w-6 text-orange-600" />
                                            Mode "Retard" (The Panic Button)
                                        </label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Le docteur est arrivé en retard ? Ajoutez du temps à l'attente estimée pour tous les patients.
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-display font-black text-orange-600">
                                            +{delayModeMinutes} min
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="60"
                                        step="5"
                                        {...register('delay_mode_minutes')}
                                        onChange={(e) => setValue('delay_mode_minutes', parseInt(e.target.value), { shouldDirty: true })}
                                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer border-2 border-black"
                                        style={{
                                            background: `linear-gradient(to right, #fb923c 0%, #fb923c ${(delayModeMinutes / 60) * 100}%, #e5e7eb ${(delayModeMinutes / 60) * 100}%, #e5e7eb 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-xs font-bold text-gray-500">
                                        <span>0 min</span>
                                        <span>15 min</span>
                                        <span>30 min</span>
                                        <span>45 min</span>
                                        <span>60 min</span>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-black p-4">
                                    <p className="text-sm font-bold">
                                        💡 Scénario: Le docteur arrive 30 minutes en retard.
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Glissez le curseur à +30 min pour ajouter instantanément 30 minutes à tous les temps d'attente estimés.
                                        Les patients ne seront pas frustrés de voir leur heure de passage dépasser !
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TV & Announcements Tab */}
                    {activeTab === 'tv' && (
                        <motion.div
                            key="tv"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_#000] space-y-6"
                        >
                            <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6">
                                TV & Annonces
                            </h2>

                            {/* Announcement Style */}
                            <div className="p-6 bg-gray-50 border-2 border-black space-y-3">
                                <label className="flex items-center gap-2 font-bold text-lg">
                                    <Volume2 className="h-5 w-5 text-[var(--color-primary)]" />
                                    Style d'Annonce Vocale
                                </label>
                                <select
                                    {...register('announcement_style')}
                                    className="w-full p-3 border-2 border-black font-bold text-lg focus:outline-none focus:bg-[#2C2B57]/5"
                                >
                                    <option value="number_only">Numéro Uniquement (Meilleur pour Confidentialité)</option>
                                    <option value="number_name">Numéro + Nom</option>
                                    <option value="silence">Silence (Son de Cloche Uniquement)</option>
                                </select>
                                <div className="bg-blue-50 border-2 border-black p-3 text-sm">
                                    <p className="font-bold">Exemples:</p>
                                    <ul className="mt-2 space-y-1 text-gray-700">
                                        <li>• Numéro Uniquement: "Numéro 15, au cabinet"</li>
                                        <li>• Numéro + Nom: "Numéro 15, Ahmed Ben Ali"</li>
                                        <li>• Silence: 🔔 (Son de cloche uniquement)</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Volume Control */}
                            <div className="p-6 bg-gray-50 border-2 border-black space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 font-bold text-lg">
                                        <Volume2 className="h-5 w-5 text-[var(--color-primary)]" />
                                        Volume de l'Annonce
                                    </label>
                                    <div className="text-2xl font-display font-black text-[var(--color-primary)]">
                                        {announcementVolume}%
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="10"
                                    {...register('announcement_volume')}
                                    onChange={(e) => setValue('announcement_volume', parseInt(e.target.value), { shouldDirty: true })}
                                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer border-2 border-black"
                                    style={{
                                        background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${announcementVolume}%, #e5e7eb ${announcementVolume}%, #e5e7eb 100%)`
                                    }}
                                />
                            </div>

                            {/* Language */}
                            <div className="p-6 bg-gray-50 border-2 border-black space-y-3">
                                <label className="flex items-center gap-2 font-bold text-lg">
                                    <Globe className="h-5 w-5 text-[var(--color-primary)]" />
                                    Langue de l'Annonce
                                </label>
                                <select
                                    {...register('announcement_language')}
                                    className="w-full p-3 border-2 border-black font-bold text-lg focus:outline-none focus:bg-[#2C2B57]/5"
                                >
                                    <option value="fr">🇫🇷 Français</option>
                                    <option value="ar">🇹🇳 Arabe (Expérimental)</option>
                                </select>
                                <p className="text-sm text-gray-600">
                                    Support de l'arabe dépend du navigateur et de la synthèse vocale disponible.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Billing & SMS Tab */}
                    {activeTab === 'billing' && (
                        <motion.div
                            key="billing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_#000] space-y-6"
                        >
                            <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6">
                                Facturation & SMS
                            </h2>

                            {/* Subscription Plan */}
                            <div className="p-6 bg-gray-50 border-2 border-black space-y-4">
                                <label className="flex items-center gap-2 font-bold text-lg">
                                    <CardIcon className="h-5 w-5 text-[var(--color-primary)]" />
                                    Mon Abonnement
                                </label>
                                <PlanSelector
                                    value={subscriptionPlan}
                                    onChange={(plan) => setValue('subscription_plan', plan, { shouldDirty: true })}
                                />
                                <p className="text-sm text-gray-600">
                                    Le changement de plan prendra effet immédiatement.
                                </p>
                            </div>




                            {/* Payment History */}
                            <div className="border-2 border-black">
                                <div className="bg-gray-100 border-b-2 border-black p-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Historique des Paiements
                                    </h3>
                                </div>
                                <div className="divide-y-2 divide-black">
                                    {invoices.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p className="font-bold">Aucune facture</p>
                                            <p className="text-sm">Vos factures apparaîtront ici</p>
                                        </div>
                                    ) : (
                                        invoices.map((invoice) => (
                                            <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-bold">{invoice.description}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {invoice.invoice_number} • {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="font-display font-black text-xl">
                                                                {invoice.amount.toFixed(2)} {invoice.currency}
                                                            </p>
                                                            <p className="text-xs text-green-600 font-bold uppercase">
                                                                {invoice.status}
                                                            </p>
                                                        </div>
                                                        {invoice.pdf_url && (
                                                            <a
                                                                href={invoice.pdf_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-black text-white p-2 border-2 border-black hover:bg-gray-800 transition-all"
                                                            >
                                                                <Download className="h-5 w-5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Save Button */}
                <AnimatePresence>
                    {isDirty && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="fixed bottom-8 right-8 z-50"
                        >
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-[#2C2B57] text-white px-8 py-4 font-black uppercase tracking-wider text-lg border-2 border-black shadow-[8px_8px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center gap-3 transition-all disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-6 w-6" />
                                        Enregistrer
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success Message */}
                <AnimatePresence>
                    {showSuccessMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-8 right-8 z-50 bg-green-500 text-white px-6 py-4 border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center gap-3"
                        >
                            <CheckCircle2 className="h-6 w-6" />
                            <span className="font-bold">Paramètres enregistrés !</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
}
