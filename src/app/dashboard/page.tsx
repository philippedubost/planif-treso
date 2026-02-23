'use client';

import { useState, useRef, useEffect } from 'react';
import { KPISection } from '@/components/kpi/KPISection';
import { CashflowGraph } from '@/components/graph/CashflowGraph';
import { TransactionList } from '@/components/lists/TransactionList';
import { TimelineView } from '@/components/timeline/TimelineView';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Settings, Plus, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useFinanceStore } from '@/store/useFinanceStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { TransactionEditor } from '@/components/lists/TransactionEditor';

export default function DashboardPage() {
    const [showDetails, setShowDetails] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { initAuth, user, resetSimulation, transactions, currency, setCurrency } = useFinanceStore();
    const router = useRouter();

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    const currencies = [
        { label: 'Euro', symbol: '€' },
        { label: 'Dollar', symbol: '$' },
        { label: 'Livre', symbol: '£' },
        { label: 'Franc', symbol: 'CHF' },
        { label: 'CAD', symbol: 'CA$' }
    ];

    const handleLogin = async () => {
        const email = window.prompt("Entrez votre email pour vous connecter :");
        if (email) {
            await supabase.auth.signInWithOtp({ email });
            alert("Lien magique envoyé ! Vérifiez vos emails.");
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleReset = async () => {
        await resetSimulation();
        router.push('/onboarding');
    };

    const COLUMN_WIDTH = 96; // w-24
    const LABEL_WIDTH = 128; // w-32
    const TOTAL_WIDTH = LABEL_WIDTH + (24 * COLUMN_WIDTH);

    return (
        <div className="min-h-screen bg-zinc-50/50 flex flex-col overflow-hidden relative font-sans">
            {/* Premium Header */}
            <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-white/80 backdrop-blur-xl z-50 border-b border-zinc-100 px-4 md:px-8 flex items-center justify-between">
                <div className="flex items-center space-x-3 md:space-x-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-900 rounded-xl md:rounded-2xl flex items-center justify-center">
                            <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white rounded-lg flex items-center justify-center">
                                <div className="w-0.5 h-0.5 md:w-1 md:h-1 bg-white rounded-full" />
                            </div>
                        </div>
                        <span className="font-black italic text-lg md:text-xl tracking-tighter text-zinc-900">PLANIF.</span>
                    </div>

                    <div className="hidden md:block h-4 w-px bg-zinc-200" />

                    <div className="flex items-center space-x-3">
                        {!user && (
                            <div className="px-2 py-1 md:px-3 md:py-1.5 bg-zinc-50 border border-zinc-100 rounded-lg md:rounded-xl flex items-center space-x-1 md:space-x-2">
                                <span className="text-[8px] md:text-[9px] font-black italic text-zinc-900 leading-none">{transactions.length}/8</span>
                                <span className="text-[6px] md:text-[7px] font-bold text-zinc-300 uppercase tracking-tighter">GUEST</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 md:space-x-4">
                    {/* Settings / Currency */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="px-3 py-1.5 md:px-4 md:py-2 bg-white border border-zinc-100 rounded-xl md:rounded-2xl flex items-center space-x-1 md:space-x-2 shadow-soft hover:shadow-premium transition-all active:scale-95"
                        >
                            <span className="font-black italic text-xs md:text-sm text-zinc-900">{currency}</span>
                            <ChevronDown className={clsx("w-2.5 h-2.5 md:w-3 md:h-3 text-zinc-400 transition-transform", isSettingsOpen && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                            {isSettingsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-50 p-2 z-[60]"
                                >
                                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest p-3">Devise</p>
                                    {currencies.map((c) => (
                                        <button
                                            key={c.symbol}
                                            onClick={() => { setCurrency(c.symbol); setIsSettingsOpen(false); }}
                                            className={clsx(
                                                "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
                                                currency === c.symbol ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 text-zinc-900"
                                            )}
                                        >
                                            <span className="font-black italic text-sm">{c.label}</span>
                                            <span className="font-bold opacity-50">{c.symbol}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="px-3 py-1.5 md:px-4 md:py-2 bg-zinc-900 text-white rounded-xl md:rounded-2xl flex items-center space-x-2 md:space-x-3 shadow-premium hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all active:scale-95"
                        >
                            <span className="font-black italic text-xs md:text-sm tracking-tight">{user?.email?.split('@')[0] || 'Invité'}</span>
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-white/20 flex items-center justify-center">
                                <ChevronDown className={clsx("w-2.5 h-2.5 md:w-3 md:h-3 transition-transform", isMenuOpen && "rotate-180")} />
                            </div>
                        </button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-56 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-50 p-3 z-[60]"
                                >
                                    <button
                                        onClick={() => setIsResetModalOpen(true)}
                                        className="w-full flex items-center space-x-3 p-4 rounded-2xl text-zinc-600 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        <span className="font-black italic text-sm">Nouvelle simulation</span>
                                    </button>
                                    <div className="h-px bg-zinc-50 my-2" />
                                    {user ? (
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center space-x-3 p-4 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="font-black italic text-sm">Déconnexion</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleLogin}
                                            className="w-full flex items-center space-x-3 p-4 rounded-2xl text-zinc-900 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                                        >
                                            <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center">
                                                <Plus className="w-2 h-2 text-white" />
                                            </div>
                                            <span className="font-black italic text-sm">Se connecter</span>
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-4 md:px-6 pt-24 md:pt-28 pb-32 no-scrollbar">
                <KPISection />

                <div className="space-y-8">
                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto no-scrollbar pb-8 -mx-4 md:-mx-6 px-4 md:px-6"
                    >
                        <div style={{ width: `${TOTAL_WIDTH}px` }} className="space-y-4">
                            <div className="relative">
                                <CashflowGraph
                                    width={TOTAL_WIDTH}
                                    height={showDetails ? 240 : (typeof window !== 'undefined' && window.innerWidth < 768 ? 320 : 480)}
                                    leftPadding={LABEL_WIDTH}
                                />
                            </div>

                            {/* Light Toggle Button on the left */}
                            <div className="flex justify-start">
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="flex items-center space-x-2 px-5 md:px-6 py-3 md:py-2.5 bg-white rounded-2xl shadow-soft border border-zinc-100 group transition-all active:scale-95 hover:bg-zinc-50"
                                >
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                        {showDetails ? (typeof window !== 'undefined' && window.innerWidth < 768 ? "Masquer" : "Masquer les détails") : "Voir les recettes et dépenses"}
                                    </span>
                                    <motion.div
                                        animate={{ rotate: showDetails ? 180 : 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    >
                                        <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                                    </motion.div>
                                </button>
                            </div>

                            <AnimatePresence>
                                {showDetails && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <TimelineView />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>

            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {isResetModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden p-6 md:p-8 text-center"
                        >
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-50 rounded-[24px] md:rounded-[32px] flex items-center justify-center mx-auto mb-6">
                                <Plus className="w-8 h-8 md:w-10 md:h-10 text-rose-500 rotate-45" />
                            </div>
                            <h3 className="text-lg md:text-xl font-black italic tracking-tighter text-zinc-900 mb-2">Tout effacer ?</h3>
                            <p className="text-zinc-400 text-xs md:text-sm font-medium leading-relaxed mb-8">
                                Cette action supprimera définitivement tous vos flux et réinitialisera votre simulation.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={handleReset}
                                    className="w-full py-4 md:py-5 bg-rose-500 text-white rounded-[20px] md:rounded-[24px] font-black italic shadow-premium active:scale-95 transition-all text-sm md:text-base"
                                >
                                    Oui, réinitialiser
                                </button>
                                <button
                                    onClick={() => setIsResetModalOpen(false)}
                                    className="w-full py-3 md:py-4 bg-zinc-50 text-zinc-400 rounded-[20px] md:rounded-[24px] font-black italic active:scale-95 transition-all text-[10px] md:text-xs uppercase tracking-widest"
                                >
                                    Annuler
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
