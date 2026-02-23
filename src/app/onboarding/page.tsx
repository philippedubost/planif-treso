'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Plus, ChevronRight, Check } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns'; // Added import for date-fns format

const slides = [
    {
        id: 'welcome',
        title: 'Bienvenue sur Planif-Treso',
        description: 'Maîtrisez votre trésorerie en quelques gestes.',
        image: '/illustrations/mascot-onboarding-start.png',
    },
    {
        id: 'balance',
        title: 'Votre Solde Actuel',
        description: 'Quel montant avez-vous en banque aujourd\'hui ?',
        image: '/illustrations/mascot-balance-day.png',
        type: 'input',
        field: 'startingBalance',
    },
    {
        id: 'income', // Changed from 'income-recurring'
        title: 'Revenus Récurrents',
        description: 'Ajoutez vos revenus mensuels prévus.',
        image: '/illustrations/mascot-income-recurring.png',
        type: 'suggestions',
        suggestions: ['Salaire', 'Dividendes', 'Loyer perçu', 'Pension'], // Updated suggestions
        direction: 'income',
        // Removed recurrence: 'monthly'
    },
    {
        id: 'expense', // Changed from 'expense-recurring'
        title: 'Dépenses Fixes',
        description: 'Loyer, abonnements, factures...',
        image: '/illustrations/mascot-expense-recurring.png',
        type: 'suggestions',
        suggestions: ['Loyer', 'Électricité', 'Internet', 'Netflix', 'Assurance'], // Updated suggestions
        direction: 'expense',
        // Removed recurrence: 'monthly'
    },
    {
        id: 'ready',
        title: 'Tout est Prêt !',
        description: 'Vous pouvez maintenant suivre vos projections sur 12 mois.',
        image: '/illustrations/mascot-success-ready.png',
    },
];

export default function OnboardingPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { setStartingBalance, addTransaction } = useFinanceStore();
    const [inputValue, setInputValue] = useState('');
    const [addedCount, setAddedCount] = useState(0);
    const router = useRouter();

    const handleNext = () => {
        const slide = slides[currentSlide];
        if (slide.id === 'balance') {
            setStartingBalance(parseFloat(inputValue) || 0);
        }

        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
            setInputValue('');
            setAddedCount(0);
        } else {
            router.push('/dashboard');
        }
    };

    const handleSkip = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
            setInputValue('');
            setAddedCount(0);
        } else {
            router.push('/dashboard');
        }
    };

    const handleSuggestionAdd = (label: string, direction: 'income' | 'expense') => {
        const amount = parseFloat(inputValue) || 0;
        addTransaction({
            label,
            amount: amount,
            direction,
            categoryId: direction === 'income' ? 'cat-salary' : 'cat-rent',
            recurrence: 'monthly',
            startMonth: format(new Date(), 'yyyy-MM'),
        });
        setInputValue('');
        setAddedCount(prev => prev + 1);
    };

    const slide = slides[currentSlide];

    return (
        <div className="min-h-screen bg-transparent flex flex-col p-6 max-w-md mx-auto relative z-10">
            {/* Skip Link */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-zinc-600 transition-colors"
                >
                    Passer l'onboarding
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={slide.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full"
                    >
                        <motion.div
                            layoutId="image-container"
                            className="relative w-full aspect-square max-w-[240px] mx-auto mb-8 bg-white rounded-[48px] shadow-premium overflow-hidden flex items-center justify-center group"
                        >
                            <Image
                                src={slide.image}
                                alt={slide.title}
                                fill
                                className="object-contain p-4 group-hover:scale-110 transition-transform duration-700 ease-out"
                                priority
                            />
                        </motion.div>

                        <h1 className="text-4xl font-black mb-2 text-zinc-900 italic tracking-tighter leading-none">
                            {slide.title}
                        </h1>
                        <p className="text-zinc-500 font-medium leading-relaxed px-4 text-sm mb-8">
                            {slide.description}
                        </p>

                        <div className="w-full">
                            {(slide.type === 'input' || slide.type === 'suggestions') && (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full p-8 text-5xl font-black text-center bg-white shadow-soft border-none rounded-[40px] selection:bg-zinc-100 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all text-zinc-900 placeholder:text-zinc-100"
                                            autoFocus
                                        />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-2xl text-zinc-200">€</span>
                                    </div>

                                    {slide.type === 'suggestions' && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">Sélectionnez une catégorie pour ajouter</p>
                                            <div className="flex flex-wrap justify-center gap-2 px-2">
                                                {slide.suggestions?.map((sub, i) => (
                                                    <motion.button
                                                        key={sub}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        onClick={() => handleSuggestionAdd(sub, slide.direction as any)}
                                                        className="px-5 py-3 bg-white shadow-soft rounded-2xl hover:bg-zinc-50 active:scale-[0.98] transition-all group flex items-center space-x-2 border border-zinc-50"
                                                    >
                                                        <span className="font-bold text-sm text-zinc-700">{sub}</span>
                                                        <Plus className="w-3 h-3 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                                                    </motion.button>
                                                ))}
                                            </div>
                                            {addedCount > 0 && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-emerald-500 font-black italic text-xs"
                                                >
                                                    {addedCount} flux ajouté{addedCount > 1 ? 's' : ''} !
                                                </motion.p>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="pb-8 space-y-6">
                <div className="flex justify-center space-x-3">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-500 ease-out ${i === currentSlide ? 'w-10 bg-zinc-900' : 'w-2 bg-zinc-200'}`}
                        />
                    ))}
                </div>

                <div className="px-2">
                    <button
                        onClick={handleNext}
                        className="w-full py-6 bg-zinc-900 text-white rounded-[32px] font-black text-xl flex items-center justify-center space-x-3 active:scale-95 transition-all shadow-premium hover:opacity-90 active:bg-black"
                    >
                        <span>{currentSlide === slides.length - 1 ? 'C\'EST PARTI !' : 'CONTINUER'}</span>
                        <ChevronRight className="w-6 h-6 stroke-[3px]" />
                    </button>

                    <div className="flex justify-between items-center mt-6">
                        {currentSlide > 0 ? (
                            <button
                                onClick={() => setCurrentSlide(currentSlide - 1)}
                                className="py-2 text-zinc-400 font-bold uppercase tracking-widest text-[10px] tap-effect"
                            >
                                Retour
                            </button>
                        ) : <div />}

                        {(slide.type === 'suggestions' || slide.id === 'balance') && (
                            <button
                                onClick={handleSkip}
                                className="py-2 text-zinc-400 font-bold uppercase tracking-widest text-[10px] tap-effect"
                            >
                                Passer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
