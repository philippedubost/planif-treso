'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/i18n/TranslationProvider';
import { useFinanceStore } from '@/store/useFinanceStore';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react';
import { calculateProjection } from '@/lib/financeEngine';

export default function OnboardingFlow() {
    const { dictionary, locale } = useTranslation();
    const router = useRouter();
    const { setStartingBalance, addTransaction, setCurrentScenario, addScenario, resetSimulation, setHasCompletedOnboarding, setAgeRange: setStoreAgeRange } = useFinanceStore();
    const [step, setStep] = useState(1);

    // Data
    const [balance, setBalance] = useState<string>('');
    const [income, setIncome] = useState<string>('');
    const [expense, setExpense] = useState<string>('');
    const [extra, setExtra] = useState<string>('');
    const [extraMonth, setExtraMonth] = useState<string>('');
    const [extraDirection, setExtraDirection] = useState<'income' | 'expense'>('expense');
    const [extraLabel, setExtraLabel] = useState<string>('');
    const [extraIsOther, setExtraIsOther] = useState<boolean>(false);
    const [ageRange, setAgeRange] = useState<string>('Non spécifié');

    // Precomputed results for Step 5
    const [previewMonthsToZero, setPreviewMonthsToZero] = useState<number | null>(null);

    // Refs for auto-focus
    const balanceRef = useRef<HTMLInputElement>(null);
    const incomeRef = useRef<HTMLInputElement>(null);
    const expenseRef = useRef<HTMLInputElement>(null);
    const extraRef = useRef<HTMLInputElement>(null);

    // Vibrate helper
    const vibrate = useCallback(() => {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(15);
        }
    }, []);

    // Haptic feedback & Focus on step change
    useEffect(() => {
        if (step === 2) {
            setTimeout(() => balanceRef.current?.focus(), 300);
        } else if (step === 4) {
            setTimeout(() => incomeRef.current?.focus(), 300);
        } else if (step === 5) {
            setTimeout(() => expenseRef.current?.focus(), 300);
        } else if (step === 6) {
            setTimeout(() => extraRef.current?.focus(), 300);
        }
    }, [step]);

    const next12Months = useMemo<{ value: string, label: string }[]>(() => {
        const { format, addMonths } = require('date-fns');
        const { fr } = require('date-fns/locale');
        return Array.from({ length: 12 }).map((_, i) => {
            const d = addMonths(new Date(), i + 1);
            return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy', { locale: fr }) };
        });
    }, []);

    useEffect(() => {
        if (!extraMonth && next12Months.length > 0) {
            setExtraMonth(next12Months[0].value);
        }
    }, [next12Months, extraMonth]);

    // Precompute step 7 results when reaching step 7
    useEffect(() => {
        if (step === 7) {
            const numBalance = parseFloat(balance) || 0;
            const numIncome = parseFloat(income) || 0;
            const numExpense = parseFloat(expense) || 0;
            const numExtra = parseFloat(extra) || 0;

            // Generate a fake local transaction list to compute
            const fakeTransactions = [];
            if (numIncome > 0) {
                fakeTransactions.push({ id: 'inc', label: 'Entrée 1', amount: numIncome, direction: 'income' as const, recurrence: 'monthly' as const, month: '', categoryId: 'cat-salary' });
            }
            if (numExpense > 0) {
                fakeTransactions.push({ id: 'exp', label: 'Sortie 1', amount: numExpense, direction: 'expense' as const, recurrence: 'monthly' as const, month: '', categoryId: 'cat-rent' });
            }
            if (numExtra > 0) {
                const appliedMonth = extraMonth || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().substring(0, 7);
                fakeTransactions.push({ id: 'ext', label: 'Extra 1', amount: numExtra, direction: extraDirection, recurrence: 'none' as const, month: appliedMonth, categoryId: extraDirection === 'expense' ? 'cat-shopping' : 'cat-salary' });
            }

            // Simple 12 month dummy projection
            const currentMonth = new Date().toISOString().substring(0, 7);
            const projection = calculateProjection(numBalance, currentMonth, fakeTransactions, 12);

            const firstNegMonthOffset = projection.findIndex(p => p.balance < 0);

            if (firstNegMonthOffset !== -1) {
                setPreviewMonthsToZero(firstNegMonthOffset);
            } else {
                setPreviewMonthsToZero(null);
            }
        }
    }, [step, balance, income, expense, extra]);

    // Flow controls
    const handleNext = () => {
        vibrate();
        if (step < 7) {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            vibrate();
            setStep(prev => prev - 1);
        }
    };

    const handleSaveProfile = async () => {
        vibrate();
        await commitAndRedirect();
        router.push(`/${locale}/dashboard`);
    };

    const commitAndRedirect = async () => {
        await resetSimulation();
        const numBalance = parseFloat(balance) || 0;
        const numIncome = parseFloat(income) || 0;
        const numExpense = parseFloat(expense) || 0;
        const numExtra = parseFloat(extra) || 0;

        setStartingBalance(numBalance);
        setStoreAgeRange(ageRange);
        await addTransaction({
            label: 'Entrée 1',
            categoryId: 'cat-salary',
            amount: numIncome,
            direction: 'income',
            recurrence: 'monthly'
        });
        await addTransaction({
            label: 'Sortie 1',
            categoryId: 'cat-rent',
            amount: numExpense,
            direction: 'expense',
            month: '',
            recurrence: 'monthly'
        });

        if (numExtra > 0) {
            const appliedMonth = extraMonth || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().substring(0, 7);
            await addTransaction({
                label: extraLabel || 'Extra',
                categoryId: extraDirection === 'expense' ? 'cat-shopping' : 'cat-salary',
                amount: numExtra,
                direction: extraDirection,
                month: appliedMonth,
                recurrence: 'none'
            });
        }

        const id = await addScenario('Mon profil');
        if (id) {
            setCurrentScenario(id);
        }

        setHasCompletedOnboarding(true);
    };

    // Render Steps
    // -------------------------------------------------------------

    const renderStep1 = () => (
        <div className="flex flex-col pt-[8vh] px-6 space-y-8 items-center h-full no-scrollbar overflow-y-auto">
            <div className="flex flex-col items-center space-y-8 w-full max-w-sm mx-auto">
                <div className="h-[15vh] w-full max-w-[140px]">
                    <ImageWithFallback
                        srcWebp="/illustrations/mascot-onboarding-start.webp"
                        srcPng="/illustrations/mascot-onboarding-start.png"
                        alt="Bienvenue"
                        fill
                        priority
                        className="object-contain"
                    />
                </div>
                <div className="text-center space-y-3">
                    <h1 className="text-3xl font-black italic tracking-tighter text-zinc-900 leading-tight">
                        {dictionary.onboarding.step1.title}
                    </h1>
                    <p className="text-[15px] font-medium text-zinc-500 leading-relaxed balance-text">
                        {dictionary.onboarding.step1.subtitle}
                    </p>
                </div>
            </div>
            <div className="w-full max-w-sm mx-auto text-center space-y-3">
                {renderCTA(dictionary.onboarding.step1.cta, true)}
                <p className="text-[12px] font-bold tracking-wide text-zinc-400">
                    {dictionary.onboarding.step1.disclaimer}
                </p>
            </div>
        </div>
    );

    const renderStep2 = () => {
        const canProceed = balance.length > 0;

        return (
            <div className="flex flex-col pt-[8vh] px-6 space-y-8 items-center h-full no-scrollbar overflow-y-auto">
                <div className="flex flex-col items-center space-y-6 w-full max-w-sm mx-auto">
                    <div className="h-[15vh] w-full max-w-[140px]">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-balance-day.webp"
                            srcPng="/illustrations/mascot-balance-day.png"
                            alt="Solde courant"
                            fill
                            priority
                            className="object-contain"
                        />
                    </div>
                    <div className="text-center space-y-2 w-full">
                        <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900">
                            Combien as-tu aujourd'hui ?
                        </h2>
                        <div className="relative mt-8 max-w-xs mx-auto">
                            <input
                                ref={balanceRef}
                                type="number"
                                inputMode="decimal"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                className="w-full text-center text-4xl font-black tabular-nums bg-transparent border-b-2 border-zinc-200 pb-2 focus:outline-none focus:border-zinc-900 transition-colors"
                                placeholder="0"
                                onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                            />
                            <span className="absolute right-4 bottom-4 text-2xl font-black text-zinc-400">€</span>
                        </div>
                        <p className="text-sm font-medium text-zinc-400 mt-4">
                            Regarde simplement ton compte principal
                        </p>
                    </div>
                </div>
                <div className="w-full max-w-sm mx-auto">
                    {renderCTA("Continuer", canProceed)}
                </div>
            </div>
        );
    };

    const renderStep3 = () => {
        const canProceed = ageRange.length > 0;
        const ages = ['15-24', '25-34', '35-50', '51+'];

        return (
            <div className="flex flex-col pt-[8vh] px-6 space-y-8 items-center h-full no-scrollbar overflow-y-auto">
                <div className="flex flex-col items-center space-y-6 w-full max-w-sm mx-auto">
                    <div className="h-[15vh] w-full max-w-[140px]">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-graph-overview.webp"
                            srcPng="/illustrations/mascot-graph-overview.png"
                            alt="Age Range"
                            fill
                            priority
                            className="object-contain"
                        />
                    </div>
                    <div className="text-center space-y-4 w-full">
                        <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900">
                            Quel est ton âge ?
                        </h2>
                        <p className="text-sm font-medium text-zinc-400 max-w-[250px] mx-auto balance-text">
                            Pour t'aider à budgéter selon ta situation.
                        </p>
                        <div className="grid grid-cols-2 gap-3 mt-8 w-full">
                            {ages.map((range) => (
                                <button
                                    key={range}
                                    onClick={() => {
                                        setAgeRange(range);
                                        setTimeout(() => handleNext(), 300);
                                    }}
                                    className={clsx(
                                        "py-4 rounded-2xl font-black text-[17px] transition-all",
                                        ageRange === range
                                            ? "bg-zinc-900 text-white shadow-premium scale-100 border-2 border-zinc-900"
                                            : "bg-white text-zinc-600 border-2 border-zinc-100 hover:border-zinc-200 active:scale-95"
                                    )}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setAgeRange('Non spécifié');
                                setTimeout(() => handleNext(), 300);
                            }}
                            className={clsx(
                                "mt-6 text-[11px] font-black uppercase tracking-widest underline underline-offset-4 transition-all",
                                ageRange === 'Non spécifié' ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            Je préfère ne pas le dire
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep4 = () => {
        const canProceed = income.length > 0;

        return (
            <div className="flex flex-col pt-[8vh] px-6 space-y-8 items-center h-full no-scrollbar overflow-y-auto">
                <div className="flex flex-col items-center space-y-6 w-full max-w-sm mx-auto">
                    <div className="h-[15vh] w-full max-w-[140px]">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-income-recurring.webp"
                            srcPng="/illustrations/mascot-income-recurring.png"
                            alt="Revenus"
                            fill
                            priority
                            className="object-contain"
                        />
                    </div>
                    <div className="text-center space-y-2 w-full">
                        <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900">
                            Ce qui rentre chaque mois
                        </h2>
                        <div className="relative mt-8 max-w-xs mx-auto">
                            <input
                                ref={incomeRef}
                                type="number"
                                inputMode="decimal"
                                value={income}
                                onChange={(e) => setIncome(e.target.value)}
                                className="w-full text-center text-4xl font-black tabular-nums bg-transparent border-b-2 border-emerald-200 pb-2 focus:outline-none focus:border-emerald-500 transition-colors text-emerald-600"
                                placeholder="0"
                                onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                            />
                            <span className="absolute right-4 bottom-4 text-2xl font-black text-emerald-300">€</span>
                        </div>
                        <p className="text-sm font-medium text-zinc-400 mt-4 max-w-[250px] mx-auto balance-text">
                            Salaire, pension, aides... même approximatif
                        </p>
                    </div>
                </div>
                <div className="w-full max-w-sm mx-auto">
                    {renderCTA("Continuer", canProceed)}
                </div>
            </div>
        );
    };

    const renderStep5 = () => {
        const canProceed = expense.length > 0;

        return (
            <div className="flex flex-col pt-[8vh] px-6 space-y-8 items-center h-full no-scrollbar overflow-y-auto">
                <div className="flex flex-col items-center space-y-6 w-full max-w-sm mx-auto">
                    <div className="h-[15vh] w-full max-w-[140px]">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-expense-recurring.webp"
                            srcPng="/illustrations/mascot-expense-recurring.png"
                            alt="Dépenses"
                            fill
                            priority
                            className="object-contain"
                        />
                    </div>
                    <div className="text-center space-y-2 w-full">
                        <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900">
                            Ce qui sort chaque mois
                        </h2>
                        <div className="relative mt-8 max-w-xs mx-auto">
                            <input
                                ref={expenseRef}
                                type="number"
                                inputMode="decimal"
                                value={expense}
                                onChange={(e) => setExpense(e.target.value)}
                                className="w-full text-center text-4xl font-black tabular-nums bg-transparent border-b-2 border-rose-200 pb-2 focus:outline-none focus:border-rose-500 transition-colors text-rose-600"
                                placeholder="0"
                                onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                            />
                            <span className="absolute right-4 bottom-4 text-2xl font-black text-rose-300">€</span>
                        </div>
                        <p className="text-sm font-medium text-zinc-400 mt-4 max-w-[250px] mx-auto balance-text">
                            Loyer, abonnements, impôts... une estimation suffit
                        </p>
                    </div>
                </div>
                <div className="w-full max-w-sm mx-auto">
                    {renderCTA("Continuer", canProceed)}
                </div>
            </div>
        );
    };

    const renderStep6 = () => {
        const canProceed = true; // Optional step
        const isFilled = parseFloat(extra) > 0 && extraLabel.trim().length > 0;

        const labelOptions = extraDirection === 'income'
            ? (ageRange === '15-24' ? ['Cadeau', 'Petit boulot', 'Vente'] : ['Prime', 'Cadeau', 'Remboursement'])
            : (ageRange === '15-24' ? ['Sortie', 'Voyage', 'Cadeau']
                : ageRange === '35-50' ? ['Voyage', 'Réparation', 'Impôts']
                    : ageRange === '51+' ? ['Voyage', 'Santé', 'Vacances']
                        : ['Voyage', 'Shopping', 'Cadeau']);

        return (
            <div className="flex flex-col pt-[8vh] px-6 space-y-6 items-center h-full no-scrollbar overflow-y-auto">
                <div className="flex flex-col items-center space-y-5 w-full max-w-sm mx-auto">
                    <div className="h-[13vh] w-full max-w-[120px]">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-graph-edit.webp"
                            srcPng="/illustrations/mascot-income-oneoff.png"
                            alt="Extra ponctuel"
                            fill
                            priority
                            className="object-contain"
                        />
                    </div>

                    {/* Sentence card */}
                    <div className="w-full text-left space-y-4 text-[17px] font-black italic tracking-tight text-zinc-900 leading-snug">

                        {/* Line 1 — month */}
                        <div className="space-y-2">
                            <span className="text-zinc-400">En</span>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
                                {next12Months.slice(0, 6).map(m => (
                                    <button
                                        key={m.value}
                                        onClick={() => setExtraMonth(m.value)}
                                        className={clsx(
                                            'shrink-0 px-3 py-1.5 rounded-xl text-sm font-black border transition-all active:scale-95 capitalize',
                                            extraMonth === m.value
                                                ? 'bg-zinc-900 text-white border-zinc-900'
                                                : 'bg-white text-zinc-500 border-zinc-100 hover:border-zinc-300'
                                        )}
                                    >
                                        {m.label.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Line 2 — direction */}
                        <div className="flex items-center gap-3">
                            <span className="text-zinc-400">je vais</span>
                            <div className="flex rounded-xl overflow-hidden border border-zinc-100 shadow-sm text-sm">
                                <button
                                    onClick={() => setExtraDirection('expense')}
                                    className={clsx(
                                        'px-4 py-1.5 font-black transition-all',
                                        extraDirection === 'expense'
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-white text-zinc-400 hover:bg-zinc-50'
                                    )}
                                >
                                    payer
                                </button>
                                <button
                                    onClick={() => setExtraDirection('income')}
                                    className={clsx(
                                        'px-4 py-1.5 font-black transition-all',
                                        extraDirection === 'income'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-white text-zinc-400 hover:bg-zinc-50'
                                    )}
                                >
                                    recevoir
                                </button>
                            </div>
                        </div>

                        {/* Line 3 — amount */}
                        <div className="flex items-center gap-3">
                            <span className="text-zinc-400">un montant de</span>
                            <input
                                ref={extraRef}
                                type="number"
                                inputMode="decimal"
                                value={extra}
                                onChange={(e) => setExtra(e.target.value)}
                                className={clsx(
                                    'w-24 text-center font-black text-base border-b-2 bg-transparent outline-none pb-0.5 transition-colors',
                                    extraDirection === 'expense'
                                        ? 'border-rose-300 text-rose-600 placeholder:text-rose-200'
                                        : 'border-emerald-300 text-emerald-600 placeholder:text-emerald-200'
                                )}
                                placeholder="0"
                                onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                            />
                        </div>

                        {/* Line 4 — label */}
                        <div className="space-y-2">
                            <span className="text-zinc-400">pour</span>
                            {extraIsOther ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={extraLabel}
                                        onChange={(e) => setExtraLabel(e.target.value)}
                                        className="flex-1 border-b-2 border-zinc-200 bg-transparent outline-none font-black text-zinc-900 placeholder:text-zinc-300 pb-0.5 not-italic"
                                        placeholder="Libellé…"
                                        onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => { setExtraIsOther(false); setExtraLabel(''); }}
                                        className="text-[10px] text-zinc-400 uppercase tracking-widest font-black"
                                    >
                                        ← retour
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {labelOptions.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => { setExtraLabel(opt); setExtraIsOther(false); }}
                                            className={clsx(
                                                'px-3 py-1.5 rounded-xl text-sm font-black border transition-all active:scale-95 not-italic',
                                                extraLabel === opt
                                                    ? extraDirection === 'expense'
                                                        ? 'bg-rose-500 text-white border-rose-500'
                                                        : 'bg-emerald-500 text-white border-emerald-500'
                                                    : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-300'
                                            )}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => { setExtraIsOther(true); setExtraLabel(''); }}
                                        className="px-3 py-1.5 rounded-xl text-sm font-black border border-dashed border-zinc-200 text-zinc-400 hover:border-zinc-400 transition-all not-italic"
                                    >
                                        Autre…
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-full">
                        {renderCTA(isFilled ? "Ajouter l'extra" : "Passer cette étape", canProceed)}
                    </div>
                    <p className="text-zinc-400 font-medium text-xs mt-3 pb-8 text-center px-4">
                        Tu pourras en ajouter d'autres plus tard dans ton espace personnel.
                    </p>
                </div>
            </div>
        );
    };

    const renderStep7 = () => {
        let headline = "Tu es tranquille pour l'instant";
        let colorClass = "text-emerald-500";
        let bgClass = "bg-emerald-50";

        if (previewMonthsToZero !== null) {
            if (previewMonthsToZero <= 3) {
                headline = "Attention, ton solde va passer sous zéro";
                colorClass = "text-rose-500";
                bgClass = "bg-rose-50";
            } else if (previewMonthsToZero <= 6) {
                headline = "Ça va être serré bientôt";
                colorClass = "text-amber-500";
                bgClass = "bg-amber-50";
            }
        }

        const { format } = require('date-fns');
        const { fr } = require('date-fns/locale');
        const numExtra = parseFloat(extra) || 0;

        return (
            <div className="flex flex-col pt-[8vh] px-6 pb-20 items-center h-full no-scrollbar overflow-y-auto w-full">
                <div className="flex flex-col items-center space-y-6 w-full max-w-sm mx-auto">
                    <div className="h-[15vh] w-full max-w-[140px]">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-graph-overview.webp"
                            srcPng="/illustrations/mascot-graph-overview.png"
                            alt="Prévisualisation"
                            fill
                            priority
                            className="object-contain"
                        />
                    </div>

                    <div className="text-center space-y-4 w-full">
                        <div className={clsx("inline-block px-4 py-2 rounded-2xl", bgClass)}>
                            <h2 className={clsx("text-[17px] font-black italic tracking-tight", colorClass)}>
                                {headline}
                            </h2>
                        </div>

                        {/* Mini Dashboard Preview */}
                        <div className="bg-white rounded-3xl p-5 shadow-soft border border-zinc-100 max-w-sm mx-auto w-full space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-zinc-50">
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Ce mois-ci</p>
                                    <p className="font-black text-xl tabular-nums">{parseFloat(balance) || 0} €</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Projection</p>
                                    <div className="flex flex-col space-y-1 mt-1">
                                        <div className="flex items-center space-x-1 justify-end">
                                            <span className="text-emerald-500 font-bold text-xs">+{parseFloat(income) || 0}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 justify-end">
                                            <span className="text-rose-500 font-bold text-xs">-{parseFloat(expense) || 0}</span>
                                        </div>
                                        {numExtra > 0 && (
                                            <div className="flex items-center space-x-1 justify-end">
                                                <span className={clsx("font-bold text-xs", extraDirection === 'income' ? 'text-emerald-500' : 'text-rose-500')}>
                                                    {extraDirection === 'income' ? '+' : '-'}{numExtra}
                                                    {extraMonth && <span className="text-[9px] text-zinc-400 font-normal tracking-tight ml-1">en {format(new Date(extraMonth), 'MMMM', { locale: fr })}</span>}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {previewMonthsToZero !== null ? (
                                <p className="text-sm font-medium text-zinc-600">
                                    Sans changement, tu es à découvert dans <span className="font-black">{previewMonthsToZero} mois</span>.
                                </p>
                            ) : (
                                <p className="text-sm font-medium text-emerald-600">
                                    Ton capital augmente mois après mois !
                                </p>
                            )}
                        </div>

                        {/* Custom CTA block placed directly under summary box */}
                        <div className="pt-2 w-full z-20">
                            <button
                                onClick={handleSaveProfile}
                                className="w-full py-[18px] rounded-[24px] font-black italic text-[15px] transition-all active:scale-[0.98] bg-zinc-900 text-white shadow-premium flex items-center justify-center space-x-2"
                            >
                                <span>Voir mon compte sur l'année</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <p className="text-center text-xs font-medium text-zinc-400 mt-4 leading-relaxed max-w-[280px] mx-auto">
                                Tu pourras tout éditer et ajuster par la suite et ajouter de nouvelles entrées et sorties.
                            </p>
                            {/* Safe area spacer for iPhones */}
                            <div className="h-[env(safe-area-inset-bottom)]" />
                        </div>

                    </div>
                </div>
            </div>
        );
    };

    // Shared CTA Renderer
    const renderCTA = (label: string, enabled: boolean) => (
        <div className="pt-4 w-full z-20">
            <button
                disabled={!enabled}
                onClick={handleNext}
                className={clsx(
                    "w-full py-[18px] rounded-[24px] font-black italic text-[15px] transition-all active:scale-[0.98] flex items-center justify-center space-x-2",
                    enabled
                        ? "bg-zinc-900 text-white shadow-premium"
                        : "bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-70"
                )}
            >
                <span>{label}</span>
                {enabled && <ChevronRight className="w-4 h-4" />}
            </button>
            {/* Safe area spacer for iPhones */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
    );

    // Screens map
    const stepsData = [
        { id: 1, content: renderStep1() },
        { id: 2, content: renderStep2() },
        { id: 3, content: renderStep3() },
        { id: 4, content: renderStep4() },
        { id: 5, content: renderStep5() },
        { id: 6, content: renderStep6() },
        { id: 7, content: renderStep7() },
    ];

    return (
        <div
            className="fixed inset-0 bg-zinc-50 overflow-hidden text-zinc-900 font-sans"
            // Use dvh to match dynamic viewport (ignoring navbars)
            style={{ height: '100dvh', width: '100dvw' }}
        >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-200 z-50">
                <motion.div
                    className="h-full bg-zinc-900"
                    initial={{ width: '16%' }}
                    animate={{ width: `${(step / 7) * 100}%` }}
                    transition={{ ease: "easeInOut", duration: 0.3 }}
                />
            </div>

            {/* Back button (invisible area for swiping back / small hit target) */}
            {step > 1 && (
                <div
                    className="absolute top-4 left-4 z-50 w-12 h-12 flex items-center justify-center cursor-pointer"
                    onClick={handleBack}
                >
                    <ChevronLeft className="w-8 h-8 text-zinc-400" strokeWidth={2.5} />
                </div>
            )}

            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 50, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    drag={step > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = Math.abs(offset.x) * velocity.x;
                        if (swipe > 100 && step > 1) {
                            handleBack();
                        } else if (swipe < -100 && step < 7) {
                            // Only allow forward swipe if allowed (e.g., they filled the input)
                            const canProceed =
                                (step === 2 && balance.length > 0) ||
                                (step === 3 && ageRange.length > 0) ||
                                (step === 4 && income.length > 0) ||
                                (step === 5 && expense.length > 0) ||
                                (step === 6);

                            if (canProceed || step === 1) {
                                handleNext();
                            }
                        }
                    }}
                    className="h-full w-full absolute inset-0"
                >
                    {stepsData.find(s => s.id === step)?.content}
                </motion.div>
            </AnimatePresence>

            {/* Preload the active images for fast swapping */}
            <div className="hidden">
                <img src="/illustrations/mascot-balance-day.webp" alt="" />
                <img src="/illustrations/mascot-income-recurring.webp" alt="" />
                <img src="/illustrations/mascot-expense-recurring.webp" alt="" />
                <img src="/illustrations/mascot-graph-edit.webp" alt="" />
                <img src="/illustrations/mascot-graph-overview.webp" alt="" />
            </div>
        </div>
    );
}
