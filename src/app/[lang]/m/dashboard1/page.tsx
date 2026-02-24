'use client';

import React, { useState } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, Plus, Wallet, TrendingUp, TrendingDown, EyeOff, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { TransactionEditor } from '@/components/lists/TransactionEditor';
import { Transaction } from '@/lib/financeEngine';
import Link from 'next/link';

export default function MobileDashboard1() {
    const {
        startingBalance,
        currency,
        startingMonth,
        projectionMonths,
        transactions,
        addTransaction,
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

    const months = Array.from({ length: projectionMonths }).map((_, i) => addMonths(parseISO(`${startingMonth}-01`), i));

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
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-100 p-4 pt-6 md:pt-8 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link href="/dashboard" className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-900 active:scale-95 transition-transform">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter text-zinc-900 leading-none">Dashboard 1</h1>
                            {isScenarioVisible && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">
                                    {currentScenario?.name || 'Principal'}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Solde Actuel</p>
                        <p className="text-xl font-black tracking-tighter text-zinc-900">{formatCurrency(startingBalance)}</p>
                    </div>
                </div>
            </header>

            {/* Main Content: Vertical Timeline */}
            <main className="flex-1 p-4 space-y-6">
                {months.map((d, i) => {
                    const monthStr = format(d, 'yyyy-MM');
                    const projData = projection.find(p => p.month === monthStr);

                    // Filter transactions active in this month
                    const incomeTx = transactions.filter(t =>
                        t.direction === 'income' &&
                        (t.recurrence !== 'none' || t.month === monthStr)
                    );
                    const expenseTx = transactions.filter(t =>
                        t.direction === 'expense' &&
                        (t.recurrence !== 'none' || t.month === monthStr)
                    );

                    // Separate recurring vs one-off
                    const recurringIncome = incomeTx.filter(t => t.recurrence !== 'none');
                    const recurringExpense = expenseTx.filter(t => t.recurrence !== 'none');
                    const ponctuel = [...incomeTx, ...expenseTx].filter(t => t.recurrence === 'none');

                    const startBal = i === 0 ? startingBalance : projection[i - 1]?.balance || 0;
                    const endBal = projData?.balance || 0;
                    const isRisk = endBal < 0;

                    return (
                        <div key={monthStr} className="bg-white rounded-[32px] p-5 shadow-soft border border-white space-y-4">
                            {/* Month Header */}
                            <div className="flex items-end justify-between border-b border-zinc-50 pb-3">
                                <h2 className="text-lg font-black italic capitalize text-zinc-900">
                                    {format(d, 'MMMM yyyy', { locale: fr })}
                                </h2>
                                <div className="text-right">
                                    <span className={clsx(
                                        "text-sm font-black tracking-tighter",
                                        isRisk ? "text-rose-500" : "text-zinc-900"
                                    )}>
                                        {formatCurrency(endBal)}
                                    </span>
                                </div>
                            </div>

                            {/* Recettes */}
                            {recurringIncome.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-emerald-500">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Recettes Mensuelles</span>
                                    </div>
                                    <div className="space-y-1 pl-5">
                                        {recurringIncome.map(tx => (
                                            <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 transition-colors active:scale-[0.98]">
                                                <span className="text-xs font-bold text-zinc-600 truncate mr-2">{tx.label || 'Sans nom'}</span>
                                                <span className="text-xs font-black text-emerald-600">+{formatCurrency(tx.amount)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dépenses */}
                            {recurringExpense.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-rose-500">
                                        <TrendingDown className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Dépenses Mensuelles</span>
                                    </div>
                                    <div className="space-y-1 pl-5">
                                        {recurringExpense.map(tx => (
                                            <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 transition-colors active:scale-[0.98]">
                                                <span className="text-xs font-bold text-zinc-600 truncate mr-2">{tx.label || 'Sans nom'}</span>
                                                <span className="text-xs font-black text-rose-600">-{formatCurrency(tx.amount)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ponctuel */}
                            {ponctuel.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-zinc-50">
                                    <div className="flex items-center space-x-2 text-zinc-900">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Évènements Ponctuels</span>
                                    </div>
                                    <div className="space-y-1 pl-5">
                                        {ponctuel.map(tx => (
                                            <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors active:scale-[0.98]">
                                                <span className="text-xs font-bold text-zinc-600 truncate mr-2">{tx.label || 'Sans nom'}</span>
                                                <span className={clsx("text-xs font-black", tx.direction === 'income' ? 'text-emerald-600' : 'text-rose-600')}>
                                                    {tx.direction === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex justify-center">
                                <button onClick={() => handleAdd(monthStr)} className="text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-zinc-600 flex items-center space-x-1 p-2">
                                    <Plus className="w-3 h-3" />
                                    <span>Ajouter pour ce mois</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* Global Add Button */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={() => handleAdd()}
                    className="h-14 px-6 bg-zinc-900 text-white rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center space-x-2 font-black italic active:scale-95 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nouvelle opération</span>
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
