import React from 'react';
import { Check, Star } from 'lucide-react';
import NeoButton from './NeoButton';

const Pricing: React.FC = () => {
    return (
        <section id="pricing" className="py-24 bg-paper relative">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-display font-black mb-6">
                        Tarifs Simples. <br />
                        <span className="text-saffi-indigo">Sans Engagement.</span>
                    </h2>
                    <p className="text-xl text-gray-600">Choisissez le plan qui correspond à votre volume.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Plan 1 */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-200"></div>
                        <div className="relative bg-white border-2 border-black p-8 h-full flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-2xl font-display font-bold mb-2">Saffi Digital</h3>
                                <div className="text-4xl font-black mb-1">49 TND<span className="text-lg font-medium text-gray-500">/mois</span></div>
                                <p className="text-gray-600 font-medium">Pour les cabinets modernes qui veulent digitaliser l'essentiel.</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    "File d'attente illimitée",
                                    "Interface Patient Mobile",
                                    "Dashboard Secrétaire",
                                    "Mode TV (Audio + Visuel)",
                                    "Support Email 24/7"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-saffi-yellow border-2 border-black flex items-center justify-center shrink-0">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                        <span className="font-bold text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <NeoButton variant="outline" fullWidth className="group-hover:bg-saffi-yellow transition-colors">
                                Commencer Gratuitement
                            </NeoButton>
                        </div>
                    </div>

                    {/* Plan 2 */}
                    <div className="relative group">
                        {/* Best Value Badge */}
                        <div className="absolute -top-4 right-4 bg-saffi-indigo text-white border-2 border-black px-4 py-1 font-bold transform rotate-2 z-20 shadow-neo-sm">
                            LE PLUS POPULAIRE
                        </div>
                        <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-200"></div>
                        <div className="relative bg-white border-2 border-black p-8 h-full flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-2xl font-display font-bold mb-2 text-saffi-indigo">Saffi Connect</h3>
                                <div className="text-4xl font-black mb-1">89 TND<span className="text-lg font-medium text-gray-500">/mois</span></div>
                                <p className="text-gray-600 font-medium">L'expérience complète avec TV et synchronisation avancée.</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    "Tout ce qu'il y a dans Digital",
                                    "Sync Google Agenda ⚡",
                                    "SMS de secours (Patients sans 4G)",
                                    "Analytics & Rapports",
                                    "Feedback Google Maps Auto"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-saffi-indigo text-white border-2 border-black flex items-center justify-center shrink-0">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                        <span className="font-bold text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <NeoButton variant="secondary" fullWidth className="relative overflow-hidden">
                                <span className="relative z-10">Choisir Connect</span>
                            </NeoButton>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
