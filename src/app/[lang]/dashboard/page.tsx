'use client';

import { useState, useRef, useEffect } from 'react';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { KPISection } from '@/components/kpi/KPISection';
import { CashflowGraph } from '@/components/graph/CashflowGraph';
import { TransactionList } from '@/components/lists/TransactionList';
import { TimelineView } from '@/components/timeline/TimelineView';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings, Share2, Check, Download, Upload, Undo2, Redo2, Pencil, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { useTranslation } from '@/components/i18n/TranslationProvider';
import Image from 'next/image';

export default function DashboardPage() {
    const [showDetails, setShowDetails] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isShared, setIsShared] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const {
        transactions,
        currency,
        textSize,
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
    } = useFinanceStore();

    const { dictionary, locale } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();

    const months = Array.from({ length: projectionMonths }).map((_, i) => {
        const date = addMonths(parseISO(`${startingMonth}-01`), i);
        return format(date, 'yyyy-MM');
    });

    useEffect(() => {
        const sharedData = searchParams.get('data');
        if (sharedData) {
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(sharedData)));
                loadProject(decoded);
                router.replace(`/${locale}/dashboard`);
            } catch (e) {
                console.error("Failed to load shared data", e);
            }
        }
    }, [searchParams, loadProject, router, locale]);

    // Redirect to mobile if needed
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkMobile = () => {
                const isMobile = window.innerWidth < 768;
                const isPortrait = window.innerHeight > window.innerWidth;
                if (isMobile && isPortrait) {
                    router.replace(`/${locale}/mobile`);
                }
            };
            checkMobile();
            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
        }
    }, [router, locale]);

    // Undo/Redo keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) {
                    e.preventDefault();
                    if (redoStack.length > 0) redo();
                } else {
                    e.preventDefault();
                    if (undoStack.length > 0) undo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, undoStack.length, redoStack.length]);

    // Focus title input when editing
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    const handleShare = () => {
        const state = {
            transactions,
            startingBalance,
            startingMonth,
            currency,
            context,
            textSize,
            projectionMonths,
            title,
        };
        const encoded = btoa(encodeURIComponent(JSON.stringify(state)));
        const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
        navigator.clipboard.writeText(url).then(() => {
            setIsShared(true);
            setTimeout(() => setIsShared(false), 2000);
        });
    };

    const handleSaveJSON = () => {
        const state = {
            transactions,
            startingBalance,
            startingMonth,
            currency,
            context,
            textSize,
            projectionMonths,
            title,
        };
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
                console.error('Invalid file');
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be re-loaded
        e.target.value = '';
    };

    const handleReset = async () => {
        await resetSimulation();
        router.push(`/${locale}/assistant`);
    };

    const handleTitleSave = () => {
        if (titleDraft.trim()) setTitle(titleDraft.trim());
        setIsEditingTitle(false);
    };

    const COLUMN_WIDTH = 96;
    const LABEL_WIDTH = 128;
    const TOTAL_WIDTH = LABEL_WIDTH + (projectionMonths * COLUMN_WIDTH);

    return (
        <div className={clsx(
            "min-h-screen bg-zinc-50/50 flex flex-col overflow-hidden relative font-sans transition-all duration-500 origin-top",
            textSize === 'small' && "scale-[0.98]",
            textSize === 'large' && "scale-[1.02]"
        )}>
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-white/80 backdrop-blur-xl z-50 border-b border-zinc-100 px-4 md:px-8 flex items-center justify-between">
                <div className="flex items-center space-x-3 md:space-x-6">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-900 rounded-xl md:rounded-2xl flex items-center justify-center shadow-premium">
                            <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white rounded-lg flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                        </div>
                        <span className="font-black italic text-lg md:text-xl tracking-tighter text-zinc-900 line-clamp-1">PLANIF.app</span>
                    </div>

                    <div className="hidden md:block h-4 w-px bg-zinc-200" />

                    {/* Editable Title */}
                    <div className="hidden md:flex items-center">
                        {isEditingTitle ? (
                            <div className="flex items-center space-x-2">
                                <input
                                    ref={titleInputRef}
                                    type="text"
                                    value={titleDraft}
                                    onChange={(e) => setTitleDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTitleSave();
                                        if (e.key === 'Escape') setIsEditingTitle(false);
                                    }}
                                    onBlur={handleTitleSave}
                                    className="h-9 px-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-900 transition-all w-48"
                                />
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); handleTitleSave(); }}
                                    className="p-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); setIsEditingTitle(false); }}
                                    className="p-1.5 rounded-lg bg-zinc-100 text-zinc-400 hover:bg-zinc-200 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setTitleDraft(title); setIsEditingTitle(true); }}
                                className="flex items-center space-x-2 px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 hover:border-zinc-200 transition-all group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 truncate max-w-[180px]">
                                    {title}
                                </span>
                                <Pencil className="w-3 h-3 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 md:space-x-4">
                    {/* Undo / Redo */}
                    <div className="hidden md:flex items-center bg-zinc-50 border border-zinc-100 rounded-2xl p-1 space-x-1 mr-2">
                        <button
                            onClick={() => undo()}
                            disabled={undoStack.length === 0}
                            className={clsx(
                                "p-2 rounded-xl transition-all flex items-center justify-center",
                                undoStack.length === 0
                                    ? "text-zinc-300 cursor-not-allowed"
                                    : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 active:scale-95"
                            )}
                            title="Annuler (Ctrl+Z)"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-zinc-200" />
                        <button
                            onClick={() => redo()}
                            disabled={redoStack.length === 0}
                            className={clsx(
                                "p-2 rounded-xl transition-all flex items-center justify-center",
                                redoStack.length === 0
                                    ? "text-zinc-300 cursor-not-allowed"
                                    : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 active:scale-95"
                            )}
                            title="Rétablir (Ctrl+Shift+Z)"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Save JSON */}
                    <button
                        onClick={handleSaveJSON}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white border border-zinc-100 rounded-xl md:rounded-2xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95 group"
                        title="Enregistrer (JSON)"
                    >
                        <Download className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                    </button>

                    {/* Load JSON */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white border border-zinc-100 rounded-xl md:rounded-2xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95 group"
                        title="Charger (JSON)"
                    >
                        <Upload className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleLoadJSON}
                        className="hidden"
                    />

                    {/* Share */}
                    <button
                        onClick={handleShare}
                        className={clsx(
                            "w-10 h-10 md:w-12 md:h-12 bg-white border border-zinc-100 rounded-xl md:rounded-2xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95 group relative",
                            isShared && "border-emerald-500 bg-emerald-50"
                        )}
                        title="Partager via URL"
                    >
                        {isShared ? (
                            <Check className="w-5 h-5 text-emerald-500" />
                        ) : (
                            <Share2 className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                        )}
                        <AnimatePresence>
                            {isShared && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-900 text-white text-[9px] font-black italic uppercase tracking-widest rounded-lg pointer-events-none whitespace-nowrap"
                                >
                                    Copié !
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>

                    {/* Settings */}
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white border border-zinc-100 rounded-xl md:rounded-2xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95 group"
                    >
                        <Settings className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                    </button>

                    {/* Reset menu */}
                    <button
                        onClick={() => setIsResetModalOpen(true)}
                        className="hidden md:flex px-3 py-1.5 md:px-4 md:py-2 bg-zinc-900 text-white rounded-xl md:rounded-2xl items-center space-x-2 md:space-x-3 shadow-premium hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all active:scale-95"
                    >
                        <span className="font-black italic text-xs md:text-sm tracking-tight">Reset</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-4 md:px-6 pt-24 md:pt-28 pb-32 no-scrollbar">
                <KPISection />

                <div className="space-y-8">
                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto no-scrollbar pb-8 -mx-4 md:-mx-6 px-4 md:px-6"
                    >
                        <div style={{ minWidth: `${TOTAL_WIDTH}px`, width: '100%' }} className="space-y-4">
                            {/* Month axis */}
                            <div className="flex border-b border-zinc-200 pb-3 pt-2">
                                <div className="w-32 flex-shrink-0 sticky left-0 bg-zinc-50/90 backdrop-blur-md z-20 px-4 font-black text-[10px] uppercase tracking-widest text-zinc-400 flex items-end justify-start">
                                    Mois
                                </div>
                                <div className="flex flex-1">
                                    {months.map((m) => (
                                        <div key={m} className="flex-1 min-w-[96px] text-center font-black italic text-xs text-zinc-400 capitalize">
                                            {format(parseISO(`${m}-01`), 'MMM yy', { locale: fr })}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <CashflowGraph
                                    height={showDetails ? 240 : (typeof window !== 'undefined' && window.innerWidth < 768 ? 320 : 480)}
                                    leftPadding={LABEL_WIDTH}
                                />
                            </div>

                            <div className="flex justify-start">
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="flex items-center space-x-2 px-5 md:px-6 py-3 md:py-2.5 bg-white rounded-2xl shadow-soft border border-zinc-100 group transition-all active:scale-95 hover:bg-zinc-50"
                                >
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                        {showDetails ? "Masquer" : dictionary.dashboard.title}
                                    </span>
                                    <motion.div
                                        animate={{ rotate: showDetails ? 180 : 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    >
                                        <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                                    </motion.div>
                                </button>
                            </div>

                            <AnimatePresence>
                                {showDetails && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <TimelineView />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>

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
                            className="bg-white w-full max-w-sm rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden p-6 md:p-8 text-center"
                        >
                            <div className="w-24 h-24 md:w-32 md:h-32 mx-auto relative mb-6">
                                <Image
                                    src="/illustrations/mascot-expense-recurring.png"
                                    alt="Mascotte réinitialisation"
                                    fill
                                    className="object-contain filter drop-shadow-xl"
                                />
                            </div>
                            <h3 className="text-lg md:text-xl font-black italic tracking-tighter text-zinc-900 mb-2">Reset data?</h3>
                            <p className="text-zinc-400 text-xs md:text-sm font-medium leading-relaxed mb-8">
                                Are you sure you want to reset all your simulations?
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={handleReset}
                                    className="w-full py-4 md:py-5 bg-rose-500 text-white rounded-[20px] md:rounded-[24px] font-black italic shadow-premium active:scale-95 transition-all text-sm md:text-base"
                                >
                                    {dictionary.common.delete}
                                </button>
                                <button
                                    onClick={() => setIsResetModalOpen(false)}
                                    className="w-full py-3 md:py-4 bg-zinc-50 text-zinc-400 rounded-[20px] md:rounded-[24px] font-black italic active:scale-95 transition-all text-[10px] md:text-xs uppercase tracking-widest"
                                >
                                    {dictionary.common.cancel}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </div>
    );
}
