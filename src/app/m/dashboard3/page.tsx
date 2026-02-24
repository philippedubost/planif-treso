'use client';

import React, { useState, useMemo } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, Plus, Wallet, Repeat, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { TransactionEditor } from '@/components/lists/TransactionEditor';
import { Transaction } from '@/lib/financeEngine';
import Link from 'next/link';

export default function MobileDashboard3() {
    const {
        startingBalance,
        currency,
        startingMonth,
        transactions,
        showScenarioBadge,
        scenarios,
        currentScenarioId,
        user
    } = useFinanceStore();
    const projection = useProjection();

    const [activeTab, setActiveTab] = useState<'mensuel' | 'ponctuel'>('mensuel');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

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
        setIsEditorOpen(true);
    };

    const handleAdd = () => {
        setSelectedTransaction(null);
        setIsEditorOpen(true);
    };

    const currentScenario = scenarios.find(s => s.id === currentScenarioId);
    const isScenarioVisible = showScenarioBadge && (user || scenarios.length > 0);

    // Compute Mensuel totals
    const recurringIncomes = transactions.filter(t => t.direction === 'income' && t.recurrence !== 'none');
    const recurringExpenses = transactions.filter(t => t.direction === 'expense' && t.recurrence !== 'none');
    const totalRecurringIncome = recurringIncomes.reduce((sum, t) => sum + t.amount, 0);
    const totalRecurringExpense = recurringExpenses.reduce((sum, t) => sum + t.amount, 0);
    const monthlyNet = totalRecurringIncome - totalRecurringExpense;

    // Group ponctuel by month
    const ponctuelTx = transactions.filter(t => t.recurrence === 'none');
    const ponctuelByMonth = useMemo(() => {
        const grouped = new Map<string, Transaction[]>();
        ponctuelTx.forEach(tx => {
            if (!tx.month) return;
            if (!grouped.has(tx.month)) grouped.set(tx.month, []);
            grouped.get(tx.month)!.push(tx);
        });
        // Sort keys
        const sortedKeys = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));
        return sortedKeys.map(key => ({
            month: key,
            transactions: grouped.get(key)!
        }));
    }, [ponctuelTx]);

    const finalBalance12m = projection[projection.length - 1]?.balance || startingBalance;
    const isRisk = finalBalance12m < 0;

    return (
        <div className="min-h-screen bg-zinc-50 font-sans flex flex-col relative pb-28">
            {/* Header Sticky */}
            <header className="sticky top-0 z-40 bg-zinc-50/90 backdrop-blur-xl border-b border-zinc-100 p-4 pt-6 md:pt-8 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link href="/dashboard" className="w-10 h-10 bg-white shadow-sm border border-zinc-100 rounded-full flex items-center justify-center text-zinc-900 active:scale-95 transition-transform">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter text-zinc-900 leading-none">Dashboard 3</h1>
                            {isScenarioVisible && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">
                                    {currentScenario?.name || 'Principal'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Solde Actuel</p>
                        <p className="text-lg font-black tracking-tighter text-zinc-900">{formatCurrency(startingBalance)}</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Proj. 12 mois</p>
                        <p className={clsx("text-lg font-black tracking-tighter", isRisk ? "text-rose-500" : "text-zinc-900")}>
                            {formatCurrency(finalBalance12m)}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-zinc-100 rounded-[20px]">
                    <button
                        onClick={() => setActiveTab('mensuel')}
                        className={clsx(
                            "flex-1 py-2.5 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2",
                            activeTab === 'mensuel' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Mensuel</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('ponctuel')}
                        className={clsx(
                            "flex-1 py-2.5 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2",
                            activeTab === 'ponctuel' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Ponctuel</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'mensuel' && (
                        <motion.div
                            key="mensuel"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-6"
                        >
                            <div className="bg-white rounded-[32px] p-5 shadow-soft border border-white space-y-5">
                                <div className="flex items-end justify-between border-b border-zinc-50 pb-3">
                                    <h2 className="text-base font-black italic uppercase text-zinc-900">Base Mensuelle</h2>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Reste à vivre</p>
                                        <span className={clsx("text-lg font-black tracking-tighter", monthlyNet >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                            {monthlyNet > 0 ? '+' : ''}{formatCurrency(monthlyNet)}
                                        </span>
                                    </div>
                                </div>

                                {/* Recettes */}
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Recettes ({formatCurrency(totalRecurringIncome)})</h3>
                                    <div className="space-y-1 pl-2">
                                        {recurringIncomes.map(tx => (
                                            <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/50 transition-colors active:scale-[0.98]">
                                                <span className="text-xs font-bold text-zinc-700 truncate mr-2">{tx.label || 'Sans nom'}</span>
                                                <span className="text-xs font-black text-emerald-600">+{formatCurrency(tx.amount)}</span>
                                            </button>
                                        ))}
                                        {recurringIncomes.length === 0 && <p className="text-xs text-zinc-400 italic p-2">Aucune recette récurrente</p>}
                                    </div>
                                </div>

                                {/* Dépenses */}
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500">Dépenses ({formatCurrency(totalRecurringExpense)})</h3>
                                    <div className="space-y-1 pl-2">
                                        {recurringExpenses.map(tx => (
                                            <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-rose-100 hover:bg-rose-50/50 transition-colors active:scale-[0.98]">
                                                <span className="text-xs font-bold text-zinc-700 truncate mr-2">{tx.label || 'Sans nom'}</span>
                                                <span className="text-xs font-black text-rose-600">-{formatCurrency(tx.amount)}</span>
                                            </button>
                                        ))}
                                        {recurringExpenses.length === 0 && <p className="text-xs text-zinc-400 italic p-2">Aucune dépense récurrente</p>}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ponctuel' && (
                        <motion.div
                            key="ponctuel"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-4"
                        >
                            {ponctuelByMonth.length === 0 ? (
                                <div className="bg-white rounded-[32px] p-8 text-center shadow-soft border border-white">
                                    <p className="text-zinc-400 font-bold italic">Aucun évènement ponctuel prévu.</p>
                                </div>
                            ) : (
                                ponctuelByMonth.map(group => {
                                    const d = parseISO(`${group.month}-01`);
                                    const sum = group.transactions.reduce((acc, t) => acc + (t.direction === 'income' ? t.amount : -t.amount), 0);

                                    return (
                                        <div key={group.month} className="bg-white rounded-[32px] p-5 shadow-soft border border-white space-y-3">
                                            <div className="flex items-center justify-between border-b border-zinc-50 pb-2">
                                                <h3 className="text-sm font-black italic capitalize text-zinc-900">
                                                    {format(d, 'MMMM yyyy', { locale: fr })}
                                                </h3>
                                                <span className={clsx("text-xs font-black tracking-tighter", sum >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                    {sum > 0 ? '+' : ''}{formatCurrency(sum)}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {group.transactions.map(tx => (
                                                    <button key={tx.id} onClick={() => handleEdit(tx)} className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors active:scale-[0.98]">
                                                        <span className="text-xs font-bold text-zinc-600 truncate mr-2">{tx.label || 'Sans nom'}</span>
                                                        <span className={clsx("text-xs font-black", tx.direction === 'income' ? 'text-emerald-600' : 'text-rose-600')}>
                                                            {tx.direction === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Global Add Button */}
            <div className="fixed bottom-6 left-0 right-0 z-50 px-6">
                <button
                    onClick={() => handleAdd()}
                    className="w-full h-14 bg-zinc-900 text-white rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center justify-center space-x-2 font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Créer une opération</span>
                </button>
            </div>

            {/* Editor Bottom Sheet */}
            <BottomSheet isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)}>
                {isEditorOpen && (
                    <TransactionEditor
                        onClose={() => setIsEditorOpen(false)}
                        initialData={selectedTransaction}
                    />
                )}
            </BottomSheet>
        </div>
    );
}
