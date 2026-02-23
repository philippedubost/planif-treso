'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Plus, ChevronRight, Check } from 'lucide-react';
import Image from 'next/image';

const slides = [
    {
        id: 'welcome',
        title: 'Welcome to Planif-Treso',
        description: 'Master your cashflow with a few swipes.',
        image: '/illustrations/mascot-onboarding-start.png',
    },
    {
        id: 'balance',
        title: 'Starting Point',
        description: 'What is your current balance today?',
        image: '/illustrations/mascot-balance-day.png',
        type: 'input',
        field: 'startingBalance',
    },
    {
        id: 'income-recurring',
        title: 'Recurring Incomes',
        description: 'Add your salary or other monthly incomes.',
        image: '/illustrations/mascot-income-recurring.png',
        type: 'suggestions',
        suggestions: ['Salary', 'Freelance', 'Dividends'],
        direction: 'income',
        recurrence: 'monthly',
    },
    {
        id: 'expense-recurring',
        title: 'Recurring Expenses',
        description: 'Rent, subscriptions, utilities...',
        image: '/illustrations/mascot-expense-recurring.png',
        type: 'suggestions',
        suggestions: ['Rent', 'Netflix', 'Electricity', 'Gym'],
        direction: 'expense',
        recurrence: 'monthly',
    },
    {
        id: 'ready',
        title: 'You are ready!',
        description: 'Let\'s check your 12-month projection.',
        image: '/illustrations/mascot-success-ready.png',
    },
];

export default function OnboardingPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { setStartingBalance, addTransaction } = useFinanceStore();
    const [inputValue, setInputValue] = useState('');
    const router = useRouter();

    const handleNext = () => {
        if (slides[currentSlide].id === 'balance') {
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
            categoryId: `cat-${label.toLowerCase()}`,
            amount: direction === 'income' ? 2000 : 500, // Dummy defaults
            direction,
            recurrence: 'monthly',
            startMonth: new Date().toISOString().substring(0, 7),
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
                        <div className="relative w-64 h-64 mx-auto mb-8 bg-zinc-100 dark:bg-zinc-900 rounded-[48px] overflow-hidden flex items-center justify-center">
                            <div className="text-zinc-400 text-xs italic p-4">Illustration placeholder:<br />{slide.image}</div>
                            {/* <Image src={slide.image} alt={slide.title} fill className="object-contain" /> */}
                        </div>

                        <h1 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-zinc-100 italic tracking-tight">{slide.title}</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8">{slide.description}</p>

                        {slide.type === 'input' && (
                            <input
                                type="number"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="0.00 €"
                                className="w-full p-4 text-2xl font-bold text-center bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none mb-8"
                                autoFocus
                            />
                        )}

                        {slide.type === 'suggestions' && (
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                {slide.suggestions?.map((sub) => (
                                    <button
                                        key={sub}
                                        onClick={() => handleSuggestionAdd(sub, slide.direction as any)}
                                        className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <span className="font-medium">{sub}</span>
                                        <Plus className="w-4 h-4 text-zinc-400" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="pb-8 space-y-4">
                <div className="flex justify-center space-x-2">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-zinc-900 dark:bg-zinc-100' : 'w-2 bg-zinc-200 dark:bg-zinc-800'}`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="w-full py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[24px] font-bold text-lg flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform shadow-xl shadow-zinc-200 dark:shadow-none"
                >
                    <span>{currentSlide === slides.length - 1 ? 'Go!' : 'Next'}</span>
                    <ChevronRight className="w-5 h-5" />
                </button>

                {currentSlide > 0 && (
                    <button
                        onClick={() => setCurrentSlide(currentSlide - 1)}
                        className="w-full py-2 text-zinc-400 font-medium"
                    >
                        Back
                    </button>
                )}
            </div>
        </div>
    );
}
