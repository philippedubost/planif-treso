'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/i18n/TranslationProvider';
import { useFinanceStore, getAgeBasedSuggestions } from '@/store/useFinanceStore';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { computeOnboardingBilan } from '@/lib/onboardingBilan';
import { BilanScenarioBadge, BilanScenarioCard } from '@/components/onboarding/BilanScenarioCard';
import {
    OnboardingMascot,
    OnboardingTitle,
    OnboardingSubtitle,
    OnboardingStagger,
    OnboardingStaggerItem,
    OnboardingFieldCard,
    OnboardingCTAButton,
    OnboardingPopButton,
} from '@/components/onboarding/OnboardingStepParts';

export default function OnboardingFlow() {
    const { locale } = useTranslation();
    const router = useRouter();
    const { setStartingBalance, addTransaction, resetSimulation, setHasCompletedOnboarding } = useFinanceStore();
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
    const suggestions = useMemo(() => getAgeBasedSuggestions('Non spécifié'), []);

    const bilan = useMemo(
        () =>
            computeOnboardingBilan(
                parseFloat(balance) || 0,
                parseFloat(income) || 0,
                parseFloat(expense) || 0,
                parseFloat(extra) || 0,
                extraMonth,
                extraDirection
            ),
        [balance, income, expense, extra, extraMonth, extraDirection]
    );

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
        } else if (step === 3) {
            setTimeout(() => incomeRef.current?.focus(), 300);
        } else if (step === 5) {
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

    // Flow controls
    const handleNext = () => {
        vibrate();
        if (step < 6) {
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
                label: extraLabel || 'Événement',
                categoryId: extraDirection === 'expense' ? 'cat-shopping' : 'cat-salary',
                amount: numExtra,
                direction: extraDirection,
                month: appliedMonth,
                recurrence: 'none'
            });
        }

        setHasCompletedOnboarding(true);
    };

    const renderCTA = (label: string, enabled: boolean) => (
        <div className="pt-4 w-full z-20">
            <OnboardingCTAButton disabled={!enabled} onClick={handleNext}>
                <span>{label}</span>
                {enabled && <ChevronRight className="w-4 h-4" />}
            </OnboardingCTAButton>
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
                    <OnboardingMascot className="h-[15vh] w-full max-w-[140px] relative">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-balance-day.webp"
                            srcPng="/illustrations/mascot-balance-day.png"
                            alt="Solde courant"
                            fill
                            priority
                            className="object-contain"
                        />
                    </OnboardingMascot>
                    <div className="text-center space-y-2 w-full">
                        <OnboardingTitle className="text-2xl font-black italic tracking-tighter text-zinc-900">
                            Ton solde aujourd&apos;hui, environ ?
                        </OnboardingTitle>
                        <OnboardingSubtitle className="text-sm font-medium text-zinc-400">
                            À peu près, c&apos;est suffisant — zéro marche aussi !
                        </OnboardingSubtitle>
                        <OnboardingStagger className="relative mt-6 max-w-xs mx-auto">
                            <OnboardingStaggerItem>
                                <div className="relative">
                                    <input
                                        ref={balanceRef}
                                        type="number"
                                        inputMode="decimal"
                                        value={balance}
                                        onChange={(e) => setBalance(e.target.value)}
                                        className="w-full text-center text-4xl font-black tabular-nums bg-white/60 rounded-2xl border-2 border-violet-100 py-3 focus:outline-none focus:border-violet-400 focus:bg-white transition-all shadow-sm"
                                        placeholder="0"
                                        onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-black text-violet-300">€</span>
                                </div>
                            </OnboardingStaggerItem>
                        </OnboardingStagger>
                        <OnboardingSubtitle className="text-xs font-medium text-zinc-400 mt-3 leading-relaxed">
                            <span className="bg-zinc-900 text-white font-black rounded-lg px-2 py-0.5">Aucune donnée n&apos;est enregistrée</span>
                            {' '}— simulation 100% locale.
                        </OnboardingSubtitle>
                    </div>
                </div>
                <div className="w-full max-w-sm mx-auto">
                    {renderCTA("Continuer", canProceed)}
                </div>
            </div>
        );
    };

    const renderStep3 = () => {
        const canProceed = true;

        return (
            <div className="flex flex-col pt-[4vh] px-6 space-y-4 items-center h-full no-scrollbar overflow-y-auto">
                <div className="flex flex-col items-center space-y-3 w-full max-w-sm mx-auto">
                    <OnboardingMascot className="h-[10vh] max-h-24 w-full max-w-[100px] relative">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-graph-overview.webp"
                            srcPng="/illustrations/mascot-graph-overview.png"
                            alt="Entrées et sorties"
                            fill
                            priority
                            className="object-contain"
                        />
                    </OnboardingMascot>
                    <div className="text-center space-y-0.5 w-full">
                        <OnboardingTitle className="text-xl font-black italic tracking-tighter text-zinc-900">
                            Tes entrées et sorties par mois
                        </OnboardingTitle>
                        <OnboardingSubtitle className="text-xs font-medium text-zinc-400">
                            Une estimation suffit.
                        </OnboardingSubtitle>
                    </div>

                    <div className="w-full space-y-3">
                        <OnboardingFieldCard className="w-full bg-white rounded-2xl p-3 shadow-soft border-2 border-emerald-100 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-black text-emerald-600 shrink-0">Entrées / mois</p>
                                <div className="flex flex-wrap justify-end gap-1">
                                    {suggestions.income.slice(0, 3).map((s) => (
                                        <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-400 bg-zinc-50 border border-zinc-100 whitespace-nowrap">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    ref={incomeRef}
                                    type="number"
                                    inputMode="decimal"
                                    value={income}
                                    onChange={(e) => setIncome(e.target.value)}
                                    className="w-full text-center text-2xl font-black tabular-nums bg-emerald-50/50 rounded-xl border-2 border-emerald-100 py-1.5 focus:outline-none focus:border-emerald-400 transition-all text-emerald-600"
                                    placeholder="0"
                                    onKeyDown={(e) => e.key === 'Enter' && expenseRef.current?.focus()}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-black text-emerald-300">€</span>
                            </div>
                        </OnboardingFieldCard>

                        <OnboardingFieldCard fromRight className="w-full bg-white rounded-2xl p-3 shadow-soft border-2 border-rose-100 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-black text-rose-600 shrink-0">Sorties / mois</p>
                                <div className="flex flex-wrap justify-end gap-1">
                                    {suggestions.expense.slice(0, 3).map((s) => (
                                        <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-400 bg-zinc-50 border border-zinc-100 whitespace-nowrap">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    ref={expenseRef}
                                    type="number"
                                    inputMode="decimal"
                                    value={expense}
                                    onChange={(e) => setExpense(e.target.value)}
                                    className="w-full text-center text-2xl font-black tabular-nums bg-rose-50/50 rounded-xl border-2 border-rose-100 py-1.5 focus:outline-none focus:border-rose-400 transition-all text-rose-600"
                                    placeholder="0"
                                    onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-black text-rose-300">€</span>
                            </div>
                        </OnboardingFieldCard>
                    </div>
                </div>
                <div className="w-full max-w-sm mx-auto">
                    {renderCTA("Continuer", canProceed)}
                </div>
            </div>
        );
    };

    const renderStep4 = () => {
        const numIncome = parseFloat(income) || 0;
        const numExpense = parseFloat(expense) || 0;
        const numBalance = parseFloat(balance) || 0;
        return (
            <div className="flex flex-col pt-12 px-5 space-y-3 items-center h-full no-scrollbar overflow-y-auto">
                <div className="flex flex-col items-center space-y-2 w-full max-w-sm mx-auto">
                    <OnboardingMascot className="h-[7vh] max-h-16 w-full max-w-[72px] relative">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-graph-overview.webp"
                            srcPng="/illustrations/mascot-graph-overview.png"
                            alt="Micro-bilan"
                            fill
                            priority
                            className="object-contain"
                        />
                    </OnboardingMascot>
                    <div className="text-center space-y-0.5 w-full">
                        <OnboardingTitle className="text-xl font-black italic tracking-tighter text-zinc-900">
                            Ton micro-bilan
                        </OnboardingTitle>
                        <OnboardingSubtitle className="text-xs font-medium text-zinc-400">
                            Tu pourras affiner plus tard.
                        </OnboardingSubtitle>
                    </div>

                    <OnboardingStagger className="w-full bg-white rounded-2xl p-3 shadow-soft border-2 border-zinc-100 space-y-2">
                        <OnboardingStaggerItem>
                            <div className="text-center pb-2 border-b border-zinc-100">
                                <p className="text-[9px] uppercase font-black tracking-widest text-zinc-400">Solde actuel</p>
                                <motion.p
                                    className="font-black text-xl tabular-nums text-zinc-900"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.28 }}
                                >
                                    {numBalance.toLocaleString('fr-FR')} €
                                </motion.p>
                            </div>
                        </OnboardingStaggerItem>
                        <OnboardingStaggerItem className="space-y-1">
                            <p className="text-[9px] uppercase font-black tracking-widest text-zinc-400 text-center">Par mois</p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-500">Entrées</span>
                                <span className="font-black text-sm text-emerald-500 tabular-nums">+{numIncome.toLocaleString('fr-FR')} €</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-500">Sorties</span>
                                <span className="font-black text-sm text-rose-500 tabular-nums">−{numExpense.toLocaleString('fr-FR')} €</span>
                            </div>
                        </OnboardingStaggerItem>
                        <BilanScenarioCard bilan={bilan} stamp compact />
                    </OnboardingStagger>
                </div>

                <div className="w-full max-w-sm mx-auto flex flex-col items-center space-y-2">
                    <OnboardingCTAButton onClick={handleSkipToFinal}>
                        <span>Voir mon compte sur l&apos;année</span>
                        <ChevronRight className="w-4 h-4" />
                    </OnboardingCTAButton>
                    <OnboardingCTAButton variant="secondary" onClick={handleNext} className="!py-2.5 !text-[12px]">
                        <span>+ Ajouter un événement d&apos;abord</span>
                    </OnboardingCTAButton>
                    <div className="h-[env(safe-area-inset-bottom)]" />
                </div>
            </div>
        );
    };

    const renderStep5 = () => {
        const canProceed = true; // Optional step
        const isFilled = parseFloat(extra) > 0 && extraLabel.trim().length > 0;

        const labelOptions = suggestions.extra;

        return (
            <div className="flex flex-col pt-[8vh] px-6 space-y-6 items-center h-full no-scrollbar overflow-y-auto">
                <div className="flex flex-col items-center space-y-5 w-full max-w-sm mx-auto">
                    <OnboardingMascot className="h-[13vh] w-full max-w-[120px] relative">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-graph-edit.webp"
                            srcPng="/illustrations/mascot-income-oneoff.png"
                            alt="Événement"
                            fill
                            priority
                            className="object-contain"
                        />
                    </OnboardingMascot>

                    <div className="text-center space-y-1 w-full">
                        <OnboardingTitle className="text-2xl font-black italic tracking-tighter text-zinc-900">
                            Un événement prévu ?
                        </OnboardingTitle>
                        <OnboardingSubtitle className="text-sm font-medium text-zinc-400">
                            Facultatif — voyage, prime, réparation...
                        </OnboardingSubtitle>
                    </div>

                    <OnboardingStagger className="w-full bg-white rounded-3xl p-4 shadow-soft border-2 border-violet-100 text-left space-y-4 text-[17px] font-black italic tracking-tight text-zinc-900 leading-snug">
                        <OnboardingStaggerItem className="space-y-2">
                            <span className="text-zinc-400">En</span>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
                                {next12Months.slice(0, 6).map(m => (
                                    <OnboardingPopButton
                                        key={m.value}
                                        selected={extraMonth === m.value}
                                        onClick={() => setExtraMonth(m.value)}
                                        className={clsx(
                                            'shrink-0 px-3 py-1.5 rounded-xl text-sm font-black border capitalize',
                                            extraMonth === m.value
                                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-md'
                                                : 'bg-white text-zinc-500 border-zinc-100 hover:border-zinc-300'
                                        )}
                                    >
                                        {m.label.split(' ')[0]}
                                    </OnboardingPopButton>
                                ))}
                            </div>
                        </OnboardingStaggerItem>

                        <OnboardingStaggerItem className="flex items-center gap-3">
                            <span className="text-zinc-400">je vais</span>
                            <div className="flex rounded-xl overflow-hidden border-2 border-zinc-100 shadow-sm text-sm">
                                <OnboardingPopButton
                                    selected={extraDirection === 'expense'}
                                    onClick={() => setExtraDirection('expense')}
                                    className={clsx(
                                        'px-4 py-1.5 font-black',
                                        extraDirection === 'expense'
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-white text-zinc-400'
                                    )}
                                >
                                    payer
                                </OnboardingPopButton>
                                <OnboardingPopButton
                                    selected={extraDirection === 'income'}
                                    onClick={() => setExtraDirection('income')}
                                    className={clsx(
                                        'px-4 py-1.5 font-black',
                                        extraDirection === 'income'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-white text-zinc-400'
                                    )}
                                >
                                    recevoir
                                </OnboardingPopButton>
                            </div>
                        </OnboardingStaggerItem>

                        <OnboardingStaggerItem className="flex items-center gap-3">
                            <span className="text-zinc-400">un montant de</span>
                            <input
                                ref={extraRef}
                                type="number"
                                inputMode="decimal"
                                value={extra}
                                onChange={(e) => setExtra(e.target.value)}
                                className={clsx(
                                    'w-24 text-center font-black text-base rounded-lg border-2 bg-white/80 outline-none py-1 transition-colors',
                                    extraDirection === 'expense'
                                        ? 'border-rose-200 text-rose-600 placeholder:text-rose-200'
                                        : 'border-emerald-200 text-emerald-600 placeholder:text-emerald-200'
                                )}
                                placeholder="0"
                                onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                            />
                        </OnboardingStaggerItem>

                        <OnboardingStaggerItem className="space-y-2">
                            <span className="text-zinc-400">pour</span>
                            {extraIsOther ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={extraLabel}
                                        onChange={(e) => setExtraLabel(e.target.value)}
                                        className="flex-1 border-2 border-zinc-200 rounded-lg bg-white px-2 py-1 outline-none font-black text-zinc-900 placeholder:text-zinc-300 not-italic"
                                        placeholder="Libellé…"
                                        onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                                        autoFocus
                                    />
                                    <OnboardingPopButton
                                        onClick={() => { setExtraIsOther(false); setExtraLabel(''); }}
                                        className="text-[10px] text-zinc-400 uppercase tracking-widest font-black"
                                    >
                                        ← retour
                                    </OnboardingPopButton>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {labelOptions.map(opt => (
                                        <OnboardingPopButton
                                            key={opt}
                                            selected={extraLabel === opt}
                                            onClick={() => { setExtraLabel(opt); setExtraIsOther(false); }}
                                            className={clsx(
                                                'px-3 py-1.5 rounded-xl text-sm font-black border not-italic',
                                                extraLabel === opt
                                                    ? extraDirection === 'expense'
                                                        ? 'bg-rose-500 text-white border-rose-500'
                                                        : 'bg-emerald-500 text-white border-emerald-500'
                                                    : 'bg-zinc-50 text-zinc-400 border-zinc-100 hover:border-zinc-200'
                                            )}
                                        >
                                            {opt}
                                        </OnboardingPopButton>
                                    ))}
                                    <OnboardingPopButton
                                        onClick={() => { setExtraIsOther(true); setExtraLabel(''); }}
                                        className="px-3 py-1.5 rounded-xl text-sm font-black border border-dashed border-zinc-200 text-zinc-400 hover:border-zinc-400 not-italic"
                                    >
                                        Autre…
                                    </OnboardingPopButton>
                                </div>
                            )}
                        </OnboardingStaggerItem>
                    </OnboardingStagger>
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

    const renderStep6 = () => {
        const numBalance = parseFloat(balance) || 0;
        const numIncome = parseFloat(income) || 0;
        const numExpense = parseFloat(expense) || 0;
        const { format } = require('date-fns');
        const { fr } = require('date-fns/locale');
        const numExtra = parseFloat(extra) || 0;

        return (
            <div className="flex flex-col pt-[8vh] px-6 pb-20 items-center h-full no-scrollbar overflow-y-auto w-full">
                <div className="flex flex-col items-center space-y-6 w-full max-w-sm mx-auto">
                    <OnboardingMascot className="h-[15vh] w-full max-w-[140px] relative">
                        <ImageWithFallback
                            srcWebp="/illustrations/mascot-graph-overview.webp"
                            srcPng="/illustrations/mascot-graph-overview.png"
                            alt="Prévisualisation"
                            fill
                            priority
                            className="object-contain"
                        />
                    </OnboardingMascot>

                    <div className="text-center space-y-4 w-full">
                        <BilanScenarioBadge bilan={bilan} />

                        <OnboardingStagger className="bg-white rounded-3xl p-5 shadow-soft border-2 border-zinc-100 max-w-sm mx-auto w-full space-y-4">
                            <OnboardingStaggerItem>
                                <div className="text-center pb-3 border-b border-zinc-50">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Solde actuel</p>
                                    <p className="font-black text-2xl tabular-nums text-zinc-900">{numBalance.toLocaleString('fr-FR')} €</p>
                                </div>
                            </OnboardingStaggerItem>
                            <OnboardingStaggerItem className="flex justify-between items-center">
                                <span className="text-sm font-bold text-zinc-500">Entrées / mois</span>
                                <span className="font-black text-emerald-500">+{numIncome.toLocaleString('fr-FR')} €</span>
                            </OnboardingStaggerItem>
                            <OnboardingStaggerItem className="flex justify-between items-center">
                                <span className="text-sm font-bold text-zinc-500">Sorties / mois</span>
                                <span className="font-black text-rose-500">−{numExpense.toLocaleString('fr-FR')} €</span>
                            </OnboardingStaggerItem>
                            {numExtra > 0 && (
                                <OnboardingStaggerItem className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-zinc-500">Événement</span>
                                    <span className={clsx("font-black text-sm", extraDirection === 'income' ? 'text-emerald-500' : 'text-rose-500')}>
                                        {extraDirection === 'income' ? '+' : '−'}{numExtra.toLocaleString('fr-FR')} €
                                        {extraMonth && <span className="text-[10px] text-zinc-400 font-medium ml-1">en {format(new Date(extraMonth + '-01'), 'MMMM', { locale: fr })}</span>}
                                    </span>
                                </OnboardingStaggerItem>
                            )}
                            <BilanScenarioCard bilan={bilan} hideHeadline stamp />
                        </OnboardingStagger>

                        <div className="pt-2 w-full z-20">
                            <OnboardingCTAButton onClick={handleSaveProfile}>
                                <span>Voir mon compte sur l&apos;année</span>
                                <ChevronRight className="w-4 h-4" />
                            </OnboardingCTAButton>
                            <OnboardingSubtitle className="text-center text-xs font-medium text-zinc-400 mt-4 leading-relaxed max-w-[280px] mx-auto">
                                Rien n&apos;est gravé dans le marbre — tu ajustes tout en temps réel.
                            </OnboardingSubtitle>
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
    ];

    return (
        <div
            className="fixed inset-0 overflow-hidden text-zinc-900 font-sans"
            style={{ height: '100dvh', width: '100dvw', background: 'linear-gradient(155deg, #f5f3ff 0%, #fdfcff 55%, #f8f9ff 100%)' }}
        >
            {/* Progress Bar — chunky Duolingo style */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-violet-100/80 z-50 px-3 pt-2">
                <div className="h-2 rounded-full bg-violet-100 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((step - 2) / 4) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                </div>
            </div>

            {/* Back button */}
            {step > 2 && (
                <motion.button
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.88 }}
                    className="absolute top-5 left-3 z-50 w-11 h-11 flex items-center justify-center cursor-pointer bg-white/80 backdrop-blur-sm rounded-2xl border border-zinc-100 shadow-sm"
                    onClick={handleBack}
                >
                    <ChevronLeft className="w-7 h-7 text-zinc-400" strokeWidth={2.5} />
                </motion.button>
            )}

<AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                    key={step}
                    custom={direction}
                    initial={{ opacity: 0, x: reducedMotion ? 0 : direction * 56, scale: reducedMotion ? 1 : 0.92, rotate: reducedMotion ? 0 : direction * 2 }}
                    animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, x: reducedMotion ? 0 : direction * -56, scale: reducedMotion ? 1 : 0.92, rotate: reducedMotion ? 0 : direction * -2 }}
                    transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.75 }}
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
