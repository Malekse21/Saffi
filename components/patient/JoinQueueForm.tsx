'use client';

import { useState } from 'react';
import { User, Phone, ClipboardList } from 'lucide-react';

interface JoinQueueFormProps {
    motifs: { value: string; label: string; isPublic: boolean }[];
    onSubmit: (formData: any) => Promise<void>;
}

export default function JoinQueueForm({ motifs, onSubmit }: JoinQueueFormProps) {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        motif: motifs.length > 0 ? motifs[0].value : 'consultation'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(formData);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
                <label className="block text-sm font-bold uppercase mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    Nom Complet
                </label>
                <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full border-2 border-black p-4 font-medium focus:outline-none focus:bg-yellow-50 shadow-[4px_4px_0px_0px_#000]"
                    placeholder="Votre nom"
                />
            </div>

            {/* Phone */}
            <div>
                <label className="block text-sm font-bold uppercase mb-2">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Téléphone
                </label>
                <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border-2 border-black p-4 font-medium focus:outline-none focus:bg-yellow-50 shadow-[4px_4px_0px_0px_#000]"
                    placeholder="Votre numéro"
                />
            </div>

            {/* Motifs Dropdown */}
            <div>
                <label className="block text-sm font-bold uppercase mb-2">
                    <ClipboardList className="inline h-4 w-4 mr-2" />
                    Motif de visite
                </label>
                <div className="relative">
                    <select
                        value={formData.motif}
                        onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                        className="w-full appearance-none border-2 border-black bg-white p-4 font-medium focus:outline-none focus:bg-yellow-50 shadow-[4px_4px_0px_0px_#000]"
                    >
                        {motifs.filter(m => m.isPublic).map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                    {/* Custom Arrow */}
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 4L6 8L10 4" stroke="black" strokeWidth="2" strokeLinecap="square"/>
                        </svg>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2C2B57] text-white border-2 border-black p-4 font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:bg-black transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
            >
                {loading ? 'Inscription...' : 'Rejoindre la file'}
            </button>
        </form>
    );
}
