'use client';

import { useState, useRef, useEffect } from 'react';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { KPISection } from '@/components/kpi/KPISection';
import { CashflowGraph } from '@/components/graph/CashflowGraph';
import { Pill, RecurringPill } from '@/components/timeline/TimelineView';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Settings, Share2, Check, Download, Upload, Undo2, Redo2, Pencil, X, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { useTranslation } from '@/components/i18n/TranslationProvider';
import Image from 'next/image';

const COLUMN_WIDTH = 96;
const LABEL_WIDTH = 128;

export default function DashboardPage() {
    const [showDetails, setShowDetails] = useState(false);
    const [dragTargetMonth, setDragTargetMonth] = useState<string | null>(null);
    const [isAboutOpen, setIsAboutOpen] = useState(false);

    const ILLUSTRATIONS = [
        '/illustrations/mascot-onboarding-start',
        '/illustrations/mascot-graph-overview',
        '/illustrations/mascot-success-ready',
        '/illustrations/mascot-balance-day',
        '/illustrations/mascot-graph-categories',
    ];
    const randomIllustration = ILLUSTRATIONS[Math.floor(Math.random() * ILLUSTRATIONS.length)];
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isShared, setIsShared] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const {
        transactions,
        currency,
        resetSimulation,
        startingBalance,
        startingMonth,
        context,
        loadProject,
        projectionMonths,
        undo,
        redo,
        undoStack,
        redoStack,
        title,
        setTitle,
        addTransaction,
    } = useFinanceStore();

    const { dictionary, locale } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();

    const months = Array.from({ length: projectionMonths }).map((_, i) => {
        const date = addMonths(parseISO(`${startingMonth}-01`), i);
        return format(date, 'yyyy-MM');
    });

    const TOTAL_WIDTH = LABEL_WIDTH + (projectionMonths * COLUMN_WIDTH);

    useEffect(() => {
        const sharedData = searchParams.get('data');
        if (sharedData) {
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(sharedData)));
                loadProject(decoded);
            } catch (e) {
                console.error('Failed to load shared data', e);
            }
        }
    }, [searchParams, loadProject]);

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    const handleShare = async () => {
        const state = {
            transactions,
            startingBalance,
            startingMonth,
            context,
            currency,
            projectionMonths,
            title,
        };
        const encoded = btoa(encodeURIComponent(JSON.stringify(state)));
        const url = `${window.location.origin}/${locale}/dashboard?data=${encoded}`;
        await navigator.clipboard.writeText(url);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2500);
    };

    const handleSaveJSON = () => {
        const state = { transactions, startingBalance, startingMonth, context, currency, projectionMonths, title };
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                loadProject(data);
            } catch {
                alert('Fichier invalide.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleReset = async () => {
        await resetSimulation();
        router.push(`/${locale}/onboarding`);
    };

    const handleTitleSave = () => {
        if (titleDraft.trim()) setTitle(titleDraft.trim());
        setIsEditingTitle(false);
    };

    const handleAddOneOff = async (month: string) => {
        await addTransaction({
            label: '',
            amount: 0,
            direction: 'expense',
            categoryId: 'cat-other',
            recurrence: 'none',
            month,
        });
    };

    const handleAddMonthly = async () => {
        await addTransaction({
            label: '',
            amount: 0,
            direction: 'expense',
            categoryId: 'cat-other',
            recurrence: 'monthly',
        });
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-100 shadow-soft">
                <div className="px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3">
                    {/* Logo + Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.push(`/${locale}`)}
                            className="flex items-center gap-1.5 shrink-0 group active:scale-95 transition-transform"
                        >
                            <Image
                                src="/images/favicon.png"
                                alt="Planif.app"
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-xl shadow-premium select-none"
                            />
                            <span className="font-black italic text-base tracking-tighter text-zinc-900 hidden sm:block">
                                PLANIF<span className="text-zinc-400 font-bold not-italic">.app</span>
                            </span>
                        </button>
                        <div className="w-px h-5 bg-zinc-200 shrink-0 hidden sm:block" />
                    </div>

                    {/* Title */}
                    <div className="flex items-center gap-2 min-w-0">
                        {isEditingTitle ? (
                            <input
                                ref={titleInputRef}
                                value={titleDraft}
                                onChange={e => setTitleDraft(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setIsEditingTitle(false); }}
                                className="font-black italic tracking-tighter text-xl md:text-2xl text-zinc-900 bg-transparent border-b-2 border-zinc-900 outline-none p-0 min-w-0 w-48 md:w-64"
                            />
                        ) : (
                            <button
                                onClick={() => { setTitleDraft(title); setIsEditingTitle(true); }}
                                className="flex items-center gap-1.5 group"
                            >
                                <span className="font-black italic tracking-tighter text-xl md:text-2xl text-zinc-900 truncate max-w-[160px] md:max-w-xs">{title}</span>
                                <Pencil className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-600 transition-colors shrink-0" />
                            </button>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => undo()} disabled={undoStack.length === 0}
                            className="w-9 h-9 bg-white border border-zinc-100 rounded-xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95 disabled:opacity-30"
                        ><Undo2 className="w-4 h-4 text-zinc-500" /></button>
                        <button onClick={() => redo()} disabled={redoStack.length === 0}
                            className="w-9 h-9 bg-white border border-zinc-100 rounded-xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95 disabled:opacity-30"
                        ><Redo2 className="w-4 h-4 text-zinc-500" /></button>
                        <button onClick={handleSaveJSON}
                            className="w-9 h-9 md:w-10 md:h-10 bg-white border border-zinc-100 rounded-xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95"
                        ><Download className="w-4 h-4 text-zinc-400" /></button>
                        <button onClick={() => fileInputRef.current?.click()}
                            className="w-9 h-9 md:w-10 md:h-10 bg-white border border-zinc-100 rounded-xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95"
                        ><Upload className="w-4 h-4 text-zinc-400" /></button>
                        <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoadJSON} className="hidden" />
                        <button onClick={handleShare}
                            className={clsx("w-9 h-9 md:w-10 md:h-10 bg-white border border-zinc-100 rounded-xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95", isShared && "border-emerald-500 bg-emerald-50")}
                        >{isShared ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-zinc-400" />}</button>
                        <button onClick={() => setIsSettingsModalOpen(true)}
                            className="w-9 h-9 md:w-10 md:h-10 bg-white border border-zinc-100 rounded-xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95"
                        ><Settings className="w-4 h-4 text-zinc-400" /></button>
                    </div>
                </div>
            </header>

            {/* Main content — pb-[80px] leaves room for fixed bottom button */}
            <main className="flex-1 overflow-y-auto px-4 md:px-6 pt-20 md:pt-24 pb-[80px] no-scrollbar">
                <KPISection />

                {/* Horizontal scroll area: month axis + graph + extras */}
                <div className="overflow-x-auto no-scrollbar -mx-4 md:-mx-6 px-4 md:px-6 mt-6">
                    <div style={{ minWidth: `${TOTAL_WIDTH}px` }}>

                        {/* Month axis with alternating backgrounds */}
                        <div className="flex border-b border-zinc-200 pb-3 pt-2">
                            <div className="w-32 flex-shrink-0 sticky left-0 bg-zinc-50/90 backdrop-blur-md z-20 px-4 font-black text-[10px] uppercase tracking-widest text-zinc-400 flex items-end justify-start">
                                Mois
                            </div>
                            <div className="flex flex-1">
                                {months.map((m, i) => (
                                    <div key={m} className={clsx("flex-1 min-w-[96px] text-center font-black italic text-xs text-zinc-400 capitalize py-1", i % 2 === 0 ? "bg-white" : "bg-[#f9f9fb]")}>
                                        {format(parseISO(`${m}-01`), 'MMM yy', { locale: fr })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Graph — alternating column stripes propagate behind the chart */}
                        <div className="relative">
                            <div className="absolute inset-0 flex pointer-events-none" style={{ paddingLeft: LABEL_WIDTH }}>
                                {months.map((m, i) => (
                                    <div key={m} className={clsx("flex-1 h-full", i % 2 === 0 ? "bg-white" : "bg-[#f9f9fb]")} />
                                ))}
                            </div>
                            <CashflowGraph
                                height={showDetails ? 240 : (typeof window !== 'undefined' && window.innerWidth < 768 ? 320 : 480)}
                                leftPadding={LABEL_WIDTH}
                            />
                        </div>

                        {/* Extras pills — directly below graph, column-aligned, same alternating bg */}
                        <AnimatePresence>
                            {showDetails && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-zinc-100"
                                >
                                    <div className="flex">
                                        <div className="w-32 flex-shrink-0 sticky left-0 bg-gradient-to-r from-zinc-50 via-zinc-50 to-transparent z-10 px-4 pt-2 flex items-start">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">EXTRAS</span>
                                        </div>
                                        <div className="flex flex-1">
                                            {months.map((m, i) => {
                                                const oneOffs = transactions.filter(t => t.month === m && t.recurrence === 'none');
                                                return (
                                                    <div
                                                        key={m}
                                                        className={clsx(
                                                            "flex-1 min-w-[96px] flex flex-col items-center py-2 gap-1.5 border-l border-zinc-100 border-dashed transition-colors",
                                                            dragTargetMonth === m
                                                                ? "bg-blue-50 ring-2 ring-inset ring-blue-300"
                                                                : i % 2 === 0 ? "bg-white" : "bg-[#f9f9fb]"
                                                        )}
                                                    >
                                                        {oneOffs.map(t => (
                                                            <Pill
                                                                key={t.id}
                                                                transaction={t}
                                                                color={t.direction === 'income' ? 'emerald' : 'rose'}
                                                                months={months}
                                                                dictionary={dictionary}
                                                                onTargetMonthChange={setDragTargetMonth}
                                                            />
                                                        ))}
                                                        <button
                                                            onClick={() => handleAddOneOff(m)}
                                                            className="w-14 h-8 rounded-lg border-dashed border-[1.5px] border-zinc-200 flex items-center justify-center text-zinc-300 hover:text-zinc-500 hover:bg-zinc-50 transition-colors"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* CHAQUE MOIS — strip pleine largeur, hors scroll horizontal */}
                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="overflow-x-auto no-scrollbar flex items-center gap-2 py-3 px-4 border-t border-zinc-100 bg-white -mx-4 md:-mx-6 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] mt-0">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 shrink-0 mr-2">CHAQUE MOIS</span>
                                {transactions.filter(t => t.recurrence !== 'none').map(tx => (
                                    <RecurringPill key={tx.id} transaction={tx} dictionary={dictionary} />
                                ))}
                                <button
                                    onClick={handleAddMonthly}
                                    className="h-9 px-3 rounded-lg border-2 border-dashed border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all flex items-center justify-center shrink-0"
                                >
                                    <Plus className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Bouton MASQUER / Éditer — fixé tout en bas */}
            <div
                className={clsx(
                    "fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 cursor-pointer flex items-center justify-center z-40 transition-all",
                    showDetails ? "h-10 shadow-none" : "h-[72px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[24px]"
                )}
                onClick={() => setShowDetails(!showDetails)}
            >
                {showDetails ? (
                    <div className="flex items-center gap-1.5 text-zinc-400">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Masquer</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-1 bg-zinc-200 rounded-full" />
                        <div className="flex items-center gap-2 text-zinc-900">
                            <span className="font-black italic tracking-tighter text-base md:text-lg">Éditer Entrées et Sorties</span>
                            <ChevronRight className="w-4 h-4 -rotate-90" />
                        </div>
                    </div>
                )}
            </div>

            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {isResetModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 md:p-8 text-center"
                        >
                            <div className="w-24 h-24 mx-auto relative mb-6">
                                <Image src="/illustrations/mascot-expense-recurring.png" alt="Réinitialisation" fill className="object-contain" />
                            </div>
                            <h3 className="text-xl font-black italic tracking-tighter text-zinc-900 mb-2">Effacer les données ?</h3>
                            <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-8">Cette action est irréversible.</p>
                            <div className="space-y-3">
                                <button onClick={handleReset} className="w-full py-4 bg-rose-500 text-white rounded-[20px] font-black italic shadow-premium active:scale-95 transition-all">
                                    {dictionary.common.delete}
                                </button>
                                <button onClick={() => setIsResetModalOpen(false)} className="w-full py-3 bg-zinc-50 text-zinc-400 rounded-[20px] font-black italic active:scale-95 transition-all text-xs uppercase tracking-widest">
                                    {dictionary.common.cancel}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

            {/* About / Info modal */}
            <AnimatePresence>
                {isAboutOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8"
                        onClick={() => setIsAboutOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 24 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 16 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden"
                        >
                            {/* Illustration */}
                            <div className="relative h-52 bg-zinc-50 flex items-center justify-center overflow-hidden">
                                <Image
                                    src={`${randomIllustration}.png`}
                                    alt="PLANIF.app"
                                    fill
                                    className="object-contain p-6"
                                />
                            </div>

                            {/* Content */}
                            <div className="px-7 pt-5 pb-7 space-y-4">
                                <div>
                                    <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900 leading-tight">
                                        PLANIF<span className="text-zinc-400 font-bold not-italic">.app</span>
                                    </h2>
                                    <p className="text-sm font-medium text-zinc-500 mt-2 leading-relaxed">
                                        Visualise ton solde bancaire mois par mois, anticipe tes entrées et sorties d'argent, et prends le contrôle de ta trésorerie — sans compte, sans données stockées, sans prise de tête.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-2xl">
                                    <span className="text-lg">🔓</span>
                                    <p className="text-xs font-black text-emerald-700 uppercase tracking-wide">Outil gratuit et sans inscription</p>
                                </div>

                                <p className="text-xs font-medium text-zinc-400 leading-relaxed">
                                    Tu trouves ça utile ? Partage le lien autour de toi — à quelqu'un qui gère un budget, une boîte, un projet.
                                </p>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.origin + `/${locale}/onboarding`);
                                            setIsAboutOpen(false);
                                        }}
                                        className="flex-1 py-3 bg-zinc-900 text-white rounded-[18px] font-black italic text-sm active:scale-95 transition-transform shadow-premium"
                                    >
                                        Copier le lien
                                    </button>
                                    <button
                                        onClick={() => setIsAboutOpen(false)}
                                        className="py-3 px-4 bg-zinc-100 text-zinc-500 rounded-[18px] font-black italic text-sm active:scale-95 transition-transform"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
