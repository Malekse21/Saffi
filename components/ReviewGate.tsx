"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, MessageSquare, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewGateProps {
    googleReviewLink?: string;
    onClose?: () => void;
    clinicUserId?: string | null;
}

export default function ReviewGate({ googleReviewLink, onClose, clinicUserId }: ReviewGateProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [step, setStep] = useState<"rating" | "feedback" | "google">("rating");

    const handleRate = (score: number) => {
        setRating(score);
        setStep("google");
    };

    const handleSubmitFeedback = async () => {
        if (!clinicUserId) {
            console.error('No clinic user ID provided');
            alert("Merci pour votre retour !");
            if (onClose) onClose();
            return;
        }

        try {
            const { createClient } = await import("@/utils/supabase/client");
            const supabase = createClient();

            const { error } = await supabase
                .from('patient_feedback')
                .insert({
                    user_id: clinicUserId,
                    rating: rating,
                    feedback_text: feedback,
                });

            if (error) {
                console.error('Error saving feedback:', error);
            }

            alert("Merci pour votre retour ! Nous allons faire de notre mieux pour nous améliorer.");
        } catch (error) {
            console.error('Error saving feedback:', error);
            alert("Merci pour votre retour !");
        }

        if (onClose) onClose();
    };

    const handleGoogleRedirect = () => {
        if (googleReviewLink) {
            window.open(googleReviewLink, "_blank");
        } else {
            alert("Le lien Google Avis n'est pas encore configuré.");
        }
        if (onClose) onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center items-end pointer-events-none"
            >
                <div className="bg-white w-full max-w-sm border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6 pointer-events-auto relative">
                    {/* Close Button (Optional) */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 text-gray-400 hover:text-black font-black text-lg transition-colors"
                        >
                            ✕
                        </button>
                    )}

                    {step === "rating" && (
                        <div className="text-center space-y-4">
                            <h3 className="font-display font-black text-xl uppercase leading-tight tracking-tight">
                                Comment s'est passée votre visite ?
                            </h3>

                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        onClick={() => handleRate(star)}
                                        className="transition-transform hover:scale-110 active:scale-95 border-2 border-black p-1.5 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000]"
                                    >
                                        <Star
                                            className={cn(
                                                "h-8 w-8 stroke-[2.5]",
                                                (hoveredRating || rating) >= star
                                                    ? "fill-[#2C2B57] text-[#2C2B57]"
                                                    : "fill-transparent text-gray-300"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                                Touchez une étoile pour noter
                            </p>
                        </div>
                    )}

                    {step === "feedback" && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div className="text-center mb-4">
                                <h3 className="font-display font-black text-3xl uppercase tracking-tight">Aidez-nous à nous améliorer</h3>
                                <p className="text-gray-500 font-bold text-sm mt-2 uppercase tracking-wide">Message privé au secrétariat</p>
                            </div>

                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Dites-nous ce qui n'a pas été..."
                                className="w-full h-32 border-4 border-black p-4 font-medium resize-none focus:outline-none focus:bg-[#2C2B57]/5 transition-all"
                            />

                            <button
                                onClick={handleSubmitFeedback}
                                className="w-full bg-[#2C2B57] text-white py-4 font-black uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-3 transition-all"
                            >
                                <Send className="h-5 w-5" /> Envoyer au Secrétariat
                            </button>
                        </motion.div>
                    )}

                    {step === "google" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="text-6xl animate-bounce">
                                🤩
                            </div>

                            <div>
                                <h3 className="font-display font-black text-3xl uppercase mb-3 tracking-tight">Merci beaucoup !</h3>
                                <p className="text-gray-500 font-bold">
                                    Un petit avis sur Google nous aiderait énormément.
                                </p>
                            </div>

                            <button
                                onClick={handleGoogleRedirect}
                                className="w-full bg-[#4285F4] text-white py-4 font-black uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3"
                            >
                                <div className="bg-white p-1 rounded-full">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                                </div>
                                Laisser un avis Google
                            </button>

                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-black font-bold text-sm underline uppercase tracking-wide transition-colors"
                            >
                                Non merci, peut-être plus tard
                            </button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
