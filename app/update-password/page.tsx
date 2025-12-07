"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuthVisual from "@/components/AuthVisual";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";

export default function UpdatePasswordPage() {
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    
    // Watch password to confirm match
    const password = watch("password");

    const onSubmit = async (data: any) => {
        if (data.password !== data.confirmPassword) {
            setUpdateError("Les mots de passe ne correspondent pas");
            return;
        }

        setIsLoading(true);
        setUpdateError(null);

        const { error } = await supabase.auth.updateUser({
            password: data.password
        });

        if (error) {
            setUpdateError(error.message);
            setIsLoading(false);
        } else {
            setIsSuccess(true);
            setIsLoading(false);
            // Redirect after a short delay to let them see success message
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
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
                            Nouveau mot de passe
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">
                            Définissez votre nouveau mot de passe sécurisé.
                        </p>
                    </div>

                    {isSuccess ? (
                        <div className="bg-green-50 border-2 border-green-500 p-6 text-center space-y-4 rounded-md">
                            <div className="flex justify-center">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-green-700">Succès !</h3>
                                <p className="text-sm text-green-600 font-medium">
                                    Votre mot de passe a été mis à jour. Redirection vers le tableau de bord...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-black">Nouveau mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        {...register("password", { required: true, minLength: 6 })}
                                        type="password"
                                        className="w-full h-10 pl-10 pr-3 bg-white border-2 border-black rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:bg-yellow-50 transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <PasswordStrengthIndicator password={password} />
                                {errors.password && <span className="text-red-500 text-xs font-bold">Minimum 6 caractères</span>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-black">Confirmer</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        {...register("confirmPassword", { 
                                            required: true, 
                                            validate: (val: string) => val === password || "Les mots de passe ne correspondent pas"
                                        })}
                                        type="password"
                                        className="w-full h-10 pl-10 pr-3 bg-white border-2 border-black rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:bg-yellow-50 transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.confirmPassword && <span className="text-red-500 text-xs font-bold">{errors.confirmPassword.message as string}</span>}
                            </div>

                            {updateError && (
                                <div className="bg-red-50 border-2 border-red-500 text-red-600 px-4 py-3 rounded-md text-sm font-bold">
                                    {updateError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-black text-white font-bold text-sm uppercase tracking-wider h-11 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_#000] transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Mettre à jour"}
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
