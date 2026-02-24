'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, ChevronDown, Trash2, Type, Layers, Plus, EyeOff, Eye, Check } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { clsx } from 'clsx';
import { useState } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const {
        currency,
        setCurrency,
        textSize,
        setTextSize,
        resetSimulation,
        scenarios,
        currentScenarioId,
        addScenario,
        setCurrentScenario,
        deleteScenario,
        showScenarioBadge,
        setShowScenarioBadge,
        projectionMonths,
        setProjectionMonths,
        user
    } = useFinanceStore();
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [isTextSizeOpen, setIsTextSizeOpen] = useState(false);
    const [isProjectionOpen, setIsProjectionOpen] = useState(false);

    const currencies = [
        { label: 'Euro', symbol: '€', code: 'EUR' },
        { label: 'Dollar', symbol: '$', code: 'USD' },
        { label: 'Livre', symbol: '£', code: 'GBP' },
        { label: 'Franc', symbol: 'CHF', code: 'CHF' },
        { label: 'CAD', symbol: 'CA$', code: 'CAD' }
    ];

    const textSizes = [
        { id: 'small', label: 'Petit', class: 'text-[11px]' },
        { id: 'medium', label: 'Moyen', class: 'text-sm' },
        { id: 'large', label: 'Grand', class: 'text-lg' }
    ] as const;

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
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-premium">
                                    <Settings className="w-5 h-5 text-white" />
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

                                {/* Text Size Dropdown */}
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 px-2">
                                        <Type className="w-4 h-4 text-zinc-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Taille du texte</span>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsTextSizeOpen(!isTextSizeOpen)}
                                            className="w-full h-12 px-4 bg-zinc-50 border-2 border-transparent hover:border-zinc-100 rounded-2xl flex items-center justify-between font-bold text-zinc-900 transition-all group"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span>{textSizes.find(s => s.id === textSize)?.label || 'Moyen'}</span>
                                            </div>
                                            <ChevronDown className={clsx("w-4 h-4 text-zinc-300 transition-transform duration-500", isTextSizeOpen && "rotate-180")} />
                                        </button>
                                        <AnimatePresence>
                                            {isTextSizeOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-zinc-50 p-2 z-50 overflow-hidden"
                                                >
                                                    <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                        {textSizes.map((size) => (
                                                            <button
                                                                key={size.id}
                                                                onClick={() => {
                                                                    setTextSize(size.id);
                                                                    setIsTextSizeOpen(false);
                                                                }}
                                                                className={clsx(
                                                                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                                                                    textSize === size.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
                                                                )}
                                                            >
                                                                <span>{size.label}</span>
                                                                <span className={clsx("opacity-50", size.class)}>A</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Projection Period Dropdown */}
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 px-2">
                                        <Eye className="w-4 h-4 text-zinc-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Horizon cible</span>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsProjectionOpen(!isProjectionOpen)}
                                            className="w-full h-12 px-4 bg-zinc-50 border-2 border-transparent hover:border-zinc-100 rounded-2xl flex items-center justify-between font-bold text-zinc-900 transition-all group"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span>{projectionMonths} mois</span>
                                            </div>
                                            <ChevronDown className={clsx("w-4 h-4 text-zinc-300 transition-transform duration-500", isProjectionOpen && "rotate-180")} />
                                        </button>
                                        <AnimatePresence>
                                            {isProjectionOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-zinc-50 p-2 z-50 overflow-hidden"
                                                >
                                                    <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                        {[12, 18, 24].map((months) => (
                                                            <button
                                                                key={months}
                                                                onClick={() => {
                                                                    setProjectionMonths(months);
                                                                    setIsProjectionOpen(false);
                                                                }}
                                                                className={clsx(
                                                                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                                                                    projectionMonths === months ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
                                                                )}
                                                            >
                                                                <span>{months} mois</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Scenarios Options */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Layers className="w-4 h-4 text-zinc-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scénarios</span>
                                </div>

                                <div className="space-y-2">
                                    {/* Show Scenario Badge toggle */}
                                    <button
                                        onClick={() => setShowScenarioBadge(!showScenarioBadge)}
                                        className="w-full flex items-center justify-between px-5 py-4 rounded-3xl bg-zinc-900/5 hover:bg-zinc-900/10 transition-all border border-transparent active:scale-[0.98]"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={clsx(
                                                "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                                                showScenarioBadge ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400"
                                            )}>
                                                {showScenarioBadge ? (
                                                    <Eye className="w-4 h-4" />
                                                ) : (
                                                    <EyeOff className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 leading-none mb-1">
                                                    Scénarios dans le header
                                                </span>
                                                <span className="text-[10px] text-zinc-400 font-medium">
                                                    {showScenarioBadge ? "Affichés dans le header" : "Masqués dans le header"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={clsx(
                                            "w-10 h-6 rounded-full transition-all flex items-center px-1",
                                            showScenarioBadge ? "bg-zinc-900" : "bg-zinc-200"
                                        )}>
                                            <div className={clsx(
                                                "w-4 h-4 bg-white rounded-full shadow-sm transition-all transform",
                                                showScenarioBadge ? "translate-x-4" : "translate-x-0"
                                            )} />
                                        </div>
                                    </button>
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
