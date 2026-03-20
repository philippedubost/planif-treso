'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/i18n/TranslationProvider';
import { useFinanceStore } from '@/store/useFinanceStore';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react';
import { calculateProjection } from '@/lib/financeEngine';

export default function OnboardingFlow() {
    const { locale } = useTranslation();
    const router = useRouter();
    const { setStartingBalance, addTransaction, resetSimulation, setHasCompletedOnboarding, setAgeRange: setStoreAgeRange } = useFinanceStore();
    const [step, setStep] = useState(2);
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
    const reducedMotion = useReducedMotion();

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
        } else if (step === 7) {
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
        if (step === 8) {
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
        if (step < 8) {
            setDirection(1);
            setStep(prev => prev + 1);
        }
    };

    const handleSkipToFinal = async () => {
        vibrate();
        await commitAndRedirect();
        router.push(`/${locale}/dashboard`);
    };

    const handleBack = () => {
        if (step > 2) {
            vibrate();
            setDirection(-1);
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

        setHasCompletedOnboarding(true);
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

    // Render Steps
    // -------------------------------------------------------------

    const renderStep2 = () => {
        const canProceed = true; // 0 is a valid balance

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
                            Ton solde aujourd'hui, environ ?
                        </h2>
                        <p className="text-sm font-medium text-zinc-400">
                            À peu près, c'est suffisant — zéro marche aussi !
                        </p>
                        <div className="relative mt-6 max-w-xs mx-auto">
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
                        <p className="text-xs font-medium text-zinc-400 mt-3 leading-relaxed">
                            <span className="bg-zinc-900 text-white font-black rounded-md px-1.5 py-0.5">Aucune donnée n'est enregistrée</span>
                            {' '}— simulation 100% locale.
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
                            alt="Profil"
                            fill
                            priority
                            className="object-contain"
                        />
                    </div>
                    <div className="text-center space-y-4 w-full">
                        <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900">
                            Tu as quel âge, à peu près ?
                        </h2>
                        <p className="text-sm font-medium text-zinc-400 max-w-[250px] mx-auto balance-text">
                            Optionnel — juste pour personnaliser les suggestions.
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
                        {/* Entreprise option — full width */}
                        <button
                            onClick={() => {
                                setAgeRange('Entreprise');
                                setTimeout(() => handleNext(), 300);
                            }}
                            className={clsx(
                                "w-full py-4 rounded-2xl font-black text-[17px] transition-all flex items-center justify-center gap-2",
                                ageRange === 'Entreprise'
                                    ? "bg-zinc-900 text-white shadow-premium border-2 border-zinc-900"
                                    : "bg-white text-zinc-600 border-2 border-zinc-100 hover:border-zinc-200 active:scale-95"
                            )}
                        >
                            🏢 Entreprise / Pro
                        </button>
                        <button
                            onClick={() => {
                                setAgeRange('Non spécifié');
                                setTimeout(() => handleNext(), 300);
                            }}
                            className={clsx(
                                "mt-2 text-[11px] font-black uppercase tracking-widest underline underline-offset-4 transition-all",
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
        const canProceed = true; // 0 is a valid income

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
                            Tu touches environ combien par mois ?
                        </h2>
                        <div className="relative mt-6 max-w-xs mx-auto">
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
                        <p className="text-sm font-medium text-zinc-400 mt-3 max-w-[250px] mx-auto balance-text">
                            Salaire, pension, aides... une idée générale suffit
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
        const canProceed = true; // 0 is a valid expense

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
                            Et tes dépenses, environ ?
                        </h2>
                        <div className="relative mt-6 max-w-xs mx-auto">
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
                        <p className="text-sm font-medium text-zinc-400 mt-3 max-w-[250px] mx-auto balance-text">
                            Loyer, courses, abonnements... même en gros
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
        const numIncome = parseFloat(income) || 0;
        const numExpense = parseFloat(expense) || 0;
        const cashflow = numIncome - numExpense;
        const isPositive = cashflow >= 0;
        const showWarning = numIncome > 0 && numExpense > 0 && numExpense >= numIncome;

        return (
            <div className="flex flex-col pt-[8vh] px-6 space-y-6 items-center h-full no-scrollbar overflow-y-auto">
                <div className="flex flex-col items-center space-y-5 w-full max-w-sm mx-auto">
                    <div className="h-[13vh] w-full max-w-[120px]">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-graph-overview.webp"
                            srcPng="/illustrations/mascot-graph-overview.png"
                            alt="Bilan mensuel"
                            fill
                            priority
                            className="object-contain"
                        />
                    </div>
                    <div className="text-center space-y-1 w-full">
                        <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900">
                            C'est déjà bien !
                        </h2>
                        <p className="text-sm font-medium text-zinc-400">
                            Voilà ce que j'ai retenu — tu pourras tout affiner après.
                        </p>
                    </div>

                    {/* Summary card */}
                    <div className="w-full bg-white rounded-3xl p-5 shadow-soft border border-zinc-100 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-zinc-500">Entrées mensuelles</span>
                            <span className="font-black text-emerald-500">+{numIncome} €</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-zinc-500">Sorties mensuelles</span>
                            <span className="font-black text-rose-500">−{numExpense} €</span>
                        </div>
                        <div className="h-px bg-zinc-100" />
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-black text-zinc-700">Bilan mensuel</span>
                            <span className={clsx("font-black text-lg", isPositive ? "text-emerald-500" : "text-rose-500")}>
                                {isPositive ? "+" : "−"}{Math.abs(cashflow)} €
                            </span>
                        </div>
                        {showWarning && (
                            <div className="mt-1 p-3 rounded-2xl bg-amber-50 text-amber-600 text-[13px] font-bold leading-snug">
                                ⚠ Tes dépenses dépassent tes revenus. Ton solde s'érodera chaque mois.
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full max-w-sm mx-auto flex flex-col items-center space-y-3">
                    <button
                        onClick={handleSkipToFinal}
                        className="w-full py-[18px] rounded-[24px] font-black italic text-[15px] transition-all active:scale-[0.98] bg-zinc-900 text-white shadow-premium flex items-center justify-center space-x-2"
                    >
                        <span>Voir mon compte sur l'année</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="w-full py-3.5 rounded-[24px] font-black italic text-[13px] transition-all active:scale-[0.98] bg-zinc-100 text-zinc-500 flex items-center justify-center space-x-2"
                    >
                        <span>+ Ajouter un extra ponctuel d'abord</span>
                    </button>
                    <div className="h-[env(safe-area-inset-bottom)]" />
                </div>
            </div>
        );
    };

    const renderStep7 = () => {
        const canProceed = true; // Optional step
        const isFilled = parseFloat(extra) > 0 && extraLabel.trim().length > 0;

        const labelOptions = extraDirection === 'income'
            ? (ageRange === '15-24' ? ['Cadeau', 'Petit boulot', 'Vente']
                : ageRange === 'Entreprise' ? ['Facturation client', 'Subvention', 'Remboursement TVA']
                    : ['Prime', 'Cadeau', 'Remboursement'])
            : (ageRange === '15-24' ? ['Sortie', 'Voyage', 'Cadeau']
                : ageRange === '35-50' ? ['Voyage', 'Réparation', 'Impôts']
                    : ageRange === '51+' ? ['Voyage', 'Santé', 'Vacances']
                        : ageRange === 'Entreprise' ? ['Fournisseur', 'Charges sociales', 'Logiciels']
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

                    <div className="text-center space-y-1 w-full">
                        <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900">
                            Un extra prévu ? (facultatif)
                        </h2>
                        <p className="text-sm font-medium text-zinc-400">
                            Voyage, prime, réparation... tu peux aussi passer.
                        </p>
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
                        {renderCTA(isFilled ? "Ajouter et continuer" : "Non merci, continuer →", canProceed)}
                    </div>
                    <p className="text-zinc-400 font-medium text-xs mt-3 pb-8 text-center px-4">
                        Tu pourras en ajouter autant que tu veux ensuite.
                    </p>
                </div>
            </div>
        );
    };

    const renderStep8 = () => {
        const numIncome = parseFloat(income) || 0;
        const numExpense = parseFloat(expense) || 0;
        const monthlyCashflow = numIncome - numExpense;

        let headline = "Tu es sur la bonne voie";
        let colorClass = "text-emerald-500";
        let bgClass = "bg-emerald-50";
        let subMessage: string | null = null;

        // Primary check: expenses >= income (even if balance stays positive)
        if (numIncome > 0 && numExpense >= numIncome) {
            headline = "Tes dépenses dépassent tes revenus";
            colorClass = "text-rose-500";
            bgClass = "bg-rose-50";
            subMessage = `Tu perds environ ${Math.abs(Math.round(monthlyCashflow))} € par mois. Pense à rééquilibrer.`;
        } else if (previewMonthsToZero !== null) {
            if (previewMonthsToZero <= 3) {
                headline = "Attention, ton solde va passer sous zéro";
                colorClass = "text-rose-500";
                bgClass = "bg-rose-50";
                subMessage = `Sans changement, tu seras à découvert dans ${previewMonthsToZero} mois.`;
            } else {
                headline = "Ça va être serré bientôt";
                colorClass = "text-amber-500";
                bgClass = "bg-amber-50";
                subMessage = `Sans changement, tu seras à découvert dans ${previewMonthsToZero} mois.`;
            }
        } else {
            subMessage = "Ton capital augmente mois après mois !";
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

                            {subMessage && (
                                <p className={clsx("text-sm font-medium",
                                    colorClass === "text-rose-500" ? "text-rose-600"
                                        : colorClass === "text-amber-500" ? "text-amber-600"
                                            : "text-emerald-600"
                                )}>
                                    {subMessage}
                                </p>
                            )}
                        </div>

                        {/* CTA */}
                        <div className="pt-2 w-full z-20">
                            <button
                                onClick={handleSaveProfile}
                                className="w-full py-[18px] rounded-[24px] font-black italic text-[15px] transition-all active:scale-[0.98] bg-zinc-900 text-white shadow-premium flex items-center justify-center space-x-2"
                            >
                                <span>Voir mon compte sur l'année</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <p className="text-center text-xs font-medium text-zinc-400 mt-4 leading-relaxed max-w-[280px] mx-auto">
                                Rien n'est gravé dans le marbre — tu ajustes tout en temps réel dans ton tableau.
                            </p>
                            {/* Safe area spacer for iPhones */}
                            <div className="h-[env(safe-area-inset-bottom)]" />
                        </div>

                    </div>
                </div>
            </div>
        );
    };

    // Screens map
    const stepsData = [
        { id: 2, content: renderStep2() },
        { id: 3, content: renderStep3() },
        { id: 4, content: renderStep4() },
        { id: 5, content: renderStep5() },
        { id: 6, content: renderStep6() },
        { id: 7, content: renderStep7() },
        { id: 8, content: renderStep8() },
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
                    initial={{ width: '14%' }}
                    animate={{ width: `${((step - 1) / 7) * 100}%` }}
                    transition={{ ease: "easeInOut", duration: 0.3 }}
                />
            </div>

            {/* Back button (invisible area for swiping back / small hit target) */}
            {step > 2 && (
                <div
                    className="absolute top-4 left-4 z-50 w-12 h-12 flex items-center justify-center cursor-pointer"
                    onClick={handleBack}
                >
                    <ChevronLeft className="w-8 h-8 text-zinc-400" strokeWidth={2.5} />
                </div>
            )}

            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                    key={step}
                    custom={direction}
                    initial={{ opacity: 0, x: reducedMotion ? 0 : direction * 48, scale: reducedMotion ? 1 : 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: reducedMotion ? 0 : direction * -48, scale: reducedMotion ? 1 : 0.97 }}
                    transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.8 }}
                    drag={step > 2 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = Math.abs(offset.x) * velocity.x;
                        if (swipe > 100 && step > 2) {
                            handleBack();
                        } else if (swipe < -100 && step < 8) {
                            // Only allow forward swipe if allowed (e.g., they filled the input)
                            const canProceed =
                                (step === 2 && balance.length > 0) ||
                                (step === 3 && ageRange.length > 0) ||
                                (step === 4 && income.length > 0) ||
                                (step === 5 && expense.length > 0) ||
                                (step === 6) ||
                                (step === 7);

                            if (canProceed) {
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
