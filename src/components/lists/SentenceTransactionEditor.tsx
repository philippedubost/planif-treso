'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { useFinanceStore, getAgeBasedSuggestions } from '@/store/useFinanceStore';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';

interface Props {
    /** 'none' = one-off extra, 'monthly' = recurring */
    recurrence: 'none' | 'monthly';
    /** required when recurrence === 'none' */
    month?: string;
    onClose: () => void;
}

type Direction = 'expense' | 'income';

export function SentenceTransactionEditor({ recurrence, month, onClose }: Props) {
    const { addTransaction, ageRange } = useFinanceStore();
    const suggestions = getAgeBasedSuggestions(ageRange);

    const [direction, setDirection] = useState<Direction>('expense');
    const [amount, setAmount] = useState('');
    const [label, setLabel] = useState('');
    const [showCustomLabel, setShowCustomLabel] = useState(false);
    const [saving, setSaving] = useState(false);

    const amountRef = useRef<HTMLInputElement>(null);
    const labelRef = useRef<HTMLInputElement>(null);

    // 3 contextual label options based on direction + ageRange
    const labelOptions = direction === 'income'
        ? suggestions.income.slice(0, 3)
        : recurrence === 'none'
            ? suggestions.extra.slice(0, 3)
            : suggestions.expense.slice(0, 3);

    const monthLabel = month
        ? format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: fr })
        : '';

    const isValid = amount.trim() !== '' && (label.trim() !== '' || (!showCustomLabel && label !== ''));
    const parsedAmount = parseFloat(amount.replace(',', '.'));

    const scrollIntoView = (el: HTMLElement | null) => {
        if (!el) return;
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    };

    const handleSubmit = async () => {
        const finalLabel = label.trim();
        if (!finalLabel || isNaN(parsedAmount) || parsedAmount === 0) return;

        setSaving(true);
        const absAmount = Math.abs(parsedAmount);
        await addTransaction({
            label: finalLabel,
            amount: direction === 'expense' ? -absAmount : absAmount,
            month: month || format(new Date(), 'yyyy-MM'),
            recurrence,
            direction,
            categoryId: direction === 'income' ? 'cat-salary' : 'cat-rent',
        });
        setSaving(false);
        onClose();
    };

    return (
        <div className="px-4 py-3 flex flex-col gap-4">

            {/* ── Sentence ── */}
            <div className="text-[15px] font-black italic tracking-tight text-zinc-900 leading-snug space-y-2">

                {/* Line 1 */}
                <div>
                    {recurrence === 'none'
                        ? <span className="text-zinc-400">En <span className="text-zinc-900">{monthLabel}</span>,</span>
                        : <span className="text-zinc-400">Chaque mois,</span>
                    }
                </div>

                {/* Line 2 — direction toggle */}
                <div className="flex items-center gap-2">
                    <span className="text-zinc-400">
                        {recurrence === 'none' ? 'je vais' : 'je'}
                    </span>
                    <div className="flex rounded-xl overflow-hidden border border-zinc-100 shadow-sm text-sm">
                        <button
                            onClick={() => setDirection('expense')}
                            className={clsx(
                                'px-3 py-1 font-black transition-all',
                                direction === 'expense'
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-white text-zinc-400 hover:bg-zinc-50'
                            )}
                        >
                            {recurrence === 'none' ? 'payer' : 'paye'}
                        </button>
                        <button
                            onClick={() => setDirection('income')}
                            className={clsx(
                                'px-3 py-1 font-black transition-all',
                                direction === 'income'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white text-zinc-400 hover:bg-zinc-50'
                            )}
                        >
                            {recurrence === 'none' ? 'recevoir' : 'reçois'}
                        </button>
                    </div>
                </div>

                {/* Line 3 — amount */}
                <div className="flex items-center gap-2">
                    <span className="text-zinc-400">un montant de</span>
                    <input
                        ref={amountRef}
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        onFocus={e => scrollIntoView(e.currentTarget)}
                        className={clsx(
                            'w-28 text-center font-black text-base border-b-2 bg-transparent outline-none pb-0.5 transition-colors',
                            direction === 'expense' ? 'border-rose-300 text-rose-600 placeholder:text-rose-200' : 'border-emerald-300 text-emerald-600 placeholder:text-emerald-200'
                        )}
                        onKeyDown={e => e.key === 'Enter' && amountRef.current?.blur()}
                    />
                </div>

                {/* Line 4 — label */}
                <div className="flex flex-col gap-2">
                    <span className="text-zinc-400">pour</span>

                    {/* Quick picks */}
                    <AnimatePresence mode="wait">
                        {!showCustomLabel ? (
                            <motion.div
                                key="pills"
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                className="flex flex-wrap gap-1.5"
                            >
                                {labelOptions.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setLabel(opt)}
                                        className={clsx(
                                            'px-3 py-1.5 rounded-xl text-sm font-black border transition-all active:scale-95',
                                            label === opt
                                                ? direction === 'expense'
                                                    ? 'bg-rose-500 text-white border-rose-500'
                                                    : 'bg-emerald-500 text-white border-emerald-500'
                                                : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-300'
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setLabel(''); setShowCustomLabel(true); setTimeout(() => labelRef.current?.focus(), 50); }}
                                    className="px-3 py-1.5 rounded-xl text-sm font-black border border-dashed border-zinc-200 text-zinc-400 hover:border-zinc-400 transition-all"
                                >
                                    Autre…
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    ref={labelRef}
                                    type="text"
                                    placeholder="Libellé…"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    onFocus={e => scrollIntoView(e.currentTarget)}
                                    className="flex-1 border-b-2 border-zinc-200 bg-transparent outline-none font-black text-zinc-900 placeholder:text-zinc-300 pb-0.5"
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                />
                                <button
                                    onClick={() => { setShowCustomLabel(false); setLabel(''); }}
                                    className="text-[10px] text-zinc-400 uppercase tracking-widest font-black"
                                >
                                    ← retour
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Submit ── */}
            <button
                onClick={handleSubmit}
                disabled={saving || !amount || (!label && !showCustomLabel) || (showCustomLabel && !label)}
                className={clsx(
                    'w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2',
                    isValid && !saving
                        ? direction === 'expense'
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                            : 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                        : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                )}
            >
                {saving ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                        <ChevronRight className="w-4 h-4" />
                    </motion.div>
                ) : (
                    <><Check className="w-4 h-4" /> Ajouter</>
                )}
            </button>
        </div>
    );
}
