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

export default function DashboardPage() {
    const [isPanelExpanded, setIsPanelExpanded] = useState(false);
    const [view, setView] = useState<'line' | 'detail'>('detail');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { initAuth, user } = useFinanceStore();

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    const handleLogin = async () => {
        // Simple Magic Link login for family/friends
        const email = window.prompt("Entrez votre email pour vous connecter :");
        if (email) {
            await supabase.auth.signInWithOtp({ email });
            alert("Lien magique envoyé ! Vérifiez vos emails.");
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const COLUMN_WIDTH = 96; // w-24
    const LABEL_WIDTH = 160; // w-40
    const TOTAL_WIDTH = LABEL_WIDTH + (24 * COLUMN_WIDTH);

    return (
        <div className="min-h-screen bg-transparent flex flex-col overflow-hidden relative z-10 font-sans">
            <header className="px-6 py-4 flex justify-between items-center bg-transparent">
                <div className="flex items-center space-x-4">
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter text-zinc-900 uppercase leading-none">Planif-Treso</h1>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-0.5 leading-none mt-1">Maîtrisez vos flux</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white shadow-soft text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all border border-zinc-50"
                        >
                            <UserIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleLogin}
                            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-zinc-900 text-white shadow-premium text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                        >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Connexion</span>
                        </button>
                    )}
                    <button className="p-2.5 rounded-xl bg-white shadow-soft text-zinc-400 active:scale-95 transition-transform hover:text-zinc-900">
                        <Settings className="w-4.5 h-4.5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
                <KPISection />

                <div className="space-y-4">
                    <div className="flex justify-between items-end px-2">
                        <div>
                            <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-0.5">Projection</h2>
                            <p className="text-lg font-black text-zinc-900 italic tracking-tight">Horizon Financier</p>
                        </div>
                        <div className="flex bg-white p-1 rounded-2xl shadow-soft">
                            <button
                                onClick={() => setView('line')}
                                className={clsx("px-4 py-2 text-xs font-black rounded-xl transition-all", view === 'line' ? "bg-zinc-900 text-white" : "text-zinc-300 hover:text-zinc-500")}
                            >
                                LIGNE
                            </button>
                            <button
                                onClick={() => setView('detail')}
                                className={clsx("px-4 py-2 text-xs font-black rounded-xl transition-all", view === 'detail' ? "bg-zinc-900 text-white" : "text-zinc-300 hover:text-zinc-500")}
                            >
                                DETAIL
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Container for Graph + Timeline */}
                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto no-scrollbar pb-4"
                    >
                        <div style={{ width: `${TOTAL_WIDTH}px` }} className="space-y-4">
                            <div className="pl-40">
                                <CashflowGraph width={TOTAL_WIDTH - LABEL_WIDTH} height={view === 'detail' ? 240 : 320} />
                            </div>

                            {view === 'detail' && (
                                <TimelineView />
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Collapsible Editor Panel */}
            <motion.div
                initial={false}
                animate={{
                    height: isPanelExpanded ? '85%' : '88px',
                    y: 0
                }}
                className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.1)] rounded-t-[48px] z-40 flex flex-col overflow-hidden border-t border-zinc-50"
            >
                <button
                    onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                    className="w-full h-[88px] flex items-center justify-between px-10 flex-shrink-0 group"
                >
                    <div className="flex items-center space-x-5">
                        <div className="p-3 bg-zinc-900 rounded-2xl group-active:scale-90 transition-transform shadow-premium">
                            <Plus className="w-5 h-5 text-white stroke-[3px]" />
                        </div>
                        <div>
                            <span className="block font-black text-lg text-zinc-900 italic tracking-tight text-left">Gestion des flux</span>
                            <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none text-left">Gérer vos transactions</span>
                        </div>
                    </div>
                    <div className="bg-zinc-50 p-2 rounded-xl">
                        {isPanelExpanded ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronUp className="w-5 h-5 text-zinc-400" />}
                    </div>
                </button>

                <div className="flex-1 overflow-hidden">
                    <TransactionList />
                </div>
            </motion.div>

        </div>
    );
}
