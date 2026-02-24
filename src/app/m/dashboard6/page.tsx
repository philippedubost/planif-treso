'use client';

import React, { useState } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, Plus, ArrowUpRight, ArrowDownRight, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { TransactionEditor } from '@/components/lists/TransactionEditor';
import { Transaction } from '@/lib/financeEngine';
import Link from 'next/link';

export default function MobileDashboard6() {
    const {
        startingBalance,
        currency,
        transactions,
        user
    } = useFinanceStore();
    const projection = useProjection();

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addMonth, setAddMonth] = useState<string | undefined>();

    const formatCurrency = (val: number, forceSign = false) => {
        const sign = val < 0 ? '-' : forceSign && val > 0 ? '+' : '';
        const absVal = Math.abs(val);
        const formatted = new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(absVal);
        return `${sign}${formatted} ${currency}`;
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

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col relative pb-24">
            {/* Header Sticky */}
            <header className="sticky top-0 z-40 bg-zinc-900 text-white p-4 pt-8 md:pt-10 shadow-premium">
                <div className="flex justify-between items-center mb-6">
                    <Link href="/dashboard" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
                        <Home className="w-5 h-5" />
                    </Link>
                    <div className="flex space-x-2">
                        <button onClick={() => handleAdd()} className="w-10 h-10 bg-white text-zinc-900 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="text-center pb-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Solde Comptable</p>
                    <p className="text-5xl font-black tracking-tighter tabular-nums leading-none">
                        {formatCurrency(startingBalance)}
                    </p>
                </div>

                {/* Visual arch at the bottom of header to merge into white background */}
                <div className="absolute -bottom-4 left-0 right-0 h-4 bg-white rounded-t-[100%]"></div>
            </header>

            {/* Main Content: Chronological Bank Statement */}
            <main className="flex-1 px-4 space-y-6 pt-6">
                {projection.map((projData, i) => {
                    const monthStr = projData.month;
                    const d = parseISO(`${monthStr}-01`);

                    // All active transactions for the month
                    const currentTx = transactions.filter(t =>
                        (t.recurrence !== 'none' || t.month === monthStr)
                    );

                    if (currentTx.length === 0) return null;

                    // Grouping all transactions flatly, maybe sorting larger amounts first for visual hierarchy
                    const sortedTx = [...currentTx].sort((a, b) => b.amount - a.amount);

                    return (
                        <div key={monthStr} className="space-y-2">
                            {/* Month Header */}
                            <div className="sticky top-[200px] z-30 bg-white/95 backdrop-blur-md py-3 flex items-center justify-between border-b border-zinc-100">
                                <h2 className="text-sm font-black italic uppercase text-zinc-900 tracking-widest pl-2">
                                    {format(d, 'MMMM yyyy', { locale: fr })}
                                </h2>
                                <span className={clsx("text-xs font-black px-3 py-1 bg-zinc-100 rounded-full", projData.balance < 0 ? "text-rose-500 bg-rose-50" : "text-zinc-600")}>
                                    Solde prévu: {formatCurrency(projData.balance)}
                                </span>
                            </div>

                            {/* Transactions List */}
                            <div className="space-y-1">
                                {sortedTx.map((tx, idx) => (
                                    <button
                                        key={tx.id}
                                        onClick={() => handleEdit(tx)}
                                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 active:bg-zinc-100 transition-colors group"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={clsx(
                                                "w-10 h-10 rounded-[14px] flex items-center justify-center shadow-sm",
                                                tx.direction === 'income' ? "bg-emerald-50 text-emerald-500" : "bg-zinc-100 text-zinc-900"
                                            )}>
                                                {tx.direction === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                            </div>
                                            <div className="text-left space-y-0.5">
                                                <p className="text-sm font-bold text-zinc-900 truncate max-w-[150px]">{tx.label || 'Virement'}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                    {tx.recurrence === 'none' ? 'Ponctuel' : 'Mensuel'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={clsx(
                                                "text-sm font-black tabular-nums tracking-tighter",
                                                tx.direction === 'income' ? "text-emerald-500" : "text-zinc-900"
                                            )}>
                                                {tx.direction === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {projection.every(p => transactions.filter(t => t.recurrence !== 'none' || t.month === p.month).length === 0) && (
                    <div className="text-center pt-20">
                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-6 h-6 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-black italic text-zinc-900 mb-1">Aucune Opération</h3>
                        <p className="text-sm font-bold text-zinc-400">Commencez par ajouter une recette ou une dépense.</p>
                        <button onClick={() => handleAdd()} className="mt-6 px-6 py-3 bg-zinc-900 text-white rounded-full font-black text-sm active:scale-95 transition-transform">
                            Créer une opération
                        </button>
                    </div>
                )}
            </main>

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
