"use client";

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import NeoButton from './NeoButton';
import Link from 'next/link';
import Image from 'next/image';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-paper border-b-2 border-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <Link href="/" className="relative h-20 w-60 block">
                            <Image
                                src="/media/black_logo.png"
                                alt="Saffi Logo"
                                fill
                                className="object-contain object-left"
                                priority
                            />
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-black font-medium hover:text-saffi-indigo transition-colors border-b-2 border-transparent hover:border-black">Fonctionnalités</a>
                        <a href="#how-it-works" className="text-black font-medium hover:text-saffi-indigo transition-colors border-b-2 border-transparent hover:border-black">Comment ça marche</a>
                        <a href="#pricing" className="text-black font-medium hover:text-saffi-indigo transition-colors border-b-2 border-transparent hover:border-black">Tarifs</a>
                        <Link href="/register">
                            <NeoButton variant="primary" className="!py-2 !px-4 text-base">
                                Essai Gratuit
                            </NeoButton>
                        </Link>
                    </div>

                    <div className="md:hidden flex items-center">
                        <button onClick={toggleMenu} className="text-black p-2 hover:bg-gray-100 border-2 border-transparent hover:border-black transition-all">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-b-2 border-black animate-fade-in">
                    <div className="px-2 pt-2 pb-6 space-y-1 sm:px-3">
                        <a href="#features" className="block px-3 py-4 text-lg font-bold text-center border-b-2 border-gray-100 hover:bg-gray-50" onClick={toggleMenu}>Fonctionnalités</a>
                        <a href="#how-it-works" className="block px-3 py-4 text-lg font-bold text-center border-b-2 border-gray-100 hover:bg-gray-50" onClick={toggleMenu}>Comment ça marche</a>
                        <a href="#pricing" className="block px-3 py-4 text-lg font-bold text-center border-b-2 border-gray-100 hover:bg-gray-50" onClick={toggleMenu}>Tarifs</a>
                        <div className="p-4">
                            <Link href="/register" onClick={toggleMenu}>
                                <NeoButton fullWidth variant="primary">Essai Gratuit</NeoButton>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
