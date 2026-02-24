'use client';

import { useState, useRef, useEffect } from 'react';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { KPISection } from '@/components/kpi/KPISection';
import { CashflowGraph } from '@/components/graph/CashflowGraph';
import { TransactionList } from '@/components/lists/TransactionList';
import { TimelineView } from '@/components/timeline/TimelineView';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Settings, Plus, LogIn, LogOut, User as UserIcon, Share2, Check, Layers, Trash2, Home, ChevronRight, Pencil, Undo2, Redo2, History, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useFinanceStore } from '@/store/useFinanceStore';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { AuthModal } from '@/components/auth/AuthModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { VersionHistoryModal } from '@/components/settings/VersionHistoryModal';
import { useTranslation } from '@/components/i18n/TranslationProvider';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import Image from 'next/image';

// --- Delete Planification Modal Component ---
const DeletePlanificationModal = ({ isOpen, onClose, onConfirm, planName }: any) => {
    const { dictionary } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl"
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-24 h-24 md:w-32 md:h-32 mx-auto relative mb-2">
                        <Image
                            src="/illustrations/mascot-expense-oneoff.png"
                            alt="Mascotte suppression"
                            fill
                            className="object-contain filter drop-shadow-xl"
                        />
                    </div>
                    <h2 className="text-xl font-black text-zinc-900">
                        Supprimer la planification ?
                    </h2>
                    <p className="text-sm text-zinc-500 font-medium">
                        Êtes-vous sûr de vouloir supprimer définitivement <strong>{planName}</strong> ? Cette action effacera tous les scénarios et transactions associés.
                    </p>
                    <div className="flex w-full space-x-3 pt-4 inline-flex">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                        >
                            {dictionary.common.cancel}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
// ------------------------------------------

export const EditableMenuItem = ({ item, isSelected, onSelect, onEdit, onDelete }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(item.name);

    if (isEditing) {
        return (
            <div className="w-full flex items-center justify-between px-2 py-2 rounded-xl bg-white text-zinc-900 border border-zinc-200">
                <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            if (editName.trim()) onEdit(item.id, editName.trim());
                            setIsEditing(false);
                        } else if (e.key === 'Escape') {
                            setIsEditing(false);
                            setEditName(item.name);
                        }
                    }}
                    onBlur={() => {
                        if (editName.trim()) onEdit(item.id, editName.trim());
                        setIsEditing(false);
                    }}
                    className="flex-1 bg-transparent text-sm font-bold focus:outline-none"
                />
            </div>
        );
    }

    return (
        <div className="relative group flex items-center w-full">
            <button
                onClick={() => onSelect(item.id)}
                className={clsx(
                    "flex-1 flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all text-left",
                    (onEdit || onDelete) ? "pr-14" : "pr-4",
                    isSelected
                        ? "bg-zinc-900 text-white"
                        : "bg-white text-zinc-600 hover:bg-zinc-50"
                )}
            >
                <div className="flex flex-col items-start truncate w-full">
                    <span className="truncate w-full" style={{ paddingRight: isSelected ? '16px' : '0' }}>{item.name}</span>
                    {item.subtitle && <span className="text-[8px] uppercase tracking-wider opacity-60 font-black mt-0.5">{item.subtitle}</span>}
                </div>
                {isSelected && <Check className="absolute right-4 w-4 h-4 text-emerald-400" />}
            </button>
            <div className="absolute right-2 flex items-center space-x-1 opacity-0 group-[.group:hover]:opacity-100 transition-opacity z-10 pointer-events-none group-[.group:hover]:pointer-events-auto">
                {onEdit && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-900 bg-white rounded-md hover:bg-zinc-100 shadow-sm border border-zinc-100"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(item.id);
                        }}
                        className="p-1 text-rose-500 hover:text-rose-600 bg-white rounded-md hover:bg-rose-50 shadow-sm border border-zinc-100"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default function DashboardPage() {
    const [showDetails, setShowDetails] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isShared, setIsShared] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const {
        initAuth,
        user,
        transactions,
        currency,
        textSize,
        resetSimulation,
        startingBalance,
        startingMonth,
        context,
        loadProject,
        planifications,
        currentPlanificationId,
        addPlanification,
        updatePlanification,
        setCurrentPlanification,
        deletePlanification,
        currentScenarioId,
        scenarios,
        showScenarioBadge,
        projectionMonths,
        addScenario,
        updateScenario,
        setCurrentScenario,
        deleteScenario,
        undo,
        redo,
        undoStack,
        redoStack
    } = useFinanceStore();

    const { dictionary, locale } = useTranslation();

    // Data load tracking
    const [isLoading, setIsLoading] = useState(true);
    const [isPlanificationMenuOpen, setIsPlanificationMenuOpen] = useState(false);
    const [deletingPlanificationId, setDeletingPlanificationId] = useState<string | null>(null);
    const [isAddingPlanification, setIsAddingPlanification] = useState(false);
    const [newPlanificationName, setNewPlanificationName] = useState('');

    const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);

    const [isScenarioMenuOpen, setIsScenarioMenuOpen] = useState(false);
    const [isAddingScenario, setIsAddingScenario] = useState(false);
    const [newScenarioName, setNewScenarioName] = useState('');

    const handleAddPlanification = async () => {
        if (!newPlanificationName.trim()) return;
        const id = await addPlanification(newPlanificationName);
        if (id) {
            setCurrentPlanification(id);
            setNewPlanificationName('');
            setIsAddingPlanification(false);
            setIsPlanificationMenuOpen(false);
        }
    };

    const handleAddScenario = async () => {
        if (!newScenarioName.trim()) return;
        const id = await addScenario(newScenarioName);
        if (id) {
            setCurrentScenario(id);
            setNewScenarioName('');
            setIsAddingScenario(false);
            setIsScenarioMenuOpen(false);
        }
    };

    const months = Array.from({ length: projectionMonths }).map((_, i) => {
        const date = addMonths(parseISO(`${startingMonth}-01`), i);
        return format(date, 'yyyy-MM');
    });

    const currentPlanification = planifications.find(p => p.id === currentPlanificationId);
    const currentScenario = scenarios.find(s => s.id === currentScenarioId);
    const isScenarioVisible = showScenarioBadge && (user || scenarios.length > 0);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        initAuth();

        // Handle shared data from URL
        const sharedData = searchParams.get('data');
        if (sharedData) {
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(sharedData)));
                loadProject(decoded);
                // Clear the URL parameter after loading
                router.replace(`/${locale}/dashboard`);
            } catch (e) {
                console.error("Failed to load shared data", e);
            }
        }
    }, [initAuth, searchParams, loadProject, router]);

    // Redirect to mobile dashboard if viewed in portrait mode on a mobile device
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

            // Re-check on orientation change or resize
            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
        }
    }, [router]);

    // Keybindings pour Undo/Redo
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

    const handleShare = () => {
        const state = {
            transactions,
            startingBalance,
            startingMonth,
            currency,
            context,
            textSize,
            projectionMonths
        };
        const encoded = btoa(encodeURIComponent(JSON.stringify(state)));
        const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;

        navigator.clipboard.writeText(url).then(() => {
            setIsShared(true);
            setTimeout(() => setIsShared(false), 2000);
        });
    };

    const handleLogin = () => {
        setIsAuthModalOpen(true);
        setIsMenuOpen(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleReset = async () => {
        await resetSimulation();
        router.push(`/${locale}/assistant`);
    };

    const COLUMN_WIDTH = 96; // w-24
    const LABEL_WIDTH = 128; // w-32
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const TOTAL_WIDTH = LABEL_WIDTH + (projectionMonths * COLUMN_WIDTH);

    return (
        <div className={clsx(
            "min-h-screen bg-zinc-50/50 flex flex-col overflow-hidden relative font-sans transition-all duration-500 origin-top",
            textSize === 'small' && "scale-[0.98]",
            textSize === 'large' && "scale-[1.02]"
        )}>
            {/* Premium Header */}
            <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-white/80 backdrop-blur-xl z-50 border-b border-zinc-100 px-4 md:px-8 flex items-center justify-between">
                <div className="flex items-center space-x-3 md:space-x-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-900 rounded-xl md:rounded-2xl flex items-center justify-center shadow-premium">
                            <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white rounded-lg flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                        </div>
                        <span className="font-black italic text-lg md:text-xl tracking-tighter text-zinc-900 line-clamp-1">PLANIF.app</span>
                    </div>

                    <div className="flex items-center space-x-1 md:space-x-2">
                        {/* Planification Switcher (Breadcrumb Step 1) */}
                        <div className="relative">
                            <button
                                onClick={() => setIsPlanificationMenuOpen(!isPlanificationMenuOpen)}
                                className={clsx(
                                    "hidden md:flex items-center rounded-2xl px-4 py-2 border transition-all active:scale-95 space-x-3",
                                    isPlanificationMenuOpen ? "bg-zinc-100 border-zinc-200" : "bg-zinc-50 border-zinc-100 hover:bg-zinc-100 hover:border-zinc-200"
                                )}
                            >
                                <Home className="w-4 h-4 text-zinc-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 truncate max-w-[120px]">
                                    {currentPlanification?.name || 'Home'}
                                </span>
                            </button>

                            <AnimatePresence>
                                {isPlanificationMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute left-0 mt-2 w-72 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-50 p-2 z-[60]"
                                    >
                                        <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
                                            {planifications.map((p) => (
                                                <EditableMenuItem
                                                    key={p.id}
                                                    item={p}
                                                    isSelected={currentPlanificationId === p.id}
                                                    onSelect={(id: string) => {
                                                        setCurrentPlanification(id);
                                                        setIsPlanificationMenuOpen(false);
                                                    }}
                                                    onEdit={user ? async (id: string, newName: string) => {
                                                        await updatePlanification(id, { name: newName });
                                                    } : undefined}
                                                    onDelete={user && planifications.length > 1 ? async (id: string) => {
                                                        setDeletingPlanificationId(id);
                                                    } : undefined}
                                                />
                                            ))}

                                            {user ? (
                                                <div className="pt-2 mt-2 border-t border-zinc-50">
                                                    {!isAddingPlanification ? (
                                                        <button
                                                            onClick={() => setIsAddingPlanification(true)}
                                                            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors text-sm font-bold"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            <span>{dictionary.common.add} Planification</span>
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center space-x-2 p-1">
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={newPlanificationName}
                                                                onChange={(e) => setNewPlanificationName(e.target.value)}
                                                                placeholder="Nom..."
                                                                className="flex-1 h-10 px-3 bg-zinc-50 border border-zinc-100 rounded-lg text-sm font-bold focus:outline-none focus:border-zinc-900 transition-all"
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddPlanification()}
                                                            />
                                                            <button
                                                                onClick={handleAddPlanification}
                                                                className="w-10 h-10 bg-zinc-900 text-white rounded-lg flex items-center justify-center shadow-premium active:scale-95"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="pt-2 mt-2 border-t border-zinc-50 p-2 text-center">
                                                    <p className="text-xs text-zinc-500 font-medium mb-3">
                                                        {dictionary.auth.planificationPrompt}
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            setIsPlanificationMenuOpen(false);
                                                            handleLogin();
                                                        }}
                                                        className="w-full py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold shadow-premium active:scale-95 transition-all"
                                                    >
                                                        {dictionary.auth.login}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {isScenarioVisible && (
                            <>
                                <ChevronRight className="hidden md:block w-4 h-4 text-zinc-300" />

                                {/* Scenario Switcher (Breadcrumb Step 2) */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsScenarioMenuOpen(!isScenarioMenuOpen)}
                                        className={clsx(
                                            "hidden md:flex items-center rounded-2xl px-4 py-2 border transition-all active:scale-95 space-x-3",
                                            isScenarioMenuOpen ? "bg-zinc-100 border-zinc-200" : "bg-zinc-50 border-zinc-100 hover:bg-zinc-100 hover:border-zinc-200"
                                        )}
                                    >
                                        <Layers className="w-4 h-4 text-zinc-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 truncate max-w-[120px]">
                                            {currentScenario?.name || 'Principal'}
                                        </span>
                                    </button>

                                    <AnimatePresence>
                                        {isScenarioMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute left-0 mt-2 w-72 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-50 p-2 z-[60]"
                                            >
                                                <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
                                                    <EditableMenuItem
                                                        item={{ id: null, name: 'Principal', subtitle: 'Scénario de base' }}
                                                        isSelected={currentScenarioId === null}
                                                        onSelect={() => {
                                                            setCurrentScenario(null);
                                                            setIsScenarioMenuOpen(false);
                                                        }}
                                                    />

                                                    {scenarios.map((s) => (
                                                        <EditableMenuItem
                                                            key={s.id}
                                                            item={s}
                                                            isSelected={currentScenarioId === s.id}
                                                            onSelect={(id: string) => {
                                                                setCurrentScenario(id);
                                                                setIsScenarioMenuOpen(false);
                                                            }}
                                                            onEdit={user ? async (id: string, newName: string) => {
                                                                await updateScenario(id, { name: newName });
                                                            } : undefined}
                                                            onDelete={user ? (id: string) => deleteScenario(id) : undefined}
                                                        />
                                                    ))}

                                                    {user ? (
                                                        <div className="pt-2 mt-2 border-t border-zinc-50">
                                                            {!isAddingScenario ? (
                                                                <button
                                                                    onClick={() => setIsAddingScenario(true)}
                                                                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors text-sm font-bold"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    <span>{dictionary.common.add} Scénario</span>
                                                                </button>
                                                            ) : (
                                                                <div className="flex items-center space-x-2 p-1">
                                                                    <input
                                                                        autoFocus
                                                                        type="text"
                                                                        value={newScenarioName}
                                                                        onChange={(e) => setNewScenarioName(e.target.value)}
                                                                        placeholder="Nom..."
                                                                        className="flex-1 h-10 px-3 bg-zinc-50 border border-zinc-100 rounded-lg text-sm font-bold focus:outline-none focus:border-zinc-900 transition-all"
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddScenario()}
                                                                    />
                                                                    <button
                                                                        onClick={handleAddScenario}
                                                                        className="w-10 h-10 bg-zinc-900 text-white rounded-lg flex items-center justify-center shadow-premium active:scale-95"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="pt-2 mt-2 border-t border-zinc-50 p-2 text-center">
                                                            <p className="text-xs text-zinc-500 font-medium mb-3">
                                                                {dictionary.auth.scenarioPrompt}
                                                            </p>
                                                            <button
                                                                onClick={() => {
                                                                    setIsScenarioMenuOpen(false);
                                                                    handleLogin();
                                                                }}
                                                                className="w-full py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold shadow-premium active:scale-95 transition-all"
                                                            >
                                                                {dictionary.auth.login}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="hidden md:block h-4 w-px bg-zinc-200" />

                    <div className="flex items-center space-x-3">
                    </div>
                </div>

                <div className="flex items-center space-x-2 md:space-x-4">
                    {/* Undo / Redo controls */}
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

                    {/* Share Button */}
                    <button
                        onClick={handleShare}
                        className={clsx(
                            "w-10 h-10 md:w-12 md:h-12 bg-white border border-zinc-100 rounded-xl md:rounded-2xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95 group relative",
                            isShared && "border-emerald-500 bg-emerald-50"
                        )}
                        title="Partager mon dashboard"
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
                                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-900 text-white text-[9px] font-black italic uppercase tracking-widest rounded-lg pointer-events-none"
                                >
                                    Copié !
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>

                    {/* Settings Gear Button */}
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white border border-zinc-100 rounded-xl md:rounded-2xl flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95 group"
                    >
                        <Settings className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                    </button>

                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    <div className="h-4 md:h-6 w-px bg-zinc-100" />

                    {/* Profile Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="px-3 py-1.5 md:px-4 md:py-2 bg-zinc-900 text-white rounded-xl md:rounded-2xl flex items-center space-x-2 md:space-x-3 shadow-premium hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all active:scale-95"
                        >
                            <span className="font-black italic text-xs md:text-sm tracking-tight">{user?.email?.split('@')[0] || dictionary.auth.guestMode}</span>
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-white/20 flex items-center justify-center">
                                <ChevronDown className={clsx("w-2.5 h-2.5 md:w-3 md:h-3 transition-transform", isMenuOpen && "rotate-180")} />
                            </div>
                        </button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-56 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-50 p-3 z-[60]"
                                >
                                    <button
                                        onClick={() => { setIsResetModalOpen(true); setIsMenuOpen(false); }}
                                        className="w-full flex items-center space-x-3 p-4 rounded-2xl text-zinc-600 hover:bg-zinc-50 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span className="font-black italic text-sm">{dictionary.common.delete} Data</span>
                                    </button>
                                    <div className="h-px bg-zinc-50 my-2" />
                                    {user ? (
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center space-x-3 p-4 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="font-black italic text-sm">{dictionary.auth.logout}</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleLogin}
                                            className="w-full flex items-center space-x-3 p-4 rounded-2xl text-zinc-900 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                                        >
                                            <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center">
                                                <Plus className="w-2 h-2 text-white" />
                                            </div>
                                            <span className="font-black italic text-sm">{dictionary.auth.login}</span>
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
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
                            {/* Unique Months Axis shared by Graph and Timeline */}
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

                            {/* Light Toggle Button on the left */}
                            <div className="flex justify-start">
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="flex items-center space-x-2 px-5 md:px-6 py-3 md:py-2.5 bg-white rounded-2xl shadow-soft border border-zinc-100 group transition-all active:scale-95 hover:bg-zinc-50"
                                >
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                        {showDetails ? (typeof window !== 'undefined' && window.innerWidth < 768 ? "Hide" : "Hide details") : dictionary.dashboard.title}
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
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
            <VersionHistoryModal
                isOpen={isVersionHistoryModalOpen}
                onClose={() => setIsVersionHistoryModalOpen(false)}
            />
            {/* Modal for Deleting Planification */}
            <AnimatePresence>
                {deletingPlanificationId && (
                    <DeletePlanificationModal
                        isOpen={!!deletingPlanificationId}
                        onClose={() => setDeletingPlanificationId(null)}
                        planName={planifications.find(p => p.id === deletingPlanificationId)?.name || 'cette planification'}
                        onConfirm={async () => {
                            await deletePlanification(deletingPlanificationId);
                            if (currentPlanificationId === deletingPlanificationId) {
                                setIsPlanificationMenuOpen(false);
                            }
                            setDeletingPlanificationId(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
