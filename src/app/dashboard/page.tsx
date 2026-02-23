'use client';

import { useState } from 'react';
import { KPISection } from '@/components/kpi/KPISection';
import { CashflowGraph } from '@/components/graph/CashflowGraph';
import { TransactionList } from '@/components/lists/TransactionList';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Settings, Plus } from 'lucide-react';

export default function DashboardPage() {
    const [isPanelExpanded, setIsPanelExpanded] = useState(false);

    return (
        <div className="min-h-screen bg-[#fdfcf9] flex flex-col overflow-hidden">
            {/* Header */}
            <header className="px-8 py-6 flex justify-between items-center bg-transparent">
                <div>
                    <h1 className="text-2xl font-black italic tracking-tighter text-zinc-900 uppercase">Planif-Treso</h1>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-0.5">Cashflow Master</p>
                </div>
                <button className="p-3 rounded-2xl bg-white shadow-soft text-zinc-400 active:scale-95 transition-transform hover:text-zinc-900">
                    <Settings className="w-5 h-5" />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
                <KPISection />

                <div className="space-y-6">
                    <div className="flex justify-between items-end px-2">
                        <div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Projection</h2>
                            <p className="text-xl font-black text-zinc-900 italic tracking-tight">Financial Horizon</p>
                        </div>
                        <div className="flex bg-white p-1 rounded-2xl shadow-soft">
                            <button className="px-4 py-2 text-xs font-black rounded-xl bg-zinc-900 text-white transition-all">LINE</button>
                            <button className="px-4 py-2 text-xs font-black rounded-xl text-zinc-300 hover:text-zinc-500 transition-all">STARK</button>
                        </div>
                    </div>
                    <CashflowGraph />
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
                            <span className="block font-black text-lg text-zinc-900 italic tracking-tight">Dashboard Editor</span>
                            <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Manage flow</span>
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
