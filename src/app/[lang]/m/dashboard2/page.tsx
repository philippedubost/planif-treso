'use client';

import React, { useState } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { TransactionEditor } from '@/components/lists/TransactionEditor';
import { Transaction } from '@/lib/financeEngine';
import { CashflowGraph } from '@/components/graph/CashflowGraph';
import Link from 'next/link';

export default function MobileDashboard2() {
    const {
        currency,
        startingMonth,
        projectionMonths,
        transactions,
        showScenarioBadge,
        scenarios,
        currentScenarioId,
        user
    } = useFinanceStore();
    const projection = useProjection();

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addMonth, setAddMonth] = useState<string | undefined>();
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

    const toggleMonth = (monthStr: string) => {
        const next = new Set(expandedMonths);
        if (next.has(monthStr)) next.delete(monthStr);
        else next.add(monthStr);
        setExpandedMonths(next);
    };

    const formatCurrency = (val: number) => {
        const sign = val < 0 ? '-' : '';
        const absVal = Math.abs(val);
        const formatted = new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(absVal);
        return `${sign}${formatted}${currency}`;
    };

    const handleEdit = (tx: Transaction) => {
        setSelectedTransaction(tx);
        setIsAdding(false);
        setIsEditorOpen(true);
    };

    const handleAdd = (month?: string) => {
        setSelectedTransaction(null);
        setAddMonth(month);
        setIsAdding(true);
        setIsEditorOpen(true);
    };

    const currentScenario = scenarios.find(s => s.id === currentScenarioId);
    const isScenarioVisible = showScenarioBadge && (user || scenarios.length > 0);

    return (
        <div className="min-h-screen bg-zinc-50 font-sans flex flex-col relative pb-24">
            {/* Header Sticky */}
            <header className="sticky top-0 z-40 bg-zinc-50/90 backdrop-blur-xl border-b border-zinc-100 p-4 pt-6 md:pt-8 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link href="/dashboard" className="w-10 h-10 bg-white shadow-sm border border-zinc-100 rounded-full flex items-center justify-center text-zinc-900 active:scale-95 transition-transform">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter text-zinc-900 leading-none">Dashboard 2</h1>
                            {isScenarioVisible && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">
                                    {currentScenario?.name || 'Principal'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Top Graph */}
            <div className="px-4 py-4 mt-2">
                <div className="bg-white rounded-[32px] shadow-soft border border-white overflow-hidden p-2">
                    <CashflowGraph height={220} width={window.innerWidth - 48} leftPadding={40} />
                </div>
            </div>

            {/* Main Content: Monthly Cards Accordion */}
            <main className="flex-1 px-4 space-y-4">
                {projection.map((projData, i) => {
                    const monthStr = projData.month;
                    const d = parseISO(`${monthStr}-01`);
                    const isExpanded = expandedMonths.has(monthStr);

                    // Filter transactions active in this month
                    const currentTx = transactions.filter(t =>
                        (t.recurrence !== 'none' || t.month === monthStr)
                    );
                    const incomeTx = currentTx.filter(t => t.direction === 'income');
                    const expenseTx = currentTx.filter(t => t.direction === 'expense');

                    const netCashflow = projData.income - projData.expense;
                    const isRisk = projData.balance < 0;

                    return (
                        <div key={monthStr} className="bg-white rounded-[32px] shadow-soft border border-white overflow-hidden transition-all duration-300">
                            {/* Card Header (Always visible) */}
                            <button
                                onClick={() => toggleMonth(monthStr)}
                                className="w-full text-left p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors"
                            >
                                <div className="space-y-1">
                                    <h2 className="text-lg font-black italic capitalize text-zinc-900">
                                        {format(d, 'MMMM yyyy', { locale: fr })}
                                    </h2>
                                    <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                        <span>Flux Net:</span>
                                        <span className={clsx(netCashflow >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                            {netCashflow > 0 ? '+' : ''}{formatCurrency(netCashflow)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Solde fin</p>
                                        <span className={clsx("text-base font-black tracking-tighter", isRisk ? "text-rose-500" : "text-zinc-900")}>
                                            {formatCurrency(projData.balance)}
                                        </span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </div>
                                </div>
                            </button>

                            {/* Accordion Content */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-zinc-50"
                                    >
                                        <div className="p-5 space-y-4 bg-zinc-50/50">
                                            {/* Incomes */}
                                            {incomeTx.length > 0 && (
                                                <div className="space-y-2">
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 px-2">Recettes ({formatCurrency(projData.income)})</h3>
                                                    <div className="space-y-1">
                                                        {incomeTx.map(tx => (
                                                            <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-white shadow-sm border border-zinc-100 hover:border-emerald-200 transition-all active:scale-[0.98]">
                                                                <div className="flex items-center space-x-2 truncate">
                                                                    <div className={clsx("w-2 h-2 rounded-full", tx.recurrence === 'none' ? "bg-emerald-300" : "bg-emerald-500")} />
                                                                    <span className="text-xs font-bold text-zinc-700 truncate">{tx.label || 'Sans nom'}</span>
                                                                </div>
                                                                <span className="text-xs font-black text-emerald-600">+{formatCurrency(tx.amount)}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expenses */}
                                            {expenseTx.length > 0 && (
                                                <div className="space-y-2">
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500 px-2 mt-4">Dépenses ({formatCurrency(projData.expense)})</h3>
                                                    <div className="space-y-1">
                                                        {expenseTx.map(tx => (
                                                            <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-white shadow-sm border border-zinc-100 hover:border-rose-200 transition-all active:scale-[0.98]">
                                                                <div className="flex items-center space-x-2 truncate">
                                                                    <div className={clsx("w-2 h-2 rounded-full", tx.recurrence === 'none' ? "bg-rose-300" : "bg-rose-500")} />
                                                                    <span className="text-xs font-bold text-zinc-700 truncate">{tx.label || 'Sans nom'}</span>
                                                                </div>
                                                                <span className="text-xs font-black text-rose-600">-{formatCurrency(tx.amount)}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-2 flex justify-center">
                                                <button onClick={() => handleAdd(monthStr)} className="h-10 px-4 bg-white border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 shadow-sm flex items-center space-x-2 active:scale-95 transition-all">
                                                    <Plus className="w-3 h-3" />
                                                    <span>Ajouter opération</span>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </main>

            {/* Global Add Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => handleAdd()}
                    className="w-14 h-14 bg-zinc-900 text-white rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center justify-center font-black active:scale-95 transition-transform"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            {/* Editor Bottom Sheet */}
            <BottomSheet isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)}>
                {isEditorOpen && (
                    <TransactionEditor
                        onClose={() => setIsEditorOpen(false)}
                        initialData={isAdding ? { month: addMonth, recurrence: addMonth ? 'none' : 'monthly' } : selectedTransaction}
                    />
                )}
            </BottomSheet>
        </div>
    );
}
