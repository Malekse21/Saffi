"use client";

import React, { useState } from 'react';
import { Smartphone, Monitor, Tv, ArrowRight, UserCheck, Coffee, Bell } from 'lucide-react';
import NeoCard from './NeoCard';
import NeoButton from './NeoButton';
import { InterfaceType } from './types';
import { motion, AnimatePresence } from 'framer-motion';

const Interfaces: React.FC = () => {
    const [activeTab, setActiveTab] = useState<InterfaceType>(InterfaceType.PATIENT);

    const tabs = [
        {
            id: InterfaceType.PATIENT,
            label: 'Patient',
            sublabel: 'Mobile Web',
            icon: Smartphone,
            color: 'bg-saffi-yellow',
            textColor: 'text-black'
        },
        {
            id: InterfaceType.SECRETARY,
            label: 'Secrétaire',
            sublabel: 'Tableau de Bord',
            icon: Monitor,
            color: 'bg-saffi-indigo',
            textColor: 'text-white'
        },
        {
            id: InterfaceType.TV,
            label: 'Salle d\'Attente',
            sublabel: 'Écran TV',
            icon: Tv,
            color: 'bg-saffi-dark',
            textColor: 'text-white'
        },
    ];

    return (
        <section id="how-it-works" className="py-24 bg-white border-y-2 border-black relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-display font-black mb-6">
                        Un écosystème, <br className="md:hidden" />
                        <span className="bg-saffi-green px-2 text-white inline-block transform -rotate-1 border-2 border-black shadow-neo-sm mx-2">
                            trois interfaces.
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Tout est connecté en temps réel. Quand la secrétaire clique, le téléphone du patient vibre et la TV l'annonce.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Controls */}
                    <div className="lg:col-span-4 space-y-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as InterfaceType)}
                                className={`w-full text-left p-6 border-2 border-black transition-all duration-300 flex items-center gap-4 group ${activeTab === tab.id
                                    ? `${tab.color} ${tab.textColor} shadow-neo translate-x-[-2px] translate-y-[-2px]`
                                    : 'bg-white hover:bg-gray-50 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-sm'
                                    }`}
                            >
                                <div className={`p-3 border-2 border-black bg-white text-black rounded-none`}>
                                    <tab.icon size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <div className="font-display font-bold text-xl leading-none mb-1">{tab.label}</div>
                                    <div className={`text-sm font-bold opacity-80 uppercase tracking-wider`}>{tab.sublabel}</div>
                                </div>
                                <ArrowRight className={`ml-auto transform transition-transform ${activeTab === tab.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} strokeWidth={3} />
                            </button>
                        ))}
                    </div>

                    {/* Visual Preview Area */}
                    <div className="lg:col-span-8 bg-gray-100 border-2 border-black shadow-neo p-8 flex items-center justify-center min-h-[500px] relative overflow-hidden">
                        <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 gap-4 opacity-10 pointer-events-none">
                            {Array.from({ length: 144 }).map((_, i) => (
                                <div key={i} className="border border-black"></div>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === InterfaceType.PATIENT && (
                                <motion.div
                                    key="patient"
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -50 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-[300px] bg-white border-4 border-black rounded-[2rem] shadow-neo-lg overflow-hidden relative"
                                >
                                    {/* Fake Phone Header */}
                                    <div className="h-8 bg-white border-b-2 border-black flex justify-center items-center gap-2">
                                        <div className="w-16 h-4 bg-black rounded-full"></div>
                                    </div>
                                    {/* Content */}
                                    <div className="p-6 flex flex-col items-center min-h-[500px] bg-paper">
                                        <div className="w-16 h-16 bg-white border-2 border-black flex items-center justify-center mb-6 shadow-neo-sm">
                                            <span className="font-display font-bold text-2xl">S.</span>
                                        </div>
                                        <h3 className="font-bold text-center mb-2">Bienvenue, Sami</h3>
                                        <div className="text-sm text-gray-500 mb-8">Cabinet Dr. Ben Amor</div>

                                        <div className="w-full bg-white border-2 border-black p-4 mb-6 shadow-neo-sm">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="font-bold text-sm uppercase text-gray-500">Votre Ticket</span>
                                                <span className="font-bold text-sm text-saffi-indigo">Estimé: 14:30</span>
                                            </div>
                                            <div className="text-6xl font-display font-black text-center mb-2">15</div>
                                            <div className="w-full bg-gray-100 h-2 border border-black rounded-full overflow-hidden">
                                                <div className="bg-saffi-green h-full w-3/4"></div>
                                            </div>
                                            <div className="text-center text-xs font-bold mt-2 text-saffi-green">3 personnes devant vous</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 w-full">
                                            <button className="bg-saffi-yellow border-2 border-black p-3 flex flex-col items-center justify-center gap-1 shadow-neo-sm active:translate-y-[2px] active:shadow-none transition-all">
                                                <Coffee size={20} />
                                                <span className="text-xs font-bold">JE SORS</span>
                                            </button>
                                            <button className="bg-white border-2 border-black p-3 flex flex-col items-center justify-center gap-1 shadow-neo-sm active:translate-y-[2px] active:shadow-none transition-all">
                                                <Bell size={20} />
                                                <span className="text-xs font-bold">RAPPEL</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === InterfaceType.SECRETARY && (
                                <motion.div
                                    key="secretary"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-full max-w-2xl bg-white border-2 border-black shadow-neo-lg p-2"
                                >
                                    <div className="bg-paper border-2 border-black p-4 mb-4 flex justify-between items-center">
                                        <div className="font-bold flex items-center gap-2">
                                            <div className="w-3 h-3 bg-saffi-green rounded-full border border-black"></div>
                                            Dashboard
                                        </div>
                                        <div className="font-mono text-sm">10:42 AM</div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="border-2 border-black bg-saffi-indigo text-white p-4 shadow-neo-sm">
                                            <div className="text-3xl font-display font-bold">04</div>
                                            <div className="text-xs font-bold uppercase opacity-80">En Attente</div>
                                        </div>
                                        <div className="border-2 border-black bg-saffi-yellow p-4 shadow-neo-sm">
                                            <div className="text-3xl font-display font-bold">02</div>
                                            <div className="text-xs font-bold uppercase opacity-80">Absents</div>
                                        </div>
                                        <div className="border-2 border-black bg-saffi-green p-4 shadow-neo-sm">
                                            <div className="text-3xl font-display font-bold">12</div>
                                            <div className="text-xs font-bold uppercase opacity-80">Servis</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 border-2 border-black bg-white shadow-neo-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="font-display font-bold text-xl w-8">14</div>
                                                <div>
                                                    <div className="font-bold">Mme. Trabelsi</div>
                                                    <div className="text-xs text-gray-500">Arrivée à 10:15</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 border-2 border-black bg-saffi-green hover:bg-green-400 transition-colors">
                                                    <UserCheck size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 border-2 border-black bg-gray-50 opacity-60">
                                            <div className="flex items-center gap-3">
                                                <div className="font-display font-bold text-xl w-8">15</div>
                                                <div>
                                                    <div className="font-bold">Mr. Gharbi</div>
                                                    <div className="text-xs text-gray-500">RDV 10:30 (Google Cal)</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="px-2 py-1 bg-white border border-black text-xs font-bold">EN ATTENTE</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === InterfaceType.TV && (
                                <motion.div
                                    key="tv"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-full aspect-video bg-black border-4 border-gray-800 shadow-neo-lg relative flex items-center justify-center p-8"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                        <div className="text-white text-xs font-mono">LIVE</div>
                                    </div>

                                    <div className="flex w-full h-full gap-4">
                                        <div className="w-2/3 bg-white border-4 border-saffi-indigo flex flex-col items-center justify-center relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full bg-saffi-indigo text-white text-center py-2 font-bold uppercase tracking-widest text-xl">
                                                Au Cabinet
                                            </div>
                                            <div className="text-[10rem] font-display font-black leading-none mt-8">14</div>
                                            <div className="text-4xl font-bold mt-4">Mme. Trabelsi</div>
                                        </div>
                                        <div className="w-1/3 flex flex-col gap-4">
                                            <div className="flex-1 bg-saffi-yellow border-4 border-white flex flex-col items-center justify-center">
                                                <div className="text-sm font-bold uppercase mb-2">Suivant</div>
                                                <div className="text-6xl font-display font-black">15</div>
                                            </div>
                                            <div className="flex-1 bg-gray-800 border-4 border-white flex flex-col items-center justify-center">
                                                <div className="text-sm font-bold text-white uppercase mb-2">Retard</div>
                                                <div className="text-4xl font-display font-black text-white opacity-50">12</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Interfaces;
