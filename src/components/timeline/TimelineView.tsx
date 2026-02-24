'use client';

import React, { useState, useEffect } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Transaction } from '@/lib/financeEngine';

export function TimelineView() {
    const { transactions, addTransaction, startingMonth, projectionMonths, tutorialStep } = useFinanceStore();
    const projection = useProjection();

    const months = Array.from({ length: projectionMonths }).map((_, i) => {
        const date = addMonths(parseISO(`${startingMonth}-01`), i);
        return format(date, 'yyyy-MM');
    });

    const incomeTransactions = transactions.filter(t => t.direction === 'income');
    const expenseTransactions = transactions.filter(t => t.direction === 'expense');

    const recurringIncome = incomeTransactions.filter(t => t.recurrence !== 'none');
    const recurringExpense = expenseTransactions.filter(t => t.recurrence !== 'none');
    const oneOffTransactions = transactions.filter(t => t.recurrence === 'none');

    // Calculate max amount for dot scaling (excluding one-off transactions)
    const maxAmount = Math.max(...transactions.filter(t => t.recurrence !== 'none').map(t => t.amount), 1);

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
                {/* Section: Recurring Income */}
                <div className="flex mt-6 mb-2 items-center">
                    <div className="w-32 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20 px-4 font-black text-[11px] uppercase tracking-[0.2em] text-zinc-900">
                        Mensuel
                    </div>
                </div>
                <SectionLabel
                    label="Recettes"
                    color="text-emerald-500"
                    onAdd={() => handleAdd('income')}
                    className="mt-2 mb-2"
                />
                <div className={clsx(
                    "transition-all duration-300 rounded-3xl",
                    tutorialStep === 2 && "z-[101] relative ring-4 ring-zinc-900 pointer-events-auto bg-white/50 p-2 shadow-[0_0_50px_rgba(0,0,0,0.3)]"
                )}>
                    {recurringIncome.map(tx => (
                        <TimelineRow key={tx.id} transaction={tx} months={months} color="emerald" maxAmount={maxAmount} />
                    ))}
                    {recurringIncome.length === 0 && tutorialStep === 2 && (
                        <div className="text-center py-4 text-zinc-400 text-xs font-bold italic">
                            Clique sur + pour ajouter
                        </div>
                    )}
                </div>

                <SectionLabel
                    label="Dépenses"
                    color="text-rose-500"
                    onAdd={() => handleAdd('expense')}
                    className="mt-4 mb-2"
                />
                <div className={clsx(
                    "transition-all duration-300 rounded-3xl",
                    tutorialStep === 3 && "z-[101] relative ring-4 ring-zinc-900 pointer-events-auto bg-white/50 p-2 shadow-[0_0_50px_rgba(0,0,0,0.3)]"
                )}>
                    {recurringExpense.map(tx => (
                        <TimelineRow key={tx.id} transaction={tx} months={months} color="rose" maxAmount={maxAmount} />
                    ))}
                    {recurringExpense.length === 0 && tutorialStep === 3 && (
                        <div className="text-center py-4 text-zinc-400 text-xs font-bold italic">
                            Clique sur + pour ajouter
                        </div>
                    )}
                </div>

                {/* Section: Mixed One-off */}
                <div className="flex mt-8 mb-4 items-center">
                    <div className="w-32 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20 px-4 font-black text-[11px] uppercase tracking-[0.2em] text-zinc-900">
                        Ponctuel
                    </div>
                </div>
                <div className={clsx(
                    "flex relative transition-all duration-300 rounded-3xl",
                    tutorialStep === 4 && "z-[101] ring-4 ring-zinc-900 pointer-events-auto bg-white/50 p-2 shadow-[0_0_50px_rgba(0,0,0,0.3)]"
                )}>
                    <div className="w-32 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20" />
                    <div className="flex flex-1">
                        {months.map(m => (
                            <div key={m} className="flex-1 min-w-[96px] flex flex-col items-center justify-start py-4 space-y-2 border-l border-zinc-100 border-dashed min-h-[140px]">
                                {oneOffTransactions.filter(t => t.month === m).map(t => (
                                    <Pill key={t.id} transaction={t} color={t.direction === 'income' ? 'emerald' : 'rose'} months={months} />
                                ))}
                                <button
                                    onClick={() => handleAdd('expense', m)}
                                    className={clsx(
                                        "w-16 h-10 rounded-xl border-2 border-dashed transition-all flex items-center justify-center group/add",
                                        tutorialStep === 4 ? "border-zinc-400 bg-white hover:border-zinc-900 hover:bg-zinc-100 animate-pulse" : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
                                    )}
                                >
                                    <Plus className="w-4 h-4 text-zinc-400 group-hover/add:text-zinc-600" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionLabel({ label, color, onAdd, className }: { label: string, color: string, onAdd?: () => void, className?: string }) {
    return (
        <div className={clsx("flex items-center", className || "mt-6 mb-2")}>
            <div className={clsx("w-32 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20 px-4 font-black text-[9px] uppercase tracking-[0.2em] flex items-center space-x-2", color)}>
                <span>{label}</span>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="p-1 bg-zinc-50 rounded-md hover:bg-zinc-100 transition-colors"
                    >
                        <Plus className="w-3 h-3 text-zinc-400" />
                    </button>
                )}
            </div>
        </div>
    );
}

function TimelineRow({ transaction, months, color, maxAmount }: { transaction: any, months: string[], color: 'emerald' | 'rose', maxAmount: number }) {
    const { updateTransaction, deleteTransaction, currency } = useFinanceStore();
    const [isHovered, setIsHovered] = useState(false);

    const [localLabel, setLocalLabel] = useState(transaction.label);
    const [localAmount, setLocalAmount] = useState(transaction.amount === 0 ? '' : transaction.amount.toString());

    useEffect(() => {
        setLocalLabel(transaction.label);
        setLocalAmount(transaction.amount === 0 ? '' : transaction.amount.toString());
    }, [transaction.label, transaction.amount]);

    const handleLabelCommit = () => {
        if (localLabel !== transaction.label) {
            updateTransaction(transaction.id, { label: localLabel });
        }
    };

    const handleAmountCommit = () => {
        const val = parseFloat(localAmount) || 0;
        const finalVal = Math.abs(val);
        if (finalVal !== transaction.amount) {
            updateTransaction(transaction.id, { amount: finalVal });
            setLocalAmount(finalVal === 0 ? '' : finalVal.toString());
        } else {
            setLocalAmount(finalVal === 0 ? '' : finalVal.toString());
        }
    };

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
                    value={localLabel}
                    autoFocus={transaction.label === ''}
                    onChange={e => setLocalLabel(e.target.value)}
                    onBlur={handleLabelCommit}
                    onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                />

                <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-bold text-zinc-300 pointer-events-none">
                        {transaction.direction === 'expense' ? '-' : '+'}
                    </span>
                    <input
                        type="number"
                        className="bg-transparent font-black text-xs outline-none w-20 border-none p-0 focus:bg-zinc-50 focus:px-1 rounded transition-colors text-zinc-900"
                        value={localAmount}
                        placeholder="0"
                        onChange={e => setLocalAmount(e.target.value)}
                        onBlur={handleAmountCommit}
                        onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
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

            <div className="flex flex-1 relative items-center">
                <div
                    className={clsx(
                        "absolute z-0",
                        color === 'emerald' ? "bg-emerald-400" : "bg-rose-300"
                    )}
                    style={{
                        opacity,
                        height: `${thickness}px`,
                        left: `calc(50% / ${months.length})`,
                        right: `calc(50% / ${months.length})`,
                        backgroundImage: `linear-gradient(to right, currentColor 50%, transparent 50%)`,
                        backgroundSize: '8px 100%'
                    }}
                />
                {months.map(m => (
                    <div key={m} className="flex-1 min-w-[96px] h-10 flex items-center justify-center relative">
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
    const { updateTransaction, deleteTransaction, addTransaction, currency } = useFinanceStore();
    const [isHovered, setIsHovered] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);
    const COLUMN_WIDTH = 96;

    const displayAmount = transaction.direction === 'expense' ? -transaction.amount : transaction.amount;
    const [localLabel, setLocalLabel] = useState(transaction.label);
    const [localAmount, setLocalAmount] = useState(transaction.amount === 0 ? '' : displayAmount.toString());

    useEffect(() => {
        setLocalLabel(transaction.label);
        setLocalAmount(transaction.amount === 0 ? '' : (transaction.direction === 'expense' ? -transaction.amount : transaction.amount).toString());
    }, [transaction.label, transaction.amount, transaction.direction]);

    const handleLabelCommit = () => {
        if (localLabel !== transaction.label) {
            updateTransaction(transaction.id, { label: localLabel });
        }
    };

    const handleAmountCommit = () => {
        const val = parseFloat(localAmount) || 0;
        const newAmount = Math.abs(val);
        const newDirection = val < 0 ? 'expense' : 'income';

        if (newAmount !== transaction.amount || newDirection !== transaction.direction) {
            updateTransaction(transaction.id, {
                amount: newAmount,
                direction: newDirection
            });
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) setIsCtrlPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) setIsCtrlPressed(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleDragStart = (event: any) => {
        if (event.ctrlKey || event.metaKey) {
            setIsDuplicating(true);
            // Create the "staying behind" clone immediately
            addTransaction({
                ...transaction,
                id: undefined, // Let store generate new ID
                // stays at transaction.month
            });
        } else {
            setIsDuplicating(false);
        }
    };

    const handleDragEnd = (event: any, info: any) => {
        const offset = Math.round(info.offset.x / COLUMN_WIDTH);
        if (offset !== 0) {
            const currentIndex = months.indexOf(transaction.month);
            const nextIndex = Math.max(0, Math.min(months.length - 1, currentIndex + offset));
            const nextMonth = months[nextIndex];

            // Always move the current one (it's either a simple move or the "moving copy" of a duplication)
            updateTransaction(transaction.id, { month: nextMonth });
        }
        setIsDuplicating(false);
    };

    return (
        <motion.div
            layout
            drag="x"
            dragMomentum={false}
            dragElastic={0.1}
            dragSnapToOrigin={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1, zIndex: 100, cursor: isCtrlPressed ? 'copy' : 'grabbing' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={clsx(
                "px-2 py-2 rounded-xl shadow-sm flex flex-col items-center justify-center min-w-[72px] cursor-grab border active:cursor-grabbing relative group transition-colors",
                transaction.direction === 'income' ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
            )}
        >
            <input
                className="bg-transparent text-[9px] font-black italic uppercase leading-none mb-1 text-zinc-400 text-center w-full outline-none border-none p-0"
                value={localLabel}
                placeholder="Flux..."
                autoFocus={transaction.label === ''}
                onChange={e => setLocalLabel(e.target.value)}
                onBlur={handleLabelCommit}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            />
            <div className="flex items-center justify-center space-x-0.5">
                <input
                    type="number"
                    className={clsx(
                        "bg-transparent text-xs font-black leading-none w-16 text-center outline-none border-none p-0",
                        transaction.direction === 'income' ? "text-emerald-600" : "text-rose-600"
                    )}
                    value={localAmount}
                    placeholder="0"
                    onChange={e => setLocalAmount(e.target.value)}
                    onBlur={handleAmountCommit}
                    onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                />
                <span className={clsx("text-[10px] font-bold leading-none", transaction.direction === 'income' ? "text-emerald-300" : "text-rose-300")}>
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
