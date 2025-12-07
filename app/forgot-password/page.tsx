"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { motion } from "framer-motion";
import AuthVisual from "@/components/AuthVisual";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const supabase = createClient();

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setRequestError(null);

        // Current origin for redirect (e.g., http://localhost:3000)
        const origin = window.location.origin;

        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: `${origin}/auth/callback?next=/update-password`,
        });

        if (error) {
            setRequestError(error.message);
            setIsLoading(false);
        } else {
            setIsSuccess(true);
            setIsLoading(false);
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
                        <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black mb-6 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            Retour à la connexion
                        </Link>
                        <h1 className="font-display font-black text-4xl tracking-tight mb-2 text-black">
                            Mot de passe oublié ?
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">
                            Entrez votre email pour recevoir un lien de réinitialisation.
                        </p>
                    </div>

                    {isSuccess ? (
                        <div className="bg-green-50 border-2 border-green-500 p-6 text-center space-y-4 rounded-md">
                            <div className="flex justify-center">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-green-700">Email envoyé !</h3>
                                <p className="text-sm text-green-600 font-medium">
                                    Vérifiez votre boîte de réception (et vos spams) pour réinitialiser votre mot de passe.
                                </p>
                            </div>
                            <Link 
                                href="/login"
                                className="block w-full bg-green-500 text-white font-bold text-sm uppercase tracking-wider py-3 rounded-md border-2 border-green-700 shadow-[4px_4px_0px_0px_#15803d] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#15803d] transition-all"
                            >
                                Retour à la connexion
                            </Link>
                        </div>
                    ) : (
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

                            {requestError && (
                                <div className="bg-red-50 border-2 border-red-500 text-red-600 px-4 py-3 rounded-md text-sm font-bold">
                                    {requestError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-black text-white font-bold text-sm uppercase tracking-wider h-11 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_#000] transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Envoyer le lien"}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>

            {/* Right Side - Visual */}
            <div className="hidden md:block w-1/2 relative h-full">
                <AuthVisual />
            </div>
        </div>
    );
}
