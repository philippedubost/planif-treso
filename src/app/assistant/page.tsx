'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFinanceStore } from '@/store/useFinanceStore';
import { ChevronRight, ChevronDown, User, Briefcase, Calendar, Repeat, Plus } from 'lucide-react';
import Image from 'next/image';
import { format, addMonths, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx } from 'clsx';

type Row = {
    label: string;
    amount: string;
    isMonthly: boolean;
    month?: string; // YYYY-MM for one-off
};

export default function AssistantPage() {
    const [step, setStep] = useState(0); // 0: Context + Currency, 1: Balance, 2: Income, 3: Expenses
    const { setContext, context, setStartingBalance, addTransaction, currency, setCurrency } = useFinanceStore();
    const [balance, setBalance] = useState('');
    const [incomeRows, setIncomeRows] = useState<Row[]>([{ label: '', amount: '', isMonthly: true }]);
    const [expenseRows, setExpenseRows] = useState<Row[]>([{ label: '', amount: '', isMonthly: true }]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const router = useRouter();

    const currencies = [
        { label: 'EUR', symbol: '€', code: 'EUR' },
        { label: 'USD', symbol: '$', code: 'USD' },
        { label: 'GBP', symbol: '£', code: 'GBP' },
        { label: 'CHF', symbol: 'CHF', code: 'CHF' },
        { label: 'CAD', symbol: 'CA$', code: 'CAD' }
    ];

    const nextMonths = Array.from({ length: 12 }).map((_, i) => {
        const d = addMonths(startOfMonth(new Date()), i);
        return { label: format(d, 'MMM', { locale: fr }), value: format(d, 'yyyy-MM') };
    });

    // Context-based initial examples
    useEffect(() => {
        if (context === 'business') {
            setIncomeRows([{ label: 'Ventes Clients', amount: '', isMonthly: true }]);
            setExpenseRows([{ label: 'Charges fixes', amount: '', isMonthly: true }]);
        } else {
            setIncomeRows([{ label: 'Salaire', amount: '', isMonthly: true }]);
            setExpenseRows([{ label: 'Loyer / Crédit', amount: '', isMonthly: true }]);
        }
    }, [context]);

    const handleFinalize = async () => {
        setStartingBalance(parseFloat(balance) || 0);

        const allRows = [...incomeRows, ...expenseRows];
        for (const row of allRows) {
            const isIncome = incomeRows.includes(row);
            if (row.label && row.amount && parseFloat(row.amount) > 0) {
                await addTransaction({
                    label: row.label,
                    amount: parseFloat(row.amount),
                    direction: isIncome ? 'income' : 'expense',
                    categoryId: isIncome ? 'cat-salary' : 'cat-rent',
                    recurrence: row.isMonthly ? 'monthly' : 'none',
                    startMonth: format(new Date(), 'yyyy-MM'),
                    month: !row.isMonthly ? (row.month || format(new Date(), 'yyyy-MM')) : undefined,
                });
            }
        }

        router.push('/dashboard');
    };

    const next = () => setStep(s => s + 1);
    const prev = () => setStep(s => Math.max(0, s - 1));

    const addRow = (type: 'income' | 'expense') => {
        const rows = type === 'income' ? incomeRows : expenseRows;
        if (rows.length < 3) {
            const newRows = [...rows, { label: '', amount: '', isMonthly: true }];
            if (type === 'income') setIncomeRows(newRows); else setExpenseRows(newRows);
        }
    };

    const updateRow = (type: 'income' | 'expense', index: number, field: keyof Row, value: any) => {
        const rows = type === 'income' ? [...incomeRows] : [...expenseRows];
        rows[index] = { ...rows[index], [field]: value };
        if (type === 'income') setIncomeRows(rows); else setExpenseRows(rows);
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col p-6 max-w-md mx-auto relative z-10 font-sans">
            <button
                onClick={() => router.push('/dashboard')}
                className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 hover:text-zinc-900 transition-colors z-20"
            >
                Passer
            </button>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div key="step0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full space-y-8 md:space-y-12">
                            <div className="relative w-40 h-40 md:w-72 md:h-72 mx-auto flex items-center justify-center group">
                                <Image src="/illustrations/mascot-onboarding-start.webp" alt="Welcome" fill className="object-contain group-hover:scale-110 transition-transform duration-700" />
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-xl md:text-2xl font-black italic tracking-tighter text-zinc-900 leading-none">Assistant Nouvelle Planification</h1>
                                <p className="text-sm font-bold text-zinc-400">C'est pour qui ?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { setContext('perso'); next(); }}
                                        className={clsx(
                                            "flex flex-col items-center justify-center p-4 md:p-6 bg-white rounded-[24px] md:rounded-[32px] shadow-soft border-2 transition-all group aspect-square",
                                            context === 'perso' ? "border-zinc-900" : "border-transparent text-zinc-400 hover:bg-zinc-50"
                                        )}
                                    >
                                        <User className="w-8 h-8 md:w-10 md:h-10 mb-2 md:mb-4 group-hover:scale-110 transition-transform text-zinc-900" />
                                        <span className="font-black italic text-[10px] md:text-sm text-zinc-900 uppercase tracking-tighter text-center">Perso</span>
                                    </button>
                                    <button
                                        onClick={() => { setContext('business'); next(); }}
                                        className={clsx(
                                            "flex flex-col items-center justify-center p-4 md:p-6 bg-white rounded-[24px] md:rounded-[32px] shadow-soft border-2 transition-all group aspect-square",
                                            context === 'business' ? "border-zinc-900" : "border-transparent text-zinc-400 hover:bg-zinc-50"
                                        )}
                                    >
                                        <Briefcase className="w-8 h-8 md:w-10 md:h-10 mb-2 md:mb-4 group-hover:scale-110 transition-transform text-zinc-900" />
                                        <span className="font-black italic text-[10px] md:text-sm text-zinc-900 uppercase tracking-tighter text-center">Entreprise</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-50 flex items-center justify-center gap-2">
                                <p className="text-[9px] font-black italic text-zinc-400 uppercase tracking-widest leading-none">Devise préférée :</p>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                        className="flex items-center space-x-3 pl-5 pr-5 py-4 bg-white border border-zinc-100 rounded-[28px] text-xs font-black italic text-zinc-900 shadow-premium hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all active:scale-95 min-w-[120px] justify-between group"
                                    >
                                        <span>{currencies.find(c => c.symbol === currency)?.symbol} {currencies.find(c => c.symbol === currency)?.code}</span>
                                        <ChevronDown className={clsx("w-4 h-4 text-zinc-900 transition-transform duration-500", isSettingsOpen && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {isSettingsOpen && (
                                            <>
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    onClick={() => setIsSettingsOpen(false)}
                                                    className="fixed inset-0 z-50 bg-zinc-900/5 backdrop-blur-[2px]"
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute bottom-full left-0 mb-4 w-56 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-white p-3 z-[60]"
                                                >
                                                    <div className="space-y-1.5">
                                                        {currencies.map((c) => (
                                                            <button
                                                                key={c.code}
                                                                onClick={() => {
                                                                    setCurrency(c.symbol);
                                                                    setIsSettingsOpen(false);
                                                                }}
                                                                className={clsx(
                                                                    "w-full flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-black italic transition-all active:scale-[0.97]",
                                                                    currency === c.symbol
                                                                        ? "bg-zinc-900 text-white shadow-premium"
                                                                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                                                                )}
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <span className="w-5 h-5 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] not-italic group-hover:bg-zinc-200 transition-colors">
                                                                        {c.symbol}
                                                                    </span>
                                                                    <span>{c.code}</span>
                                                                </div>
                                                                {currency === c.symbol && (
                                                                    <motion.div layoutId="activeDot" className="w-1.5 h-1.5 bg-white rounded-full" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-10">
                            <div className="relative w-40 h-40 md:w-56 md:h-56 mx-auto flex items-center justify-center">
                                <Image src="/illustrations/mascot-balance-day.webp" alt="Balance" fill className="object-contain" />
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-2xl font-black italic tracking-tighter text-zinc-900 leading-none">Solde Actuel</h1>
                                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest px-8">
                                    {context === 'perso' ? "Le montant sur ton compte aujourd'hui" : "Le montant en banque aujourd'hui"}
                                </p>
                                <div className="relative pt-2">
                                    <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" className="w-full p-4 md:p-6 text-2xl md:text-4xl font-black text-center bg-white shadow-soft border-none rounded-[24px] md:rounded-[32px] outline-none focus:ring-4 focus:ring-zinc-900/5 text-zinc-900 placeholder:text-zinc-100" autoFocus onKeyDown={(e) => e.key === 'Enter' && next()} />
                                    <span className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 font-black text-lg md:text-xl text-zinc-200">{currency}</span>
                                </div>
                            </div>
                            <div className="pt-2 md:pt-4 space-y-3 md:space-y-4">
                                <button onClick={next} className="w-full py-4 md:py-6 bg-zinc-900 text-white rounded-[32px] md:rounded-[40px] font-black italic text-base md:text-lg shadow-premium active:scale-95 transition-all">Continuer</button>
                                <button onClick={prev} className="text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-zinc-900 transition-colors">Retour</button>
                            </div>
                        </motion.div>
                    )}

                    {(step === 2 || step === 3) && (
                        <motion.div key={`step${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-3">
                            <div className="space-y-1">
                                <h1 className={clsx(
                                    "text-2xl font-black italic tracking-tighter leading-none",
                                    step === 2 ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {step === 2 ? 'Recettes' : 'Dépenses'}
                                </h1>
                                <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-[0.2em] leading-tight px-4 underline underline-offset-4 decoration-zinc-100">
                                    {step === 2 ? "Vos rentrées d'argent" : "Vos sorties"}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {(step === 2 ? incomeRows : expenseRows).map((row, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        layout
                                        className="p-3 md:p-4 bg-white rounded-[24px] md:rounded-[32px] shadow-soft border border-zinc-50 space-y-3 md:space-y-4"
                                    >
                                        <div className="grid grid-cols-5 gap-2 items-center">
                                            <input
                                                type="text"
                                                value={row.label}
                                                onChange={(e) => updateRow(step === 2 ? 'income' : 'expense', i, 'label', e.target.value)}
                                                placeholder="Ex: Salaire"
                                                className="col-span-3 p-2.5 md:p-3 bg-zinc-50 rounded-xl md:rounded-2xl border-none outline-none font-bold text-xs md:text-sm text-zinc-900 placeholder:text-zinc-200"
                                            />
                                            <div className="col-span-2 relative">
                                                <input
                                                    type="number"
                                                    value={row.amount}
                                                    onChange={(e) => updateRow(step === 2 ? 'income' : 'expense', i, 'amount', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full p-2.5 md:p-3 pr-6 md:pr-6 bg-zinc-50 rounded-xl md:rounded-2xl border-none outline-none font-black text-xs md:text-sm text-zinc-900 text-right"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] md:text-[10px] font-black text-zinc-200">{currency}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:space-y-3">
                                            <div className="flex bg-zinc-50 p-1 rounded-xl md:rounded-2xl">
                                                <button onClick={() => updateRow(step === 2 ? 'income' : 'expense', i, 'isMonthly', true)} className={clsx("flex-1 py-1.5 md:py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all flex items-center justify-center space-x-1 md:space-x-2", row.isMonthly ? "bg-white shadow-premium text-zinc-900" : "text-zinc-400")}>
                                                    <Repeat className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span>Mensuel</span>
                                                </button>
                                                <button onClick={() => updateRow(step === 2 ? 'income' : 'expense', i, 'isMonthly', false)} className={clsx("flex-1 py-1.5 md:py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all flex items-center justify-center space-x-1 md:space-x-2", !row.isMonthly ? "bg-white shadow-premium text-zinc-900" : "text-zinc-400")}>
                                                    <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span>Ponctuel</span>
                                                </button>
                                            </div>

                                            {!row.isMonthly && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex overflow-x-auto no-scrollbar space-x-1.5 md:space-x-2 py-1">
                                                    {nextMonths.map((m) => (
                                                        <button
                                                            key={m.value}
                                                            onClick={() => updateRow(step === 2 ? 'income' : 'expense', i, 'month', m.value)}
                                                            className={clsx(
                                                                "flex-shrink-0 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                                                                (row.month === m.value || (!row.month && i === 0 && m.value === format(new Date(), 'yyyy-MM')))
                                                                    ? "bg-zinc-900 text-white"
                                                                    : "bg-zinc-100 text-zinc-400"
                                                            )}
                                                        >
                                                            {m.label}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {(step === 2 ? incomeRows : expenseRows).length < 3 && (
                                    <button
                                        onClick={() => addRow(step === 2 ? 'income' : 'expense')}
                                        className="w-full py-4 border-2 border-dashed border-zinc-100 rounded-[32px] flex items-center justify-center space-x-2 group hover:border-zinc-200 transition-colors"
                                    >
                                        <Plus className="w-4 h-4 text-zinc-200 group-hover:text-zinc-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-zinc-500">
                                            {step === 2 ? "Ajouter une autre recette" : "Ajouter une autre dépense"}
                                        </span>
                                    </button>
                                )}
                            </div>

                            <div className="pt-4 space-y-4">
                                <button onClick={step === 2 ? next : handleFinalize} className="w-full py-6 bg-zinc-900 text-white rounded-[40px] font-black italic text-lg shadow-premium active:scale-95 transition-all">
                                    {step === 2 ? 'Suivant' : 'C\'est parti !'}
                                </button>
                                <button onClick={prev} className="text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-zinc-900 transition-colors">Retour</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex justify-center space-x-2 py-8">
                {[0, 1, 2, 3].map((s) => (
                    <div key={s} className={clsx(
                        "h-1.5 rounded-full transition-all duration-500",
                        step === s ? (
                            step === 2 ? "w-8 bg-emerald-500" :
                                step === 3 ? "w-8 bg-rose-500" : "w-8 bg-zinc-900"
                        ) : "w-1.5 bg-zinc-200"
                    )} />
                ))}
            </div>
        </div>
    );
}
