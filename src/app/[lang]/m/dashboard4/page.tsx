'use client';

import React, { useState } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { TransactionEditor } from '@/components/lists/TransactionEditor';
import { Transaction } from '@/lib/financeEngine';
import Link from 'next/link';

export default function MobileDashboard4() {
    const {
        currency,
        startingMonth,
        projectionMonths,
        transactions,
        startingBalance
    } = useFinanceStore();
    const projection = useProjection();

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [slideDirection, setSlideDirection] = useState(1);

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

    const handleAdd = () => {
        setSelectedTransaction(null);
        setIsAdding(true);
        setIsEditorOpen(true);
    };

    const nextMonth = () => {
        if (selectedIndex < projection.length - 1) {
            setSlideDirection(1);
            setSelectedIndex(selectedIndex + 1);
        }
    };

    const prevMonth = () => {
        if (selectedIndex > 0) {
            setSlideDirection(-1);
            setSelectedIndex(selectedIndex - 1);
        }
    };

    const currentMonthData = projection[selectedIndex];
    if (!currentMonthData) return null;

    const monthStr = currentMonthData.month;
    const d = parseISO(`${monthStr}-01`);

    // Transactions active this month
    const currentTx = transactions.filter(t =>
        (t.recurrence !== 'none' || t.month === monthStr)
    );
    const incomeTx = currentTx.filter(t => t.direction === 'income');
    const expenseTx = currentTx.filter(t => t.direction === 'expense');

    const netCashflow = currentMonthData.income - currentMonthData.expense;
    const startBal = selectedIndex === 0 ? startingBalance : projection[selectedIndex - 1].balance;
    const endBal = currentMonthData.balance;

    // Progress bar calculations
    const totalFlow = currentMonthData.income + currentMonthData.expense;
    const incomePct = totalFlow > 0 ? (currentMonthData.income / totalFlow) * 100 : 50;
    const expensePct = totalFlow > 0 ? (currentMonthData.expense / totalFlow) * 100 : 50;

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    return (
        <div className="min-h-screen bg-zinc-50 font-sans flex flex-col relative pb-24 overflow-hidden">
            {/* Header Sticky */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-100 p-4 pt-6 md:pt-8">
                <div className="flex items-center justify-between mb-4">
                    <Link href="/dashboard" className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-900 active:scale-95 transition-transform">
                        <Home className="w-4 h-4" />
                    </Link>
                    <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Solde du mois</p>
                        <p className="text-xl font-black tracking-tighter text-zinc-900">{formatCurrency(endBal)}</p>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Month Navigator */}
                <div className="flex items-center justify-between bg-zinc-100 rounded-[20px] p-1">
                    <button
                        onClick={prevMonth}
                        disabled={selectedIndex === 0}
                        className="w-10 h-10 rounded-[16px] flex items-center justify-center text-zinc-600 disabled:opacity-30 disabled:pointer-events-none active:bg-white active:shadow-sm transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 text-center overflow-hidden relative h-6">
                        <AnimatePresence mode="popLayout" custom={slideDirection}>
                            <motion.div
                                key={selectedIndex}
                                custom={slideDirection}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <span className="text-sm font-black italic uppercase text-zinc-900 tracking-widest">
                                    {format(d, 'MMMM yyyy', { locale: fr })}
                                </span>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <button
                        onClick={nextMonth}
                        disabled={selectedIndex === projection.length - 1}
                        className="w-10 h-10 rounded-[16px] flex items-center justify-center text-zinc-600 disabled:opacity-30 disabled:pointer-events-none active:bg-white active:shadow-sm transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content (Swipeable/Animated area) */}
            <main className="flex-1 relative">
                <AnimatePresence mode="popLayout" custom={slideDirection}>
                    <motion.div
                        key={selectedIndex}
                        custom={slideDirection}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full absolute inset-0 p-4 space-y-4 overflow-y-auto no-scrollbar pb-32"
                    >
                        {/* Insight Card */}
                        <div className="bg-white rounded-[32px] p-5 shadow-soft border border-white space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-400">Flux Net</span>
                                <span className={clsx("text-lg font-black", netCashflow >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                    {netCashflow > 0 ? '+' : ''}{formatCurrency(netCashflow)}
                                </span>
                            </div>

                            {/* Flow Bar */}
                            <div className="space-y-2">
                                <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${incomePct}%` }} />
                                    <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${expensePct}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
                                    <span className="text-emerald-500">{formatCurrency(currentMonthData.income)}</span>
                                    <span className="text-rose-500">{formatCurrency(currentMonthData.expense)}</span>
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-4">
                            {incomeTx.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-2">Recettes ({formatCurrency(currentMonthData.income)})</h3>
                                    <div className="bg-white rounded-[24px] p-2 shadow-sm border border-zinc-50 space-y-1">
                                        {incomeTx.map(tx => (
                                            <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors active:scale-[0.98]">
                                                <div className="flex items-center space-x-3">
                                                    <div className={clsx("w-2 h-2 rounded-full", tx.recurrence === 'none' ? "bg-emerald-300" : "bg-emerald-500")} />
                                                    <span className="text-sm font-bold text-zinc-700">{tx.label || 'Sans nom'}</span>
                                                </div>
                                                <span className="text-sm font-black text-emerald-600">+{formatCurrency(tx.amount)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {expenseTx.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-2 mt-4">Dépenses ({formatCurrency(currentMonthData.expense)})</h3>
                                    <div className="bg-white rounded-[24px] p-2 shadow-sm border border-zinc-50 space-y-1">
                                        {expenseTx.map(tx => (
                                            <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors active:scale-[0.98]">
                                                <div className="flex items-center space-x-3">
                                                    <div className={clsx("w-2 h-2 rounded-full", tx.recurrence === 'none' ? "bg-rose-300" : "bg-rose-500")} />
                                                    <span className="text-sm font-bold text-zinc-700">{tx.label || 'Sans nom'}</span>
                                                </div>
                                                <span className="text-sm font-black text-rose-600">-{formatCurrency(tx.amount)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentTx.length === 0 && (
                                <div className="text-center p-8 bg-white rounded-[32px] border border-dashed border-zinc-200">
                                    <p className="text-zinc-400 font-bold italic">Aucune opération ce mois-ci.</p>
                                </div>
                            )}
                        </div>

                    </motion.div>
                </AnimatePresence>
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
                        initialData={isAdding ? { month: monthStr, recurrence: 'none' } : selectedTransaction}
                    />
                )}
            </BottomSheet>
        </div>
    );
}
