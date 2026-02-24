'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Mail, Loader2, X, Chrome } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { clsx } from 'clsx';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const params = useParams();
    const lang = params?.lang || 'fr';

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/${lang}/auth/callback`,
            },
        });

        setIsLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setIsSent(true);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/${lang}/auth/callback`,
            },
        });
        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-50 text-zinc-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 md:p-12">
                            <div className="text-center mb-10">
                                <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 relative">
                                    <img
                                        src="/illustrations/mascot-onboarding-start.png"
                                        alt="Mascotte bienvenue"
                                        className="w-full h-full object-contain filter drop-shadow-xl"
                                    />
                                </div>
                                <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900 leading-none mb-2">Bienvenue sur PLANIF.app</h2>
                                <p className="text-zinc-400 text-sm font-medium">Connectez-vous pour sauvegarder vos simulations.</p>
                            </div>

                            {isSent ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center space-y-6"
                                >
                                    <div className="w-24 h-24 md:w-32 md:h-32 mx-auto relative mb-4">
                                        <img
                                            src="/illustrations/mascot-success-ready.png"
                                            alt="Mascotte email envoyé"
                                            className="w-full h-full object-contain filter drop-shadow-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-black italic text-zinc-900 uppercase tracking-tight">Vérifiez vos emails !</p>
                                        <p className="text-zinc-400 text-sm leading-relaxed">
                                            Nous avons envoyé un lien magique à <strong>{email}</strong>. Cliquez dessus pour vous connecter instantanément.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsSent(false)}
                                        className="text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-zinc-900 transition-colors"
                                    >
                                        Changer d'email
                                    </button>
                                </motion.div>
                            ) : (
                                <div className="space-y-6">
                                    <form onSubmit={handleMagicLink} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Email</label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="alex@exemple.com"
                                                    className="w-full h-14 px-6 bg-zinc-50 border-2 border-transparent focus:border-zinc-900 rounded-2xl outline-none font-bold text-zinc-900 transition-all placeholder:text-zinc-200"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Mail className="w-5 h-5 text-zinc-200" />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-14 bg-zinc-900 text-white rounded-2xl font-black italic shadow-premium active:scale-95 transition-all flex items-center justify-center space-x-2"
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Recevoir un lien magique</span>}
                                        </button>
                                    </form>

                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-zinc-100" />
                                        </div>
                                        <span className="relative px-4 bg-white text-[10px] font-black uppercase tracking-widest text-zinc-300">Ou continuer avec</span>
                                    </div>

                                    <button
                                        onClick={handleGoogleLogin}
                                        disabled={isLoading}
                                        className="w-full h-14 bg-white border border-zinc-100 text-zinc-900 rounded-2xl font-black italic shadow-soft hover:shadow-premium hover:border-zinc-200 active:scale-95 transition-all flex items-center justify-center space-x-3 group/google"
                                    >
                                        <div className="w-8 h-8 bg-zinc-50 rounded-xl flex items-center justify-center group-hover/google:bg-white transition-colors">
                                            <Chrome className="w-5 h-5 text-zinc-400 group-hover/google:text-[#4285F4] transition-colors" />
                                        </div>
                                        <span>Continuer avec Google</span>
                                    </button>

                                    {error && (
                                        <p className="text-center text-rose-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
