import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-black text-white py-12 px-6 md:px-12 border-t-2 border-black">
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                    <Link href="/" className="font-sans text-2xl font-black tracking-tighter uppercase text-white">
                        Saffi.
                    </Link>
                    <p className="text-gray-400 mt-2 text-sm font-medium">
                        Conçu pour les médecins tunisiens.
                    </p>
                </div>

                <div className="flex gap-8">
                    <Link href="#" className="text-sm font-bold text-gray-400 hover:text-solar-yellow transition-colors">
                        Mentions Légales
                    </Link>
                    <Link href="#" className="text-sm font-bold text-gray-400 hover:text-solar-yellow transition-colors">
                        Contact
                    </Link>
                    <Link href="#" className="text-sm font-bold text-gray-400 hover:text-solar-yellow transition-colors">
                        Connexion
                    </Link>
                </div>

                <div className="text-sm font-medium text-gray-500">
                    © {new Date().getFullYear()} Saffi. Tous droits réservés.
                </div>
            </div>
        </footer>
    );
}
