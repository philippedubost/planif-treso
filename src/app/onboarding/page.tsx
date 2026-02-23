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
    const router = useRouter();

    const handleNext = () => {
        const slide = slides[currentSlide]; // Moved this line to the top
        if (slide.id === 'balance') {
            setStartingBalance(parseFloat(inputValue) || 0);
        }

        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
            setInputValue('');
        } else {
            router.push('/dashboard');
        }
    };

    const handleSuggestionAdd = (label: string, direction: 'income' | 'expense') => {
        addTransaction({
            label,
            amount: 0, // Changed default amount
            direction,
            categoryId: direction === 'income' ? 'cat-salary' : 'cat-rent', // Changed categoryId logic
            recurrence: 'monthly',
            startMonth: format(new Date(), 'yyyy-MM'), // Changed date format
        });
    };

    const slide = slides[currentSlide];

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col p-6 max-w-md mx-auto">
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
                            className="relative w-full aspect-square max-w-[280px] mx-auto mb-12 bg-white rounded-[48px] shadow-premium overflow-hidden flex items-center justify-center group"
                        >
                            <Image
                                src={slide.image}
                                alt={slide.title}
                                fill
                                className="object-contain p-4 group-hover:scale-110 transition-transform duration-700 ease-out"
                                priority
                            />
                        </motion.div>

                        <h1 className="text-4xl font-black mb-4 text-zinc-900 italic tracking-tighter leading-none">
                            {slide.title}
                        </h1>
                        <p className="text-zinc-500 font-medium leading-relaxed px-4">
                            {slide.description}
                        </p>

                        <div className="mt-12 w-full">
                            {slide.type === 'input' && (
                                <motion.input
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="0.00 €"
                                    className="w-full p-6 text-4xl font-black text-center bg-white shadow-soft border-none rounded-3xl selection:bg-zinc-100 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all text-zinc-900"
                                    autoFocus
                                />
                            )}

                            {slide.type === 'suggestions' && (
                                <div className="grid grid-cols-1 gap-3 px-2">
                                    {slide.suggestions?.map((sub, i) => (
                                        <motion.button
                                            key={sub}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            onClick={() => handleSuggestionAdd(sub, slide.direction as any)}
                                            className="flex items-center justify-between p-5 bg-white shadow-soft rounded-3xl hover:bg-zinc-50 active:scale-[0.98] transition-all group"
                                        >
                                            <span className="font-bold text-lg text-zinc-700">{sub}</span>
                                            <div className="bg-zinc-900 rounded-xl p-2 group-active:rotate-90 transition-transform">
                                                <Plus className="w-4 h-4 text-white" />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="pb-12 space-y-8">
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

                    {currentSlide > 0 ? (
                        <button
                            onClick={() => setCurrentSlide(currentSlide - 1)}
                            className="w-full mt-4 py-2 text-zinc-400 font-bold uppercase tracking-widest text-xs tap-effect"
                        >
                            Retour
                        </button>
                    ) : (
                        <div className="h-[40px]" />
                    )}
                </div>
            </div>
        </div>
    );
}
