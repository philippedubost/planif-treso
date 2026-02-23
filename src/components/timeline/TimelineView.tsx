'use client';

import React, { useState } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Transaction } from '@/lib/financeEngine';

export function TimelineView() {
    const { transactions, addTransaction, startingMonth } = useFinanceStore();
    const projection = useProjection(24);

    const months = Array.from({ length: 24 }).map((_, i) => {
        const date = addMonths(parseISO(`${startingMonth}-01`), i);
        return format(date, 'yyyy-MM');
    });

    const incomeTransactions = transactions.filter(t => t.direction === 'income');
    const expenseTransactions = transactions.filter(t => t.direction === 'expense');

    const recurringIncome = incomeTransactions.filter(t => t.recurrence !== 'none');
    const recurringExpense = expenseTransactions.filter(t => t.recurrence !== 'none');
    const oneOffTransactions = transactions.filter(t => t.recurrence === 'none');

    // Calculate max amount for dot scaling
    const maxAmount = Math.max(...transactions.map(t => t.amount), 1);

    const handleAdd = async (direction: 'income' | 'expense', month?: string) => {
        await addTransaction({
            label: '',
            amount: 0,
            direction,
            categoryId: direction === 'income' ? 'cat-other' : 'cat-other',
            recurrence: month ? 'none' : 'monthly',
            month: month,
            startMonth: month ? undefined : months[0]
        });
    };

    return (
        <div className="w-full flex flex-col space-y-4 select-none mb-32">
            <div className="inline-flex flex-col min-w-full">
                {/* Header: Months */}
                <div className="flex border-b border-zinc-100 pb-2">
                    <div className="w-32 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20 px-4 font-black text-[10px] uppercase tracking-widest text-zinc-300">
                        Flux
                    </div>
                    {months.map((m) => (
                        <div key={m} className="w-24 flex-shrink-0 text-center font-black italic text-xs text-zinc-400 capitalize">
                            {format(parseISO(`${m}-01`), 'MMM yy', { locale: fr })}
                        </div>
                    ))}
                </div>

                {/* Section: Recurring Income */}
                <SectionLabel
                    label="Recettes"
                    color="text-emerald-500"
                    onAdd={() => handleAdd('income')}
                />
                {recurringIncome.map(tx => (
                    <TimelineRow key={tx.id} transaction={tx} months={months} color="emerald" maxAmount={maxAmount} />
                ))}

                {/* Section: Recurring Expense */}
                <SectionLabel
                    label="Dépenses"
                    color="text-rose-500"
                    onAdd={() => handleAdd('expense')}
                />
                {recurringExpense.map(tx => (
                    <TimelineRow key={tx.id} transaction={tx} months={months} color="rose" maxAmount={maxAmount} />
                ))}

                {/* Section: Mixed One-off */}
                <SectionLabel
                    label="Ponctuel"
                    color="text-zinc-400"
                    onAdd={() => handleAdd('expense', months[0])}
                />
                <div className="flex relative">
                    <div className="w-32 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20" />
                    <div className="flex">
                        {months.map(m => (
                            <div key={m} className="w-24 flex-shrink-0 flex flex-col items-center justify-start py-4 space-y-2 border-l border-zinc-50 border-dashed min-h-[140px]">
                                {oneOffTransactions.filter(t => t.month === m).map(t => (
                                    <Pill key={t.id} transaction={t} color={t.direction === 'income' ? 'emerald' : 'rose'} months={months} />
                                ))}
                                <button
                                    onClick={() => handleAdd('expense', m)}
                                    className="w-16 h-10 rounded-xl border-2 border-dashed border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all flex items-center justify-center group/add"
                                >
                                    <Plus className="w-4 h-4 text-zinc-200 group-hover/add:text-zinc-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionLabel({ label, color, onAdd }: { label: string, color: string, onAdd: () => void }) {
    return (
        <div className="flex mt-6 mb-2 items-center">
            <div className={clsx("w-32 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20 px-4 font-black text-[9px] uppercase tracking-[0.2em] flex items-center space-x-2", color)}>
                <span>{label}</span>
                <button
                    onClick={onAdd}
                    className="p-1 bg-zinc-50 rounded-md hover:bg-zinc-100 transition-colors"
                >
                    <Plus className="w-3 h-3 text-zinc-400" />
                </button>
            </div>
        </div>
    );
}

function TimelineRow({ transaction, months, color, maxAmount }: { transaction: any, months: string[], color: 'emerald' | 'rose', maxAmount: number }) {
    const { updateTransaction, deleteTransaction, currency } = useFinanceStore();
    const [isHovered, setIsHovered] = useState(false);

    const thickness = Math.min(2, Math.max(0.5, Math.sqrt(transaction.amount / 500)));
    const opacity = Math.min(0.5, Math.max(0.1, Math.sqrt(transaction.amount / 1500)));

    // Calculate dot size (min 4px, max 24px)
    const dotSize = 4 + (Math.sqrt(transaction.amount / maxAmount) * 20);

    return (
        <div
            className="flex group/row"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="w-32 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20 px-4 py-1.5 flex flex-col justify-center border-r border-zinc-50 border-dashed relative">
                <input
                    className={clsx(
                        "bg-transparent font-black italic text-[11px] outline-none w-full border-none p-0 focus:bg-zinc-50 focus:px-1 rounded transition-colors mb-0.5",
                        color === 'emerald' ? "text-emerald-500" : "text-rose-500"
                    )}
                    placeholder="Titre..."
                    value={transaction.label}
                    autoFocus={transaction.label === ''}
                    onChange={e => updateTransaction(transaction.id, { label: e.target.value })}
                />

                <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-bold text-zinc-300 pointer-events-none">
                        {transaction.direction === 'expense' ? '-' : '+'}
                    </span>
                    <input
                        type="number"
                        className="bg-transparent font-black text-xs outline-none w-20 border-none p-0 focus:bg-zinc-50 focus:px-1 rounded transition-colors text-zinc-900"
                        value={transaction.amount === 0 ? '' : transaction.amount}
                        placeholder="0"
                        onChange={e => updateTransaction(transaction.id, { amount: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="text-[10px] font-bold text-zinc-300 pointer-events-none">{currency}</span>
                </div>

                {isHovered && (
                    <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-premium z-30 transition-all scale-100 hover:scale-110"
                    >
                        <X className="w-3 h-3 stroke-[3px]" />
                    </button>
                )}
            </div>

            <div className="flex relative items-center">
                <div
                    className={clsx(
                        "absolute left-0 right-0 z-0",
                        color === 'emerald' ? "bg-emerald-400" : "bg-rose-300"
                    )}
                    style={{
                        opacity,
                        height: `${thickness}px`,
                        backgroundImage: `linear-gradient(to right, currentColor 50%, transparent 50%)`,
                        backgroundSize: '8px 100%'
                    }}
                />
                {months.map(m => (
                    <div key={m} className="w-24 h-10 flex-shrink-0 flex items-center justify-center relative">
                        <div
                            className={clsx(
                                "rounded-full z-10 shadow-sm border border-white transition-all",
                                color === 'emerald' ? "bg-emerald-400" : "bg-rose-500"
                            )}
                            style={{
                                width: `${dotSize}px`,
                                height: `${dotSize}px`
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

function Pill({ transaction, color, months }: { transaction: any, color: 'emerald' | 'rose', months: string[] }) {
    const { updateTransaction, deleteTransaction, currency } = useFinanceStore();
    const [isHovered, setIsHovered] = useState(false);
    const COLUMN_WIDTH = 96;

    const handleDragEnd = (event: any, info: any) => {
        const offset = Math.round(info.offset.x / COLUMN_WIDTH);
        if (offset !== 0) {
            const currentIndex = months.indexOf(transaction.month);
            const nextIndex = Math.max(0, Math.min(months.length - 1, currentIndex + offset));
            const nextMonth = months[nextIndex];
            updateTransaction(transaction.id, { month: nextMonth });
        }
    };

    return (
        <motion.div
            drag="x"
            dragMomentum={false}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1, zIndex: 100, cursor: 'grabbing' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={clsx(
                "px-2 py-2 rounded-xl shadow-sm flex flex-col items-center justify-center min-w-[72px] cursor-grab border active:cursor-grabbing relative group",
                color === 'emerald' ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
            )}
        >
            <input
                className="bg-transparent text-[9px] font-black italic uppercase leading-none mb-1 text-zinc-400 text-center w-full outline-none border-none p-0"
                value={transaction.label}
                placeholder="Flux..."
                autoFocus={transaction.label === ''}
                onChange={e => updateTransaction(transaction.id, { label: e.target.value })}
            />
            <div className="flex items-center justify-center space-x-0.5">
                <span className={clsx("text-xs font-black leading-none", color === 'emerald' ? "text-emerald-500" : "text-rose-500")}>
                    {transaction.direction === 'expense' ? '-' : '+'}
                </span>
                <input
                    type="number"
                    className={clsx(
                        "bg-transparent text-xs font-black leading-none w-14 text-center outline-none border-none p-0",
                        color === 'emerald' ? "text-emerald-600" : "text-rose-600"
                    )}
                    value={transaction.amount === 0 ? '' : transaction.amount}
                    placeholder="0"
                    onChange={e => updateTransaction(transaction.id, { amount: parseFloat(e.target.value) || 0 })}
                />
                <span className={clsx("text-[10px] font-bold leading-none", color === 'emerald' ? "text-emerald-300" : "text-rose-300")}>
                    {currency}
                </span>
            </div>

            {isHovered && (
                <button
                    onClick={() => deleteTransaction(transaction.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-premium z-50 transition-all opacity-0 group-hover:opacity-100"
                >
                    <X className="w-3 h-3 stroke-[3px]" />
                </button>
            )}
        </motion.div>
    );
}
