import React from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials: React.FC = () => {
    const testimonials = [
        {
            name: "Dr. Fatma Ben Ali",
            role: "Dentiste à Tunis",
            content: "Depuis qu'on a installé Saffi, le silence dans la salle d'attente est impressionnant. Les patients ne demandent plus 'c'est à qui le tour ?' toutes les 5 minutes.",
            color: "bg-saffi-yellow"
        },
        {
            name: "Cabinet Dr. Karray",
            role: "Cardiologie, Sousse",
            content: "Ma secrétaire gagne un temps fou. La synchro avec Google Agenda est parfaite pour gérer les urgences au milieu des RDV programmés. Un vrai changement.",
            color: "bg-saffi-indigo"
        },
        {
            name: "Dr. Youssef M.",
            role: "Pédiatre à Sfax",
            content: "Simple, efficace. Les parents adorent pouvoir sortir faire un tour avec leurs enfants et revenir exactement quand leur téléphone vibre.",
            color: "bg-saffi-green"
        }
    ];

    return (
        <section className="py-24 bg-white border-t-2 border-black">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <div className="inline-block bg-black text-white px-3 py-1 font-bold text-sm uppercase tracking-widest mb-4 transform -rotate-2">
                        Ils l'ont adopté
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-black">
                        Validé par les médecins. <br />
                        <span className="text-saffi-green">Approuvé par les patients.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <div key={i} className="flex flex-col h-full">
                            <div className={`flex-1 border-2 border-black p-8 shadow-neo bg-paper relative group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all duration-200`}>
                                <Quote className="absolute top-6 right-6 text-black opacity-10" size={48} />

                                <div className="flex gap-1 mb-6 text-saffi-yellow">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={20} fill="currentColor" strokeWidth={1.5} className="text-black fill-saffi-yellow" />
                                    ))}
                                </div>

                                <p className="text-lg font-medium leading-relaxed mb-8 relative z-10">
                                    "{t.content}"
                                </p>

                                <div className="flex items-center gap-4 mt-auto">
                                    <div className={`w-12 h-12 border-2 border-black ${t.color} flex items-center justify-center font-display font-bold text-xl shadow-neo-sm`}>
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold font-display text-lg leading-none">{t.name}</div>
                                        <div className="text-sm text-gray-600 font-bold uppercase tracking-wider mt-1">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
