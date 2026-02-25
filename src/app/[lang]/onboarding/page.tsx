'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/i18n/TranslationProvider';
import { useFinanceStore } from '@/store/useFinanceStore';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { ChevronRight } from 'lucide-react';
import { calculateProjection } from '@/lib/financeEngine';

export default function OnboardingFlow() {
    const { dictionary, locale } = useTranslation();
    const router = useRouter();
    const { setStartingBalance, addTransaction, setCurrentScenario, addScenario, resetSimulation, setHasCompletedOnboarding } = useFinanceStore();
    const [step, setStep] = useState(1);

    // Data
    const [balance, setBalance] = useState<string>('');
    const [income, setIncome] = useState<string>('');
    const [expense, setExpense] = useState<string>('');

    // Precomputed results for Step 5
    const [previewMonthsToZero, setPreviewMonthsToZero] = useState<number | null>(null);

    // Refs for auto-focus
    const balanceRef = useRef<HTMLInputElement>(null);
    const incomeRef = useRef<HTMLInputElement>(null);
    const expenseRef = useRef<HTMLInputElement>(null);

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
        } else if (step === 4) {
            setTimeout(() => expenseRef.current?.focus(), 300);
        }
    }, [step]);

    // Precompute step 5 results when reaching step 5
    useEffect(() => {
        if (step === 5) {
            const numBalance = parseFloat(balance) || 0;
            const numIncome = parseFloat(income) || 0;
            const numExpense = parseFloat(expense) || 0;

            // Generate a fake local transaction list to compute
            const fakeTransactions = [];
            if (numIncome > 0) {
                fakeTransactions.push({ id: 'inc', label: 'Revenus', amount: numIncome, direction: 'income' as const, recurrence: 'monthly' as const, month: '', categoryId: 'cat-salary' });
            }
            if (numExpense > 0) {
                fakeTransactions.push({ id: 'exp', label: 'Dépenses', amount: numExpense, direction: 'expense' as const, recurrence: 'monthly' as const, month: '', categoryId: 'cat-rent' });
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
    }, [step, balance, income, expense]);

    // Flow controls
    const handleNext = () => {
        vibrate();
        if (step < 5) {
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

        setStartingBalance(numBalance);
        await addTransaction({
            label: dictionary.timeline.income,
            categoryId: 'cat-salary',
            amount: numIncome,
            direction: 'income',
            recurrence: 'monthly'
        });
        await addTransaction({
            label: "Dépenses courantes",
            categoryId: 'cat-rent',
            amount: numExpense,
            direction: 'expense',
            recurrence: 'monthly'
        });

        const id = await addScenario('Mon profil');
        if (id) {
            setCurrentScenario(id);
        }

        setHasCompletedOnboarding(true);
    };

    // Render Steps
    // -------------------------------------------------------------

    const renderStep1 = () => (
        <div className="flex flex-col h-full w-full justify-between pt-[10vh]">
            <div className="flex flex-col items-center flex-1 space-y-8 px-6">
                <div className="h-[30vh] w-full max-w-[280px]">
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
                        Voyons où va ton argent
                    </h1>
                    <p className="text-[15px] font-medium text-zinc-500 leading-relaxed balance-text">
                        En 30 secondes tu verras ton futur financier
                    </p>
                </div>
            </div>
            {renderCTA("Commencer", true)}
        </div>
    );

    const renderStep2 = () => {
        const canProceed = balance.length > 0;

        return (
            <div className="flex flex-col h-full w-full justify-between pt-[10vh]">
                <div className="flex flex-col items-center flex-1 space-y-6 px-6">
                    <div className="h-[25vh] w-full max-w-[240px]">
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
                {renderCTA("Continuer", canProceed)}
            </div>
        );
    };

    const renderStep3 = () => {
        const canProceed = income.length > 0;

        return (
            <div className="flex flex-col h-full w-full justify-between pt-[10vh]">
                <div className="flex flex-col items-center flex-1 space-y-6 px-6">
                    <div className="h-[25vh] w-full max-w-[240px]">
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
                {renderCTA("Continuer", canProceed)}
            </div>
        );
    };

    const renderStep4 = () => {
        const canProceed = expense.length > 0;

        return (
            <div className="flex flex-col h-full w-full justify-between pt-[10vh]">
                <div className="flex flex-col items-center flex-1 space-y-6 px-6">
                    <div className="h-[25vh] w-full max-w-[240px]">
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
                {renderCTA("Voir ma projection", canProceed)}
            </div>
        );
    };

    const renderStep5 = () => {
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

        return (
            <div className="flex flex-col h-full w-full justify-between pt-[8vh]">
                <div className="flex flex-col items-center flex-1 space-y-6 px-6">
                    <div className="h-[22vh] w-full max-w-[240px]">
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
                    </div>
                </div>

                {/* Custom CTA block for final step */}
                <div className="px-5 pb-8 pt-4 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent sticky bottom-0">
                    <button
                        onClick={handleSaveProfile}
                        className="w-full py-[18px] rounded-[24px] font-black italic text-[15px] transition-all active:scale-[0.98] bg-zinc-900 text-white shadow-premium flex items-center justify-center space-x-2"
                    >
                        <span>Voir mon compte sur l'année</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <p className="text-center text-[11px] font-medium text-zinc-400 mt-4 px-2 leading-relaxed">
                        Tu pourras ensuite ajuster tes entrées/sorties par mois et ajouter des extras ponctuels pour anticiper le reste de l'année.
                    </p>
                    {/* Safe area spacer for iPhones */}
                    <div className="h-[env(safe-area-inset-bottom)]" />
                </div>
            </div>
        );
    };

    // Shared CTA Renderer
    const renderCTA = (label: string, enabled: boolean) => (
        <div className="px-5 pb-8 pt-4 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent sticky bottom-0 z-20">
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
                    initial={{ width: '20%' }}
                    animate={{ width: `${(step / 5) * 100}%` }}
                    transition={{ ease: "easeInOut", duration: 0.3 }}
                />
            </div>

            {/* Back button (invisible area for swiping back / small hit target) */}
            {step > 1 && (
                <div
                    className="absolute top-4 left-4 z-50 w-12 h-12 flex items-center justify-center"
                    onClick={handleBack}
                >
                    <div className="text-zinc-400 font-black text-xs uppercase tracking-widest pl-2">
                        ←
                    </div>
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
                        } else if (swipe < -100 && step < 5) {
                            // Only allow forward swipe if allowed (e.g., they filled the input)
                            const canProceed =
                                (step === 2 && balance.length > 0) ||
                                (step === 3 && income.length > 0) ||
                                (step === 4 && expense.length > 0);

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
                <img src="/illustrations/mascot-graph-overview.webp" alt="" />
            </div>
        </div>
    );
}
