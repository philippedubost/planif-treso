'use client';

import React, { useState, useEffect } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Transaction } from '@/lib/financeEngine';
import { useTranslation } from '@/components/i18n/TranslationProvider';

export function TimelineView() {
    const { transactions, addTransaction, startingMonth, projectionMonths } = useFinanceStore();
    const projection = useProjection();
    const { dictionary } = useTranslation();

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
                {/* Section: Recurring Combined */}
                <div className="flex mt-6 mb-2 items-start relative">
                    <div className="w-32 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20 px-4 font-black text-[11px] uppercase tracking-[0.2em] text-zinc-900 pt-2 border-r border-zinc-100 border-dashed min-h-[40px]">
                        {dictionary.timeline.monthly}
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2 px-4 py-1">
                        {transactions.filter(t => t.recurrence !== 'none').length === 0 && (
                            <div className="text-zinc-400 text-xs italic py-2">
                                {dictionary.timeline.emptyIncome}
                            </div>
                        )}
                        {transactions.filter(t => t.recurrence !== 'none').map(tx => (
                            <RecurringPill key={tx.id} transaction={tx} dictionary={dictionary} />
                        ))}
                        <button
                            onClick={() => handleAdd('expense')}
                            className="h-[38px] px-3 rounded-lg border-2 border-dashed border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all flex items-center justify-center group/add"
                        >
                            <Plus className="w-4 h-4 text-zinc-400 group-hover/add:text-zinc-600" />
                        </button>
                    </div>
                </div>

                {/* Section: Mixed One-off */}
                <div className="flex mt-8 mb-4 items-center">
                    <div className="w-32 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20 px-4 font-black text-[11px] uppercase tracking-[0.2em] text-zinc-900">
                        {dictionary.timeline.oneOff}
                    </div>
                </div>
                <div className="flex relative transition-all duration-300 rounded-3xl">
                    <div className="w-32 flex-shrink-0 sticky left-0 bg-white/80 backdrop-blur-md z-20" />
                    {oneOffTransactions.length === 0 && (
                        <div className="absolute left-[140px] top-4 text-zinc-400 text-xs italic z-10 pointer-events-none">
                            {dictionary.timeline.emptyOneOff}
                        </div>
                    )}
                    <div className="flex flex-1">
                        {months.map(m => (
                            <div key={m} className="flex-1 min-w-[96px] flex flex-col items-center justify-start py-4 space-y-2 border-l border-zinc-100 border-dashed min-h-[140px]">
                                {oneOffTransactions.filter(t => t.month === m).map(t => (
                                    <Pill key={t.id} transaction={t} color={t.direction === 'income' ? 'emerald' : 'rose'} months={months} dictionary={dictionary} />
                                ))}
                                <button
                                    onClick={() => handleAdd('expense', m)}
                                    className="w-16 h-10 rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all flex items-center justify-center group/add"
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

function RecurringPill({ transaction, dictionary }: { transaction: any, dictionary: any }) {
    const { updateTransaction, deleteTransaction, currency } = useFinanceStore();
    const [isHovered, setIsHovered] = useState(false);

    // logic similar to Pill
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
            updateTransaction(transaction.id, { amount: newAmount, direction: newDirection });
            setLocalAmount(newAmount === 0 ? '' : (newDirection === 'expense' ? -newAmount : newAmount).toString());
        } else {
            setLocalAmount(newAmount === 0 ? '' : (newDirection === 'expense' ? -newAmount : newAmount).toString());
        }
    };

    const isIncome = transaction.direction === 'income';

    return (
        <div
            className={clsx(
                "pl-3 pr-2 py-1.5 rounded-lg border-2 flex items-center shadow-sm relative group/pill transition-all",
                isIncome ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center space-x-2">
                <input
                    className={clsx(
                        "bg-transparent font-black italic text-sm outline-none border-none p-0 cursor-text w-[100px] truncate",
                        isIncome ? "text-emerald-600 placeholder-emerald-600/50" : "text-rose-600 placeholder-rose-600/50"
                    )}
                    placeholder={dictionary.timeline.labelPlaceholder}
                    value={localLabel}
                    autoFocus={transaction.label === ''}
                    onChange={e => setLocalLabel(e.target.value)}
                    onBlur={handleLabelCommit}
                    onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                />

                <div className="flex items-center opacity-75">
                    <input
                        type="number"
                        className={clsx(
                            "bg-transparent font-black text-xs outline-none border-none p-0 cursor-text w-12 text-right",
                            isIncome ? "text-emerald-600" : "text-rose-600"
                        )}
                        value={localAmount}
                        placeholder="0"
                        onChange={e => setLocalAmount(e.target.value)}
                        onBlur={handleAmountCommit}
                        onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                    />
                    <span className={clsx("text-xs font-black", isIncome ? "text-emerald-600" : "text-rose-600")}>{currency}/m</span>
                </div>
            </div>

            {isHovered && (
                <button
                    onClick={() => deleteTransaction(transaction.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg z-30 transition-all hover:scale-110"
                >
                    <X className="w-3 h-3 stroke-[3px]" />
                </button>
            )}
        </div>
    );
}

function Pill({ transaction, color, months, dictionary }: { transaction: any, color: 'emerald' | 'rose', months: string[], dictionary: any }) {
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
                placeholder={dictionary.timeline.flowPlaceholder}
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
