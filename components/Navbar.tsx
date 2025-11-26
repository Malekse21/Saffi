"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-6 md:px-12 bg-white border-b-2 border-black">
            <Link href="/" className="font-sans text-2xl font-black tracking-tighter uppercase text-black">
                Saffi.
            </Link>

            <div className="flex items-center gap-6">
                <Link
                    href="/dashboard"
                    className="text-sm font-bold text-black hover:underline underline-offset-4 decoration-2"
                >
                    Espace Docteur
                </Link>
                <button className="bg-solar-yellow text-black px-6 py-3 text-sm font-bold uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-none">
                    Essai Gratuit
                </button>
            </div>
        </nav>
    );
}
