'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, ChevronDown, Trash2, Type, Layers, Plus, EyeOff, Eye, Check, Globe } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { clsx } from 'clsx';
import { useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '@/components/i18n/TranslationProvider';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const {
        currency,
        setCurrency,
        firstName,
        setFirstName,
        ageRange,
        setAgeRange,
        resetSimulation,
        scenarios,
        currentScenarioId,
        addScenario,
        setCurrentScenario,
        deleteScenario,
        showScenarioBadge,
        setShowScenarioBadge,
        user
    } = useFinanceStore();
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [isAgeRangeOpen, setIsAgeRangeOpen] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const { locale } = useTranslation();
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);

    const switchLanguage = (newLocale: string) => {
        if (newLocale === locale) return;
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        setIsLanguageOpen(false);
        router.push(newPath);
    };

    const languages = [
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'en', label: 'English', flag: '🇬🇧' }
    ];

    const currencies = [
        { label: 'Euro', symbol: '€', code: 'EUR' },
        { label: 'Dollar', symbol: '$', code: 'USD' },
        { label: 'Livre', symbol: '£', code: 'GBP' },
        { label: 'Franc', symbol: 'CHF', code: 'CHF' },
        { label: 'CAD', symbol: 'CA$', code: 'CAD' }
    ];

    const ageRanges = ['15-24', '25-34', '35-50', '51+', 'Non spécifié'];

    const handleReset = async () => {
        await resetSimulation();
        onClose();
        window.location.href = '/assistant';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white"
                    >
                        {/* Header */}
                        <div className="p-6 md:p-8 border-b border-zinc-50 flex items-center justify-between">
                            <div className="flex flex-col items-center space-y-4 md:space-y-6 w-full text-center py-4">
                                <div className="w-24 h-24 md:w-32 md:h-32 relative">
                                    <Image
                                        src="/illustrations/mascot-balance-day.png"
                                        alt="Mascotte réglages"
                                        fill
                                        className="object-contain filter drop-shadow-xl"
                                    />
                                </div>
                                <h2 className="text-xl font-black italic tracking-tighter text-zinc-900 uppercase">Réglages</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-zinc-50 text-zinc-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">

                            {/* General Options Dropdowns */}
                            <div className="space-y-4">

                                {/* Language Dropdown */}
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 px-2">
                                        <Globe className="w-4 h-4 text-zinc-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Langue</span>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                                            className="w-full h-12 px-4 bg-zinc-50 border-2 border-transparent hover:border-zinc-100 rounded-2xl flex items-center justify-between font-bold text-zinc-900 transition-all group"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xl">{languages.find(l => l.code === locale)?.flag || '🇫🇷'}</span>
                                                <span>{languages.find(l => l.code === locale)?.label || 'Français'}</span>
                                            </div>
                                            <ChevronDown className={clsx("w-4 h-4 text-zinc-300 transition-transform duration-500", isLanguageOpen && "rotate-180")} />
                                        </button>
                                        <AnimatePresence>
                                            {isLanguageOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-zinc-50 p-2 z-50 overflow-hidden"
                                                >
                                                    <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                        {languages.map((l) => (
                                                            <button
                                                                key={l.code}
                                                                onClick={() => switchLanguage(l.code)}
                                                                className={clsx(
                                                                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                                                                    locale === l.code ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
                                                                )}
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <span className="text-xl">{l.flag}</span>
                                                                    <span>{l.label}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* User Fields */}
                                <div className="space-y-4 pt-4 border-t border-zinc-50">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 px-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Prénom</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Ton prénom..."
                                            className="w-full h-12 px-4 bg-zinc-50 border-2 border-transparent hover:border-zinc-100 rounded-2xl font-bold text-zinc-900 transition-all outline-none focus:border-zinc-200"
                                        />
                                    </div>

                                    {/* Age Range Dropdown */}
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 px-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tranche d'âge</span>
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsAgeRangeOpen(!isAgeRangeOpen)}
                                                className="w-full h-12 px-4 bg-zinc-50 border-2 border-transparent hover:border-zinc-100 rounded-2xl flex items-center justify-between font-bold text-zinc-900 transition-all group"
                                            >
                                                <span>{ageRange}</span>
                                                <ChevronDown className={clsx("w-4 h-4 text-zinc-300 transition-transform duration-500", isAgeRangeOpen && "rotate-180")} />
                                            </button>
                                            <AnimatePresence>
                                                {isAgeRangeOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-zinc-50 p-2 z-50 overflow-hidden"
                                                    >
                                                        <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                            {ageRanges.map((range) => (
                                                                <button
                                                                    key={range}
                                                                    onClick={() => {
                                                                        setAgeRange(range);
                                                                        setIsAgeRangeOpen(false);
                                                                    }}
                                                                    className={clsx(
                                                                        "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                                                                        ageRange === range ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
                                                                    )}
                                                                >
                                                                    <span>{range}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Currency */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 rounded-full border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-400">$</div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Devise</span>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                                        className="w-full h-14 px-6 bg-zinc-50 border-2 border-transparent hover:border-zinc-100 rounded-2xl flex items-center justify-between font-bold text-zinc-900 transition-all group"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="w-8 h-8 bg-white rounded-xl shadow-soft flex items-center justify-center text-sm">
                                                {currencies.find(c => c.symbol === currency)?.symbol || '€'}
                                            </span>
                                            <span>{currencies.find(c => c.symbol === currency)?.label || 'Euro'}</span>
                                        </div>
                                        <ChevronDown className={clsx("w-5 h-5 text-zinc-300 transition-transform duration-500", isCurrencyOpen && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {isCurrencyOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-zinc-50 p-2 z-50 overflow-hidden"
                                            >
                                                <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                    {currencies.map((c) => (
                                                        <button
                                                            key={c.code}
                                                            onClick={() => {
                                                                setCurrency(c.symbol);
                                                                setIsCurrencyOpen(false);
                                                            }}
                                                            className={clsx(
                                                                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                                                                currency === c.symbol
                                                                    ? "bg-zinc-900 text-white"
                                                                    : "text-zinc-600 hover:bg-zinc-50"
                                                            )}
                                                        >
                                                            <span>{c.label}</span>
                                                            <span className="opacity-50">{c.symbol}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-6 border-t border-zinc-50 space-y-4">
                                <button
                                    onClick={handleReset}
                                    className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-[24px] bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all active:scale-95 group"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Réinitialiser tout</span>
                                </button>
                                <p className="text-[9px] text-zinc-400 text-center px-4 leading-relaxed font-medium">
                                    Toutes vos recettes et dépenses seront définitivement supprimées. Cette action est irréversible.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
