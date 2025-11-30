'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check, Zap, Package } from 'lucide-react';

const plans = [
    {
        id: 'monthly',
        name: 'Mensuel',
        price: '69',
        period: '/ mois',
        billed: 'Facturé 69 TND chaque mois',
        savings: null,
        theme: 'white',
        gifts: [], // No gifts
        features: [
            'Accès complet Saffi Connect',
            '250 SMS Gratuits / mois',
            'Support par Email',
            'Sans engagement'
        ]
    },
    {
        id: 'semester',
        name: 'Semestriel',
        price: '59',
        period: '/ mois',
        billed: 'Payez 359 TND une fois',
        savings: 'Économisez 55 TND',
        theme: 'white', // Standard White
        popular: false,
        gifts: [
            { name: 'Support QR Plexi', image: '/images/gift-stand.png' }
        ],
        features: [
            'Tout le pack Mensuel',
            'Installation Assistée',
            '300 SMS Gratuits / mois',
            'Cadeau Physique inclus 📦'
        ]
    },
    {
        id: 'annual',
        name: 'Annuel',
        price: '49',
        period: '/ mois',
        billed: 'Payez 590 TND une fois',
        savings: 'Économisez 238 TND',
        theme: 'black', // Inverted "Boss" Theme
        popular: true,
        gifts: [
            { name: 'Support QR Plexi', image: '/images/gift-stand.png' },
            { name: 'Carnet Saffi', image: '/images/gift-notebook.png' },
            { name: 'Stylo Premium', image: '/images/gift-pen.png' }
        ],
        features: [
            'Tout le pack Semestriel',
            'Support VIP Prioritaire',
            '300 SMS Gratuits / mois',
            'Pack "Ambassadeur" envoyé 🎁'
        ]
    }
];

export default function PricingSection() {
    return (
        <section className="py-24 bg-[#FDFBF7] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Header */}
                <div className="text-center mb-20 space-y-4">
                    <h2 className="font-display text-5xl md:text-6xl font-black text-black tracking-tight">
                        Des prix simples.
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
                        Choisissez la durée qui vous convient. Plus vous vous engagez, plus nous vous équipons.
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {plans.map((plan, index) => (
                        <PricingCard key={plan.id} plan={plan} index={index} />
                    ))}
                </div>

                {/* Footer Note */}
                <p className="text-center mt-12 text-sm text-gray-500 font-mono">
                    * Les cadeaux sont livrés sous 48h après validation du paiement.
                </p>
            </div>
        </section>
    );
}

function PricingCard({ plan, index }: { plan: any, index: number }) {
    const isBlack = plan.theme === 'black';

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className={`
        relative flex flex-col p-8 border-2 border-black h-full
        ${isBlack ? 'bg-black text-white' : 'bg-white text-black'}
        shadow-[8px_8px_0px_0px_#000]
      `}
        >
            {/* Badge for Popular/Savings */}
            {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#FACC15] text-black border-2 border-black px-4 py-1 font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] rotate-2">
                    Meilleure Offre
                </div>
            )}
            {plan.savings && !plan.popular && (
                <div className="absolute -top-4 right-4 bg-green-100 text-green-800 border-2 border-black px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_#000]">
                    {plan.savings}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h3 className={`font-display text-3xl font-bold mb-2 ${isBlack ? 'text-white' : 'text-black'}`}>
                    {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black font-display tracking-tight">{plan.price}</span>
                    <span className="text-xl font-bold text-gray-500">TND</span>
                    <span className="text-sm text-gray-400 font-mono">{plan.period}</span>
                </div>
                <p className={`text-sm mt-2 font-medium ${isBlack ? 'text-gray-400' : 'text-gray-500'}`}>
                    {plan.billed}
                </p>
            </div>

            {/* THE GIFTS SECTION (Visual) */}
            <div className="flex-1">
                {plan.gifts.length > 0 ? (
                    <div className={`mb-8 p-4 border-2 border-dashed rounded-lg relative group ${isBlack ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="absolute -top-3 left-4 bg-[#6366F1] text-white text-[10px] font-bold px-2 py-1 border border-black uppercase tracking-wider shadow-sm">
                            Inclus Gratuitement
                        </div>

                        {/* Image Container */}
                        <div className="h-32 w-full relative flex items-center justify-center gap-2">
                            {/* 
                  NOTE: Ensure your PNGs are in /public/images/ 
                  The prompt asked for specific items per plan.
               */}
                            {plan.gifts.map((gift: any, i: number) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.1, rotate: i % 2 === 0 ? 5 : -5 }}
                                    className="relative w-20 h-24"
                                >
                                    <Image
                                        src={gift.image}
                                        alt={gift.name}
                                        fill
                                        className="object-contain drop-shadow-xl"
                                    />
                                </motion.div>
                            ))}
                        </div>
                        <p className={`text-center text-xs font-bold mt-2 ${isBlack ? 'text-gray-300' : 'text-gray-600'}`}>
                            {plan.gifts.map((g: any) => g.name).join(' + ')}
                        </p>
                    </div>
                ) : (
                    <div className="mb-8 h-40 flex items-center justify-center border-2 border-transparent">
                        <p className="text-gray-400 text-sm font-mono text-center">
                            Pas de matériel inclus.<br />Format 100% Digital.
                        </p>
                    </div>
                )}

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                    {plan.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                            <div className={`mt-1 p-0.5 rounded-full ${isBlack ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                <Check size={12} strokeWidth={4} />
                            </div>
                            <span className={`text-sm font-medium ${isBlack ? 'text-gray-200' : 'text-gray-700'}`}>
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* CTA Button */}
            <button
                className={`
          w-full py-4 font-black text-lg uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#fff]
          transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#fff]
          ${isBlack
                        ? 'bg-[#FACC15] text-black shadow-[4px_4px_0px_0px_#FFF]'
                        : 'bg-black text-white shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000]'
                    }
        `}
            >
                Choisir {plan.name}
            </button>

        </motion.div>
    );
}
