'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFinanceStore } from '@/store/useFinanceStore';
import { ChevronRight, User, Briefcase, Calendar, Repeat, Plus } from 'lucide-react';
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

export default function OnboardingPage() {
    const [step, setStep] = useState(0); // 0: Context, 1: Balance, 2: Income, 3: Expenses
    const { setContext, context, setStartingBalance, addTransaction } = useFinanceStore();
    const [balance, setBalance] = useState('');
    const [incomeRows, setIncomeRows] = useState<Row[]>([{ label: '', amount: '', isMonthly: true }]);
    const [expenseRows, setExpenseRows] = useState<Row[]>([{ label: '', amount: '', isMonthly: true }]);
    const router = useRouter();

    const nextMonths = Array.from({ length: 12 }).map((_, i) => {
        const d = addMonths(startOfMonth(new Date()), i);
        return { label: format(d, 'MMM', { locale: fr }), value: format(d, 'yyyy-MM') };
    });

    // Context-based initial examples (but only 1 row)
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
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div key="step0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full space-y-6">
                            <div className="relative w-28 h-28 mx-auto bg-white rounded-[40px] shadow-premium flex items-center justify-center overflow-hidden group">
                                <Image src="/illustrations/mascot-onboarding-start.webp" alt="Welcome" fill className="object-contain p-4 group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            <h1 className="text-2xl font-black italic tracking-tighter text-zinc-900 leading-none">C'est pour qui ?</h1>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { setContext('perso'); next(); }} className={clsx("flex flex-col items-center justify-center p-6 bg-white rounded-[32px] shadow-soft border-2 transition-all group aspect-square", context === 'perso' ? "border-zinc-900" : "border-transparent text-zinc-400 hover:bg-zinc-50")}>
                                    <User className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform text-zinc-900" />
                                    <span className="font-black italic text-zinc-900 uppercase tracking-tighter">Perso</span>
                                </button>
                                <button onClick={() => { setContext('business'); next(); }} className={clsx("flex flex-col items-center justify-center p-6 bg-white rounded-[32px] shadow-soft border-2 transition-all group aspect-square", context === 'business' ? "border-zinc-900" : "border-transparent text-zinc-400 hover:bg-zinc-50")}>
                                    <Briefcase className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform text-zinc-900" />
                                    <span className="font-black italic text-zinc-900 uppercase tracking-tighter">Entreprise</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-6">
                            <div className="relative w-20 h-20 mx-auto bg-white rounded-[32px] shadow-premium flex items-center justify-center overflow-hidden">
                                <Image src="/illustrations/mascot-balance-day.webp" alt="Balance" fill className="object-contain p-2" />
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-2xl font-black italic tracking-tighter text-zinc-900 leading-none">Solde Actuel</h1>
                                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest px-8">Le montant en banque aujourd'hui</p>
                                <div className="relative pt-2">
                                    <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" className="w-full p-6 text-4xl font-black text-center bg-white shadow-soft border-none rounded-[32px] outline-none focus:ring-4 focus:ring-zinc-900/5 text-zinc-900 placeholder:text-zinc-100" autoFocus onKeyDown={(e) => e.key === 'Enter' && next()} />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-xl text-zinc-200">€</span>
                                </div>
                            </div>
                            <div className="pt-4 space-y-4">
                                <button onClick={next} className="w-full py-6 bg-zinc-900 text-white rounded-[40px] font-black italic text-lg shadow-premium active:scale-95 transition-all">Continuer</button>
                                <button onClick={prev} className="text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-zinc-900 transition-colors">Retour</button>
                            </div>
                        </motion.div>
                    )}

                    {(step === 2 || step === 3) && (
                        <motion.div key={`step${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-3">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-black italic tracking-tighter text-zinc-900 leading-none">{step === 2 ? 'Recettes' : 'Dépenses'}</h1>
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
                                        className="p-4 bg-white rounded-[32px] shadow-soft border border-zinc-50 space-y-4"
                                    >
                                        <div className="grid grid-cols-5 gap-2 items-center">
                                            <input
                                                type="text"
                                                value={row.label}
                                                onChange={(e) => updateRow(step === 2 ? 'income' : 'expense', i, 'label', e.target.value)}
                                                placeholder="Ex: Salaire"
                                                className="col-span-3 p-3 bg-zinc-50 rounded-2xl border-none outline-none font-bold text-sm text-zinc-900 placeholder:text-zinc-200"
                                            />
                                            <div className="col-span-2 relative">
                                                <input
                                                    type="number"
                                                    value={row.amount}
                                                    onChange={(e) => updateRow(step === 2 ? 'income' : 'expense', i, 'amount', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full p-3 pr-6 bg-zinc-50 rounded-2xl border-none outline-none font-black text-sm text-zinc-900 text-right"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-200">€</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex bg-zinc-50 p-1 rounded-2xl">
                                                <button onClick={() => updateRow(step === 2 ? 'income' : 'expense', i, 'isMonthly', true)} className={clsx("flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2", row.isMonthly ? "bg-white shadow-premium text-zinc-900" : "text-zinc-400")}>
                                                    <Repeat className="w-3 h-3" /> <span>Mensuel</span>
                                                </button>
                                                <button onClick={() => updateRow(step === 2 ? 'income' : 'expense', i, 'isMonthly', false)} className={clsx("flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2", !row.isMonthly ? "bg-white shadow-premium text-zinc-900" : "text-zinc-400")}>
                                                    <Calendar className="w-3 h-3" /> <span>Ponctuel</span>
                                                </button>
                                            </div>

                                            {/* Month Selector for Ponctuel */}
                                            {!row.isMonthly && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex overflow-x-auto no-scrollbar space-x-2 py-1">
                                                    {nextMonths.map((m) => (
                                                        <button
                                                            key={m.value}
                                                            onClick={() => updateRow(step === 2 ? 'income' : 'expense', i, 'month', m.value)}
                                                            className={clsx(
                                                                "flex-shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
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

                                {/* Add Button */}
                                {(step === 2 ? incomeRows : expenseRows).length < 3 && (
                                    <button
                                        onClick={() => addRow(step === 2 ? 'income' : 'expense')}
                                        className="w-full py-4 border-2 border-dashed border-zinc-100 rounded-[32px] flex items-center justify-center space-x-2 group hover:border-zinc-200 transition-colors"
                                    >
                                        <Plus className="w-4 h-4 text-zinc-200 group-hover:text-zinc-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-zinc-500">Ajouter un autre flux</span>
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
            {/* Dots */}
            <div className="flex justify-center space-x-2 py-8">
                {[0, 1, 2, 3].map((s) => (
                    <div key={s} className={clsx("h-1.5 rounded-full transition-all duration-500", step === s ? "w-8 bg-zinc-900" : "w-1.5 bg-zinc-200")} />
                ))}
            </div>
        </div>
    );
}
