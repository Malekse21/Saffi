import React from 'react';
import { Calendar, MessageSquare, Mic, MapPin, Coffee, ArrowUpRight } from 'lucide-react';
import NeoCard from './NeoCard';

const Features: React.FC = () => {
    const features = [
        {
            title: "Google Agenda Sync",
            desc: "Ne saisissez jamais deux fois le même rendez-vous. Saffi fusionne vos RDV existants avec la file d'attente sans rendez-vous.",
            icon: Calendar,
            color: "bg-blue-100",
            accent: "border-blue-500"
        },
        {
            title: "SMS de Secours",
            desc: "Un patient âgé n'a pas internet ? Marquez-le 'Absent' et Saffi envoie automatiquement un vrai SMS via notre passerelle GSM.",
            icon: MessageSquare,
            color: "bg-green-100",
            accent: "border-green-500"
        },
        {
            title: "Annonce Vocale",
            desc: "Plus besoin de crier. Connectez un écran TV et laissez la synthèse vocale appeler les patients : 'Numéro 15, au cabinet'.",
            icon: Mic,
            color: "bg-purple-100",
            accent: "border-purple-500"
        },
        {
            title: "Boost Avis Google",
            desc: "Après la consultation, Saffi demande une note. 5 étoiles ? On redirige le patient vers votre fiche Google Maps.",
            icon: MapPin,
            color: "bg-yellow-100",
            accent: "border-yellow-500"
        },
    ];

    return (
        <section id="features" className="py-24 bg-paper">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Main Feature Block */}
                    <div className="lg:col-span-1 row-span-2">
                        <div className="h-full bg-saffi-yellow border-2 border-black p-8 shadow-neo flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white rounded-full border-2 border-black z-0 group-hover:scale-110 transition-transform"></div>
                            <div className="relative z-10">
                                <h3 className="font-display font-black text-4xl mb-4 leading-tight">Fonctionnalités<br />Intelligentes.</h3>
                                <p className="font-medium text-black/80 mb-8">
                                    Conçu spécifiquement pour la réalité des cabinets médicaux tunisiens. On gère les coupures internet, les retards et les urgences.
                                </p>
                                <button className="bg-white px-6 py-3 border-2 border-black font-bold flex items-center gap-2 hover:translate-x-1 hover:shadow-neo-sm transition-all">
                                    Voir la doc technique <ArrowUpRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {features.map((f, i) => (
                        <div key={i} className="group relative bg-white border-2 border-black p-6 shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all duration-200">
                            <div className={`w-12 h-12 ${f.color} border-2 border-black mb-4 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                <f.icon size={24} className="text-black" strokeWidth={2.5} />
                            </div>
                            <h4 className="font-display font-bold text-xl mb-2">{f.title}</h4>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">{f.desc}</p>
                        </div>
                    ))}

                </div>
            </div>
        </section>
    );
};

export default Features;
