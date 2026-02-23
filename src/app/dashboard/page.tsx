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
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col overflow-hidden">
            {/* Header */}
            <header className="px-6 py-4 flex justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                <h1 className="text-xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase">Planif-Treso</h1>
                <button className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    <Settings className="w-5 h-5" />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
                <KPISection />

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Cashflow Projection</h2>
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 text-xs font-bold rounded-full bg-zinc-900 text-white">Line</button>
                            <button className="px-3 py-1 text-xs font-bold rounded-full bg-zinc-100 text-zinc-400">Detail</button>
                        </div>
                    </div>
                    <CashflowGraph />
                </div>
            </main>

            {/* Collapsible Editor Panel */}
            <motion.div
                initial={false}
                animate={{ height: isPanelExpanded ? '85%' : '80px' }}
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[40px] shadow-2xl border-t border-zinc-100 dark:border-zinc-800 z-40 flex flex-col overflow-hidden"
            >
                <button
                    onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                    className="w-full h-[80px] flex items-center justify-between px-8 flex-shrink-0"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-zinc-900 dark:bg-zinc-100 rounded-xl">
                            <Plus className="w-5 h-5 text-white dark:text-zinc-900" />
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">Manage Transactions</span>
                    </div>
                    {isPanelExpanded ? <ChevronDown className="w-6 h-6 text-zinc-400" /> : <ChevronUp className="w-6 h-6 text-zinc-400" />}
                </button>

                <div className="flex-1 overflow-hidden">
                    <TransactionList />
                </div>
            </motion.div>
        </div>
    );
}
