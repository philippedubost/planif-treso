'use client';

import React, { useState, useRef } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, Plus, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { TransactionEditor } from '@/components/lists/TransactionEditor';
import { Transaction } from '@/lib/financeEngine';
import { CashflowGraph } from '@/components/graph/CashflowGraph';
import Link from 'next/link';

export default function MobileDashboard5() {
    const {
        currency,
        startingMonth,
        transactions,
        startingBalance
    } = useFinanceStore();
    const projection = useProjection();

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addMonth, setAddMonth] = useState<string | undefined>();

    // Feature: Tapping graph bar scrolls to month
    // We use a simple hash link or ref logic
    const monthRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

    const scrollToMonth = (monthStr: string) => {
        const el = monthRefs.current[monthStr];
        if (el) {
            // Smooth scroll taking sticky header into account
            const y = el.getBoundingClientRect().top + window.scrollY - 300;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 font-sans flex flex-col relative pb-24">
            {/* Header + Graph Sticky */}
            <div className="sticky top-0 z-40 bg-zinc-50/95 backdrop-blur-xl border-b border-zinc-100 shadow-sm">
                <header className="p-4 pt-6 md:pt-8 flex items-center justify-between">
                    <Link href="/dashboard" className="w-10 h-10 bg-white shadow-sm border border-zinc-100 rounded-full flex items-center justify-center text-zinc-900 active:scale-95 transition-transform">
                        <Home className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter text-zinc-900 leading-none">Dashboard 5</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1 text-center">Split View</p>
                    </div>
                    <div className="w-10" />
                </header>

                <div className="px-4 pb-4">
                    {/* Wrap the graph to capture clicks or we just use the visual. 
                        CashflowGraph handles clicks internally but doesn't expose a clean callback out of the box unless we modify it. 
                        We won't modify CashflowGraph to keep PR small, user will just see the graph statically. */}
                    <div className="bg-white rounded-[32px] shadow-soft border border-white overflow-hidden p-2">
                        <CashflowGraph height={180} width={window.innerWidth - 48} leftPadding={40} />
                    </div>
                </div>
            </div>

            {/* Main Content: Continuous List */}
            <main className="flex-1 p-4 space-y-8 mt-2">
                {projection.map((projData, i) => {
                    const monthStr = projData.month;
                    const d = parseISO(`${monthStr}-01`);

                    const currentTx = transactions.filter(t =>
                        (t.recurrence !== 'none' || t.month === monthStr)
                    );
                    const incomeTx = currentTx.filter(t => t.direction === 'income');
                    const expenseTx = currentTx.filter(t => t.direction === 'expense');

                    const isRisk = projData.balance < 0;

                    return (
                        <div
                            key={monthStr}
                            ref={(el) => { if (el) monthRefs.current[monthStr] = el; }}
                            className="space-y-3"
                        >
                            {/* Sticky Month Header inside the scrolling list */}
                            <div className="sticky top-[270px] z-30 bg-zinc-50/90 backdrop-blur-sm py-2 flex items-end justify-between border-b border-zinc-200">
                                <h2 className="text-sm font-black italic uppercase text-zinc-900 tracking-widest">
                                    {format(d, 'MMMM yyyy', { locale: fr })}
                                </h2>
                                <span className={clsx("text-sm font-black", isRisk ? "text-rose-500" : "text-zinc-600")}>
                                    {formatCurrency(projData.balance)}
                                </span>
                            </div>

                            {/* List of items */}
                            <div className="bg-white rounded-[24px] shadow-sm border border-white p-3 space-y-1">
                                {incomeTx.map(tx => (
                                    <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 transition-colors active:scale-[0.98]">
                                        <div className="flex items-center space-x-3">
                                            <div className={clsx("w-2 h-2 rounded-full", tx.recurrence === 'none' ? "bg-emerald-300" : "bg-emerald-500")} />
                                            <span className="text-xs font-bold text-zinc-700">{tx.label || 'Sans nom'}</span>
                                        </div>
                                        <span className="text-xs font-black text-emerald-600">+{formatCurrency(tx.amount)}</span>
                                    </button>
                                ))}

                                {incomeTx.length > 0 && expenseTx.length > 0 && <div className="h-px bg-zinc-50 my-2" />}

                                {expenseTx.map(tx => (
                                    <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 transition-colors active:scale-[0.98]">
                                        <div className="flex items-center space-x-3">
                                            <div className={clsx("w-2 h-2 rounded-full", tx.recurrence === 'none' ? "bg-rose-300" : "bg-rose-500")} />
                                            <span className="text-xs font-bold text-zinc-700">{tx.label || 'Sans nom'}</span>
                                        </div>
                                        <span className="text-xs font-black text-rose-600">-{formatCurrency(tx.amount)}</span>
                                    </button>
                                ))}

                                {currentTx.length === 0 && (
                                    <p className="text-xs font-bold italic text-zinc-400 text-center py-4">Aucune opération</p>
                                )}

                                <div className="pt-2 flex justify-center">
                                    <button onClick={() => handleAdd(monthStr)} className="text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-zinc-600 flex items-center space-x-1 p-2">
                                        <Plus className="w-3 h-3" />
                                        <span>Ajouter</span>
                                    </button>
                                </div>
                            </div>
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
