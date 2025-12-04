'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Zap, Check, CreditCard } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// The Pricing Configuration
const smsPacks = [
    {
        id: 'starter',
        name: 'Dépannage',
        count: 100,
        price: 10,
        description: 'Pour les urgences.',
        bg: 'bg-white',
        badge: null
    },
    {
        id: 'standard',
        name: 'Confort',
        count: 300,
        price: 25,
        description: 'Le choix équilibré.',
        bg: 'bg-[#FDFBF7]', // Slightly off-white
        badge: 'Recommandé',
        highlight: true // Special border color or effect
    },
    {
        id: 'business',
        name: 'Business',
        count: 600,
        price: 45,
        description: 'Pour la haute saison.',
        bg: 'bg-white',
        badge: 'Meilleur Prix'
    }
];

export default function SMSRecharge() {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchBalance = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('sms_balance')
                    .eq('id', user.id)
                    .single();
                if (data) setBalance(data.sms_balance || 0);
            }
        };
        fetchBalance();
    }, []);

    const handleBuy = (packId: string, count: number) => {
        setLoading(packId);

        // Simulate Payment API Call (Konnect/Flouci)
        setTimeout(async () => {
            // Optimistic update
            setBalance(prev => prev + count);

            // Update in DB (Mocking the backend payment webhook)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.rpc('increment_sms_balance', {
                    user_id: user.id,
                    amount: count
                });
            }

            setLoading(null);
            alert(`Paiement réussi ! +${count} SMS ajoutés.`);
        }, 1500);
    };

    return (
        <div className="space-y-8 font-sans">

            {/* 1. CURRENT BALANCE CARD */}
            <div className="relative overflow-hidden bg-black text-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_#94A3B8] rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-white text-black border-2 border-white rounded-lg">
                        <MessageCircle size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Solde SMS Actuel</h3>
                        <p className="text-4xl font-black font-display tracking-tight text-white">
                            {balance} <span className="text-lg text-gray-400 font-medium">unités</span>
                        </p>
                    </div>
                </div>

                <div className="relative z-10 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-300">
                        1 SMS = 1 Rappel Patient
                    </p>
                </div>
            </div>

            {/* 2. RECHARGE PACKS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {smsPacks.map((pack) => (
                    <div
                        key={pack.id}
                        className={`
              relative flex flex-col p-6 border-2 border-black rounded-xl
              transition-all duration-200 hover:-translate-y-1
              ${pack.highlight ? 'shadow-[8px_8px_0px_0px_#6366F1]' : 'shadow-[4px_4px_0px_0px_#000]'}
              ${pack.bg}
            `}
                    >
                        {/* Badge */}
                        {pack.badge && (
                            <div className={`
                absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-black uppercase tracking-wider border-2 border-black
                ${pack.highlight ? 'bg-[#6366F1] text-white' : 'bg-[#FACC15] text-black'}
              `}>
                                {pack.badge}
                            </div>
                        )}

                        {/* Header */}
                        <div className="text-center mb-4 mt-2">
                            <h4 className="text-lg font-bold text-gray-900">{pack.name}</h4>
                            <div className="flex justify-center items-baseline gap-1 mt-2">
                                <span className="text-4xl font-black font-display">{pack.count}</span>
                                <span className="text-sm font-bold text-gray-500 uppercase">SMS</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-200 w-full mb-4" />

                        {/* Price & Description */}
                        <div className="flex-1 flex flex-col items-center justify-center space-y-2 mb-6">
                            <p className="text-3xl font-black text-green-600 font-display">
                                {pack.price} <span className="text-sm text-black">TND</span>
                            </p>
                            <p className="text-xs text-center text-gray-500 font-medium">
                                {pack.description}
                            </p>
                            <p className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                {(pack.price / pack.count).toFixed(3)} TND / unité
                            </p>
                        </div>

                        {/* Button */}
                        <button
                            onClick={() => handleBuy(pack.id, pack.count)}
                            disabled={loading !== null}
                            className={`
                w-full py-3 border-2 border-black font-bold uppercase tracking-wider flex items-center justify-center gap-2
                active:translate-y-1 active:shadow-none transition-all
                ${pack.highlight
                                    ? 'bg-black text-white hover:bg-gray-900'
                                    : 'bg-white text-black hover:bg-gray-50'
                                }
              `}
                        >
                            {loading === pack.id ? (
                                <span className="animate-pulse">Traitement...</span>
                            ) : (
                                <>
                                    <Zap size={16} fill="currentColor" />
                                    Recharger
                                </>
                            )}
                        </button>

                    </div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="text-center pt-4">
                <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                    <CreditCard size={12} />
                    Paiement sécurisé via Konnect (Carte Bancaire / E-Dinar). Les crédits n'expirent jamais.
                </p>
            </div>

        </div>
    );
}
