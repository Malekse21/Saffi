import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-black text-white border-t-2 border-black py-12">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="font-display font-bold text-3xl tracking-tight mb-2">Saffi.</div>
                        <p className="text-gray-400 text-sm max-w-xs">
                            La solution de gestion de file d'attente #1 en Tunisie. Fait avec <Heart size={12} className="inline text-red-500 fill-current" /> à Tunis.
                        </p>
                    </div>

                    <div className="flex gap-8 text-sm font-bold text-gray-300">
                        <a href="#" className="hover:text-saffi-yellow transition-colors">Mentions Légales</a>
                        <a href="#" className="hover:text-saffi-yellow transition-colors">Contact</a>
                        <a href="#" className="hover:text-saffi-yellow transition-colors">Connexion Admin</a>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-500 font-mono">
                    © {new Date().getFullYear()} Saffi Systems. Tous droits réservés.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
