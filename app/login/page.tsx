"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuthVisual from "@/components/AuthVisual";
import { Mail, Lock, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setAuthError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            setAuthError(error.message);
            setIsLoading(false);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    return (
        <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-white font-sans text-black selection:bg-yellow-200">
            {/* Left Side - Form */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 relative z-10 bg-white"
            >
                {/* Logo */}
                <div className="absolute top-8 left-8 sm:left-12 lg:left-16">
                    <Link href="/" className="font-display font-black text-2xl tracking-tighter uppercase text-black">
                        Saffi.
                    </Link>
                </div>

                <div className="max-w-md w-full mx-auto mt-12 md:mt-0">
                    <div className="mb-8">
                        <h1 className="font-display font-black text-4xl tracking-tight mb-2 text-black">
                            Connexion
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">
                            Gérez votre cabinet.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-black">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    {...register("email", { required: true })}
                                    type="email"
                                    className="w-full h-10 pl-10 pr-3 bg-white border-2 border-black rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:bg-yellow-50 transition-colors"
                                    placeholder="docteur@exemple.com"
                                />
                            </div>
                            {errors.email && <span className="text-red-500 text-xs font-bold">L'email est requis</span>}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-wider text-black">Mot de passe</label>
                                <Link href="#" className="text-xs text-gray-500 hover:text-black hover:underline">
                                    Oublié ?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    {...register("password", { required: true })}
                                    type="password"
                                    className="w-full h-10 pl-10 pr-3 bg-white border-2 border-black rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:bg-yellow-50 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && <span className="text-red-500 text-xs font-bold">Le mot de passe est requis</span>}
                        </div>

                        {authError && (
                            <div className="bg-red-50 border-2 border-red-500 text-red-600 px-4 py-3 rounded-md text-sm font-bold">
                                {authError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-black text-white font-bold text-sm uppercase tracking-wider h-11 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_#000] transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Se Connecter"}
                        </button>
                    </form>

                    <div className="mt-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-white text-gray-400 font-medium">Ou</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="mt-4 w-full bg-white text-black font-bold text-sm h-10 rounded-md border-2 border-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </button>

                    <p className="mt-8 text-center text-xs font-medium text-gray-500">
                        Pas encore de compte ?{" "}
                        <Link href="/register" className="text-black font-bold hover:underline">
                            Créer un compte
                        </Link>
                    </p>
                </div>
            </motion.div>

            {/* Right Side - Visual */}
            <div className="hidden md:block w-1/2 relative h-full">
                <AuthVisual />
            </div>
        </div>
    );
}
