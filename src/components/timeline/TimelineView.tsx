'use client';

import React, { useState } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx } from 'clsx';
import { motion, useDragControls } from 'framer-motion';

export function TimelineView() {
    const { transactions, updateTransaction, startingMonth } = useFinanceStore();
    const projection = useProjection(24);

    const months = Array.from({ length: 24 }).map((_, i) => {
        const date = addMonths(parseISO(`${startingMonth}-01`), i);
        return format(date, 'yyyy-MM');
    });

    const incomeTransactions = transactions.filter(t => t.direction === 'income' && t.amount > 0 && t.label);
    const expenseTransactions = transactions.filter(t => t.direction === 'expense' && t.amount > 0 && t.label);

    const recurringIncome = incomeTransactions.filter(t => t.recurrence !== 'none');
    const recurringExpense = expenseTransactions.filter(t => t.recurrence !== 'none');
    const oneOffTransactions = transactions.filter(t => t.recurrence === 'none' && t.amount > 0 && t.label);

    return (
        <div className="w-full flex flex-col space-y-4 select-none">
            <div className="inline-flex flex-col min-w-full">
                {/* Header: Months */}
                <div className="flex border-b border-zinc-100 pb-2">
                    <div className="w-40 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20 px-4 font-black text-[10px] uppercase tracking-widest text-zinc-300">
                        Flux
                    </div>
                    {months.map((m) => (
                        <div key={m} className="w-24 flex-shrink-0 text-center font-black italic text-xs text-zinc-400 capitalize">
                            {format(parseISO(`${m}-01`), 'MMM yy', { locale: fr })}
                        </div>
                    ))}
                </div>

                {/* Section: Recurring Income (Lignes) */}
                {recurringIncome.length > 0 && (
                    <>
                        <SectionLabel label="Recettes" color="text-amber-500" />
                        {recurringIncome.map(tx => (
                            <TimelineRow key={tx.id} transaction={tx} months={months} type="line" color="amber" />
                        ))}
                    </>
                )}

                {/* Section: Recurring Expense (Lignes) */}
                {recurringExpense.length > 0 && (
                    <>
                        <SectionLabel label="Dépenses" color="text-zinc-900" />
                        {recurringExpense.map(tx => (
                            <TimelineRow key={tx.id} transaction={tx} months={months} type="line" color="zinc" />
                        ))}
                    </>
                )}

                {/* Section: Mixed One-off (Pills) */}
                <SectionLabel label="Ponctuel" color="text-zinc-400" />
                <div className="flex relative">
                    <div className="w-40 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20" />
                    <div className="flex">
                        {months.map(m => (
                            <div key={m} className="w-24 flex-shrink-0 flex flex-col items-center justify-start py-4 space-y-2 border-l border-zinc-50 border-dashed min-h-[100px]">
                                {oneOffTransactions.filter(t => t.month === m).map(t => (
                                    <Pill key={t.id} transaction={t} color={t.direction === 'income' ? 'amber' : 'zinc'} months={months} />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionLabel({ label, color }: { label: string, color: string }) {
    return (
        <div className="flex mt-4 mb-1">
            <div className={clsx("w-40 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20 px-4 font-black text-[9px] uppercase tracking-[0.2em]", color)}>
                {label}
            </div>
        </div>
    );
}

function TimelineRow({ transaction, months, type, color }: { transaction: any, months: string[], type: 'line' | 'pill', color: 'amber' | 'zinc' }) {
    const { updateTransaction } = useFinanceStore();
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [isEditingAmount, setIsEditingAmount] = useState(false);

    const thickness = Math.min(2, Math.max(0.5, Math.sqrt(transaction.amount / 500)));
    const opacity = Math.min(0.5, Math.max(0.1, Math.sqrt(transaction.amount / 1500)));

    return (
        <div className="flex group/row">
            <div className="w-40 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20 px-4 py-1 flex flex-col justify-center border-r border-zinc-50 border-dashed">
                {isEditingLabel ? (
                    <input
                        autoFocus
                        className="bg-zinc-50 p-1 rounded-lg font-black italic text-[11px] outline-none w-full"
                        value={transaction.label}
                        onBlur={() => setIsEditingLabel(false)}
                        onKeyDown={e => e.key === 'Enter' && setIsEditingLabel(false)}
                        onChange={e => updateTransaction(transaction.id, { label: e.target.value })}
                    />
                ) : (
                    <span
                        onClick={() => setIsEditingLabel(true)}
                        className="font-black italic text-zinc-900 text-[11px] leading-tight hover:text-amber-500 cursor-pointer transition-colors truncate"
                    >
                        {transaction.label}
                    </span>
                )}

                {isEditingAmount ? (
                    <input
                        autoFocus
                        type="number"
                        className="bg-zinc-50 p-1 rounded-lg font-bold text-[8px] outline-none w-16"
                        value={transaction.amount}
                        onBlur={() => setIsEditingAmount(false)}
                        onKeyDown={e => e.key === 'Enter' && setIsEditingAmount(false)}
                        onChange={e => updateTransaction(transaction.id, { amount: parseFloat(e.target.value) || 0 })}
                    />
                ) : (
                    <span
                        onClick={() => setIsEditingAmount(true)}
                        className="font-bold text-zinc-300 text-[8px] cursor-pointer hover:text-zinc-600"
                    >
                        {transaction.amount}€ / m
                    </span>
                )}
            </div>

            <div className="flex relative items-center">
                <div
                    className={clsx(
                        "absolute left-0 right-0 z-0",
                        color === 'amber' ? "bg-amber-400" : "bg-zinc-300"
                    )}
                    style={{
                        opacity,
                        height: `${thickness}px`,
                        backgroundImage: `linear-gradient(to right, currentColor 50%, transparent 50%)`,
                        backgroundSize: '8px 100%'
                    }}
                />
                {months.map(m => (
                    <div key={m} className="w-24 h-8 flex-shrink-0 flex items-center justify-center relative">
                        <div className={clsx(
                            "w-1.5 h-1.5 rounded-full z-10 shadow-sm border border-white",
                            color === 'amber' ? "bg-amber-400" : "bg-zinc-900"
                        )} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function Pill({ transaction, color, months }: { transaction: any, color: 'amber' | 'zinc', months: string[] }) {
    const { updateTransaction } = useFinanceStore();
    const [isEditing, setIsEditing] = useState(false);
    const COLUMN_WIDTH = 96; // 24 * 4 = 96px

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
            className={clsx(
                "px-2 py-1 rounded-lg shadow-sm flex flex-col items-center justify-center min-w-[64px] cursor-grab border active:cursor-grabbing",
                color === 'amber' ? "bg-amber-50 border-amber-100" : "bg-white border-zinc-100"
            )}
            onClick={(e) => {
                // If it was a drag, don't open editor (but onClick is complex with drag)
                // framer-motion handles this usually, but let's be safe.
            }}
            onDoubleClick={() => setIsEditing(true)}
        >
            <span className="text-[8px] font-black italic uppercase leading-none mb-1 text-zinc-400 truncate w-12 text-center pointer-events-none">
                {transaction.label}
            </span>
            <span className={clsx("text-[10px] font-black leading-none pointer-events-none", color === 'amber' ? "text-amber-500" : "text-zinc-900")}>
                {transaction.amount}€
            </span>

            {isEditing && (
                <div className="fixed inset-0 bg-black/5 z-[100] flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}>
                    <div className="bg-white p-6 rounded-[32px] shadow-premium space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex bg-zinc-50 p-1 rounded-2xl mb-4">
                            <button onClick={() => updateTransaction(transaction.id, { direction: 'income' })} className={clsx("flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", transaction.direction === 'income' ? "bg-white shadow-soft text-zinc-900" : "text-zinc-400")}>Recette</button>
                            <button onClick={() => updateTransaction(transaction.id, { direction: 'expense' })} className={clsx("flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", transaction.direction === 'expense' ? "bg-white shadow-soft text-zinc-900" : "text-zinc-400")}>Dépense</button>
                        </div>
                        <input
                            autoFocus
                            placeholder="Label"
                            className="block w-full p-4 bg-zinc-50 rounded-2xl font-black italic border-none outline-none"
                            value={transaction.label}
                            onChange={e => updateTransaction(transaction.id, { label: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            className="block w-full p-4 bg-zinc-50 rounded-2xl font-black border-none outline-none text-2xl"
                            value={transaction.amount}
                            onChange={e => updateTransaction(transaction.id, { amount: parseFloat(e.target.value) || 0 })}
                            onKeyDown={e => e.key === 'Enter' && setIsEditing(false)}
                        />
                        <button onClick={() => setIsEditing(false)} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black italic">OK</button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
