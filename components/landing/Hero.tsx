import React from 'react';
import NeoButton from './NeoButton';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const Hero: React.FC = () => {
    return (
        <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-4 max-w-7xl mx-auto overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Left Content */}
                <div className="space-y-8 z-10 relative">
                    <div className="inline-block bg-saffi-indigo text-white px-4 py-2 font-bold border-2 border-black shadow-neo-sm transform -rotate-2">
                        Nouveau en Tunisie 🇹🇳
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-extrabold leading-[1.1] tracking-tight">
                        Plus de chaos en <br />
                        <span className="bg-saffi-yellow px-2 border-2 border-black inline-block transform rotate-1 shadow-neo-sm">salle d'attente.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-700 font-medium max-w-lg leading-relaxed">
                        Saffi remplace votre carnet de rendez-vous par une file d'attente intelligente. Moins de bruit, plus de sérénité.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <NeoButton variant="primary" className="text-xl px-8">
                            Commencer <ArrowRight className="ml-2" />
                        </NeoButton>
                        <NeoButton variant="outline" className="text-xl px-8">
                            Voir la Démo
                        </NeoButton>
                    </div>

                    <div className="pt-6 flex flex-wrap gap-4 text-sm font-bold text-gray-600">
                        <span className="flex items-center gap-1"><CheckCircle2 className="text-saffi-green" size={20} /> Installation en 5 min</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="text-saffi-green" size={20} /> Sans engagement</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="text-saffi-green" size={20} /> Support 7j/7</span>
                    </div>
                </div>

                {/* Right Visual - Abstract Representation */}
                <div className="relative h-[500px] w-full flex items-center justify-center">
                    {/* Decorative Blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-saffi-green rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-saffi-indigo rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>

                    {/* The Floating Interfaces */}
                    <div className="relative w-full max-w-md">
                        {/* Phone Card (Patient) */}
                        <div className="absolute top-0 right-0 z-20 transform rotate-6 hover:rotate-0 transition-transform duration-500">
                            <div className="w-48 bg-white border-2 border-black shadow-neo p-4">
                                <div className="w-full h-4 bg-gray-100 border border-black mb-4"></div>
                                <div className="text-center py-6">
                                    <div className="text-4xl font-display font-bold text-saffi-indigo">#14</div>
                                    <p className="text-xs font-bold uppercase mt-1">C'est votre tour</p>
                                </div>
                                <div className="w-full h-8 bg-saffi-green border-2 border-black flex items-center justify-center font-bold text-xs mt-2">
                                    JE SORS
                                </div>
                            </div>
                        </div>

                        {/* Main Card (Secretary) */}
                        <div className="bg-white border-2 border-black shadow-neo-lg p-6 relative z-10">
                            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
                                <h3 className="font-display font-bold text-2xl">Dr. Ben Amor</h3>
                                <div className="w-3 h-3 bg-red-500 rounded-full border border-black animate-pulse"></div>
                            </div>
                            <div className="space-y-3">
                                {[12, 13, 14].map((num, i) => (
                                    <div key={num} className={`flex items-center justify-between p-3 border-2 border-black ${i === 2 ? 'bg-saffi-yellow' : 'bg-gray-50'}`}>
                                        <div className="font-bold">Patient #{num}</div>
                                        <div className="text-xs font-mono">{i === 0 ? 'EN CONSULTATION' : i === 2 ? 'EN ATTENTE' : 'PRÊT'}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex gap-2">
                                <div className="flex-1 h-10 bg-black text-white flex items-center justify-center font-bold border-2 border-transparent hover:bg-white hover:text-black hover:border-black cursor-pointer transition-colors">
                                    SUIVANT
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
