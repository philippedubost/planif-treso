'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronRight, ChevronLeft, Plus, Settings, Share2, Check, ChevronDown, LogOut, HelpCircle, Edit2, AlertTriangle, Info, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { MobileTransactionEditor } from '@/components/lists/MobileTransactionEditor';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { Transaction } from '@/lib/financeEngine';
import { Trash2, Pencil, Home } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/components/i18n/TranslationProvider';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, planName, dictionary }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl z-10"
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
            <div className="absolute right-2 flex items-center space-x-1 opacity-100 transition-opacity z-10 pointer-events-auto">
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

function useWindowSize() {
    const [windowSize, setWindowSize] = useState<{
        width: number | undefined;
        height: number | undefined;
    }>({
        width: undefined,
        height: undefined,
    });
    useEffect(() => {
        if (typeof window !== 'undefined') {
            function handleResize() {
                setWindowSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
            }
            window.addEventListener("resize", handleResize);
            handleResize();
            return () => window.removeEventListener("resize", handleResize);
        }
    }, []);
    return windowSize;
}

export default function MobileDashboard7() {
    const {
        startingBalance,
        setStartingBalance,
        currency,
        transactions,
        planifications,
        currentPlanificationId,
        addPlanification,
        updatePlanification,
        setCurrentPlanification,
        deletePlanification,
        user,
        redoStack
    } = useFinanceStore();
    const projection = useProjection();
    const { width, height } = useWindowSize();
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        if (width && height && width > height) {
            const lang = params?.lang || 'fr';
            router.push(`/${lang}/dashboard`);
        }
    }, [width, height, router, params]);

    const [activeView, setActiveView] = useState<'graph' | 'matrix'>('graph');
    const [selectedGraphPoint, setSelectedGraphPoint] = useState<{ month: string, type: 'balance' | 'income' | 'expense', value: number, x: number, y: number } | null>(null);

    const [isEditingBalance, setIsEditingBalance] = useState(false);
    const [tempBalance, setTempBalance] = useState('');
    const mainRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [activeView]);

    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    const matrixTips = useMemo(() => [
        <>Pensez aux sorties souvent oubliées : <span className="font-medium opacity-80">Impôts, Assurances, Abonnements...</span></>,
        <>Les dépenses annuelles ou trimestrielles peuvent être <span className="font-medium opacity-80">mensualisées pour éviter les surprises.</span></>,
        <>Un extra prévu pour les vacances ou Noël ? <span className="font-medium opacity-80">Ajoutez-le dès aujourd'hui en ponctuel !</span></>,
        <>N'oubliez pas d'inclure votre <span className="font-medium opacity-80">épargne de précaution chaque mois.</span></>,
        <>Les petits plaisirs (café, resto) finissent par compter ! <span className="font-medium opacity-80">Prévoyez un budget "sorties" mensuel.</span></>,
        <>Anticipez vos frais de santé : <span className="font-medium opacity-80">Mutuelle, lunettes, soins médicaux divers...</span></>,
        <>Prévoyez une enveloppe pour les imprévus : <span className="font-medium opacity-80">Panne de voiture, remplacement d'électroménager...</span></>,
        <>Avez-vous pensé aux frais liés à la rentrée ? <span className="font-medium opacity-80">Fournitures, inscriptions scolaires ou sportives...</span></>,
        <>Vos abonnements numériques s'accumulent : <span className="font-medium opacity-80">Faites régulièrement le point (streaming, apps...).</span></>,
        <>L'entretien de la maison a un coût : <span className="font-medium opacity-80">Chauffage, petites réparations, jardinage...</span></>
    ], []);

    // Tips rotation
    useEffect(() => {
        if (activeView === 'matrix') {
            setCurrentTipIndex(Math.floor(Math.random() * matrixTips.length));
            const interval = setInterval(() => {
                setCurrentTipIndex((prev) => (prev + 1) % matrixTips.length);
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [activeView, matrixTips]);

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addMonth, setAddMonth] = useState<string | undefined>();
    const [addRecurrence, setAddRecurrence] = useState<'monthly' | 'none'>('none');

    // Drag tracking state
    const [draggingTxId, setDraggingTxId] = useState<string | null>(null);
    const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
    const [isHoveringTrash, setIsHoveringTrash] = useState(false);
    const [isHoveringDuplicate, setIsHoveringDuplicate] = useState(false);
    const [txToDelete, setTxToDelete] = useState<string | null>(null);

    // Header state
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPlanificationMenuOpen, setIsPlanificationMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isShared, setIsShared] = useState(false);

    const [isGraphTipDismissed, setIsGraphTipDismissed] = useState(false);
    const [isMatrixTipDismissed, setIsMatrixTipDismissed] = useState(false);

    const [isHeaderCompact, setIsHeaderCompact] = useState(false);
    const prevScrollY = useRef(0);

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        if (currentScrollY > prevScrollY.current && currentScrollY > 50) {
            setIsHeaderCompact(true);
        } else if (currentScrollY < prevScrollY.current) {
            setIsHeaderCompact(false);
        }
        prevScrollY.current = currentScrollY;
    };

    // Planification state
    const [deletingPlanificationId, setDeletingPlanificationId] = useState<string | null>(null);
    const [isAddingPlanification, setIsAddingPlanification] = useState(false);
    const [newPlanificationName, setNewPlanificationName] = useState('');

    const { dictionary } = useTranslation();

    const currentPlanification = useMemo(() => {
        return planifications.find(p => p.id === currentPlanificationId);
    }, [planifications, currentPlanificationId]);

    const handleLogin = () => {
        setIsAuthModalOpen(true);
    };

    const handleAddPlanification = async () => {
        if (!newPlanificationName.trim()) return;
        const id = await addPlanification(newPlanificationName.trim());
        if (id) {
            setCurrentPlanification(id);
            setNewPlanificationName('');
            setIsAddingPlanification(false);
            setIsPlanificationMenuOpen(false);
        }
    };

    const formatCurrency = (val: number, shrinkK = false) => {
        const sign = val < 0 ? '-' : '';
        const absVal = Math.abs(val);
        if (shrinkK && absVal >= 1000) {
            return `${sign}${Math.round(absVal / 1000)}K`;
        }
        const formatted = new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(absVal);
        return `${sign}${formatted}`;
    };

    const formatCurrencyDetailed = (val: number) => {
        const sign = val < 0 ? '-' : '';
        const absVal = Math.abs(val);
        const formatted = new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(absVal);
        return `${sign} ${formatted} ${currency}`;
    };

    const handleEdit = (tx: Transaction) => {
        setSelectedTransaction(tx);
        setIsAdding(false);
        setIsEditorOpen(true);
    };

    const handleAdd = (month?: string, recurrence: 'monthly' | 'none' = 'none') => {
        setSelectedTransaction(null);
        setAddMonth(month);
        setAddRecurrence(recurrence);
        setIsAdding(true);
        setIsEditorOpen(true);
    };

    // --- Drag n Drop Logic ---
    const { updateTransaction, deleteTransaction, addTransaction } = useFinanceStore();

    const handleDragStart = (txId: string) => {
        setDraggingTxId(txId);
    };

    const handleDragEnd = async (e: any, info: any, tx: Transaction) => {
        setDraggingTxId(null);
        setHoveredMonth(null);
        setIsHoveringTrash(false);
        setIsHoveringDuplicate(false);

        // Simple DOM element overlap detection since we are scrolling and standard HTML5 Dnd is tricky on mobile
        // Look for the element under the pointer
        const dropTarget = document.elementFromPoint(e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : 0), e.clientY || (e.changedTouches ? e.changedTouches[0].clientY : 0));

        if (!dropTarget) return;

        // Check if it's the trash
        const isTrash = dropTarget.closest('[data-droptarget="trash"]');
        if (isTrash) {
            setTxToDelete(tx.id);
            return;
        }

        // Check if it's the duplicate
        const isDuplicate = dropTarget.closest('[data-droptarget="duplicate"]');
        if (isDuplicate) {
            const { id, ...txWithoutId } = tx;
            await addTransaction(txWithoutId);
            return;
        }

        // Check if it's a month row
        const monthRow = dropTarget.closest('[data-droptarget="month"]');
        if (monthRow) {
            const newMonth = monthRow.getAttribute('data-month');
            if (newMonth && newMonth !== tx.month) {
                await updateTransaction(tx.id, { ...tx, month: newMonth });
            }
            return;
        }
    };

    // --- Graph Data Prep ---
    // Reduced rowHeight as requested for density
    const rowHeight = 45;
    const labelWidth = 60; // Slightly larger for bigger text if needed, but 'Fev.26' is short
    const graphWidth = width ? width - labelWidth - 32 : 250;
    const midX = graphWidth / 2;

    const maxFlow = useMemo(() => {
        let max = 1;
        projection.forEach(p => {
            if (p.income > max) max = p.income;
            if (p.expense > max) max = p.expense;
        });
        return max;
    }, [projection]);

    const maxBal = useMemo(() => {
        let min = startingBalance;
        let max = startingBalance;
        projection.forEach(p => {
            if (p.balance < min) min = p.balance;
            if (p.balance > max) max = p.balance;
        });

        // Ensure axis includes 0 if possible or just center around the actual range
        // If we center around 0 (midX = 0), then max magnitude
        return Math.max(Math.abs(min), Math.abs(max), 1);
    }, [projection, startingBalance]);

    // To place '25k | 32k' markers we need the actual boundaries used by the line graph
    // The graph draws from -maxBal to +maxBal centered at midX.
    const axisMin = -maxBal;
    const axisMax = maxBal;

    const { minBalPoint, maxBalPoint } = useMemo(() => {
        if (projection.length === 0) return { minBalPoint: null, maxBalPoint: null };
        return projection.reduce((acc, curr) => {
            return {
                minBalPoint: curr.balance < acc.minBalPoint.balance ? curr : acc.minBalPoint,
                maxBalPoint: curr.balance > acc.maxBalPoint.balance ? curr : acc.maxBalPoint
            };
        }, { minBalPoint: projection[0], maxBalPoint: projection[0] });
    }, [projection]);

    // Points for the continuous line graph (Balance evolution)
    const linePath = useMemo(() => {
        if (projection.length === 0) return '';

        let pts = [];
        let x0 = midX + ((startingBalance / maxBal) * (graphWidth / 2));
        pts.push({ x: x0, y: rowHeight / 2 });

        projection.forEach((p, i) => {
            const y = (i * rowHeight) + (rowHeight / 2);
            const x = midX + ((p.balance / maxBal) * (graphWidth / 2));
            pts.push({ x, y });
        });

        if (pts.length < 2) return `M ${pts[0]?.x},${pts[0]?.y}`;

        // Straight lines with rounded corners
        let path = `M ${pts[0].x},${pts[0].y}`;
        const radius = 20; // 20px border radius for smooth trend changes

        for (let i = 1; i < pts.length - 1; i++) {
            let p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
            let d1 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
            let d2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);

            // If distance is too small, just draw line to p1
            if (d1 === 0 || d2 === 0) {
                path += ` L ${p1.x},${p1.y}`;
                continue;
            }

            let r = Math.min(radius, d1 / 2, d2 / 2);

            let v1x = (p0.x - p1.x) / d1;
            let v1y = (p0.y - p1.y) / d1;

            let v2x = (p2.x - p1.x) / d2;
            let v2y = (p2.y - p1.y) / d2;

            let q1x = p1.x + v1x * r;
            let q1y = p1.y + v1y * r;

            let q2x = p1.x + v2x * r;
            let q2y = p1.y + v2y * r;

            path += ` L ${q1x},${q1y} Q ${p1.x},${p1.y} ${q2x},${q2y}`;
        }
        path += ` L ${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;

        return path;
    }, [projection, maxBal, midX, graphWidth, startingBalance, rowHeight]);

    // --- Matrix Data Prep ---
    const recurringTxs = useMemo(() => {
        return transactions.filter(t => t.recurrence !== 'none').sort((a, b) => b.amount - a.amount);
    }, [transactions]);

    const finalBalance12m = projection[projection.length - 1]?.balance || startingBalance;

    // Runway calculation
    const negativeMonthIndex = projection.findIndex(p => p.balance < 0);
    let runwayMessage = "";
    let runwayColor = "bg-emerald-50 text-emerald-800 border-emerald-200";

    if (negativeMonthIndex !== -1) {
        if (negativeMonthIndex === 0) {
            runwayMessage = `Alerte : ton compte passe sous zéro dès ${format(parseISO(`${projection[0].month}-01`), 'MMM yyyy', { locale: fr })}`;
            runwayColor = "bg-rose-50 text-rose-800 border-rose-200";
        } else if (negativeMonthIndex <= 3) {
            runwayMessage = `Attention : ton compte passe sous zéro en ${format(parseISO(`${projection[negativeMonthIndex].month}-01`), 'MMM yyyy', { locale: fr })}`;
            runwayColor = "bg-orange-50 text-orange-800 border-orange-200";
        } else {
            runwayMessage = `À ce rythme, ton compte passe sous zéro en ${format(parseISO(`${projection[negativeMonthIndex].month}-01`), 'MMM yyyy', { locale: fr })}`;
            runwayColor = "bg-amber-50 text-amber-800 border-amber-200";
        }
    } else {
        runwayMessage = "Tout va bien, ton compte reste positif sur cette période.";
    }

    const handleShare = () => {
        const url = `${window.location.origin}${window.location.pathname}`;
        navigator.clipboard.writeText(url).then(() => {
            setIsShared(true);
            setIsShareModalOpen(true);
            setTimeout(() => setIsShared(false), 2000);
        });
    };

    return (
        <div className="min-h-screen bg-zinc-50 font-sans flex flex-col relative overflow-hidden">
            {/* Header Sticky (Shared) */}
            <header className={clsx("fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-100 px-4 py-4 md:py-6 shadow-sm transition-transform duration-300", isHeaderCompact && "-translate-y-full")}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex-1 flex justify-start items-center space-x-2">
                        {/* View Toggle */}
                        <div className="flex bg-zinc-100 p-1 rounded-full shrink-0">
                            <button
                                onClick={() => setActiveView('graph')}
                                className={clsx(
                                    "px-4 py-1.5 rounded-full text-xs font-black tracking-wide transition-all",
                                    activeView === 'graph' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400"
                                )}>
                                {dictionary.mobile.graph}
                            </button>
                            <button
                                onClick={() => setActiveView('matrix')}
                                className={clsx(
                                    "px-4 py-1.5 rounded-full text-xs font-black tracking-wide transition-all",
                                    activeView === 'matrix' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400"
                                )}>
                                {dictionary.mobile.details}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-end items-center space-x-2">
                        {/* Profile Menu */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsMenuOpen(!isMenuOpen);
                                    if (!isMenuOpen) setIsPlanificationMenuOpen(false);
                                }}
                                className="px-3 py-1.5 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded-full flex items-center justify-center active:scale-95 h-10 transition-colors"
                            >
                                <ChevronDown className={clsx("w-4 h-4 transition-transform", isMenuOpen && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-50 p-2 z-[60]"
                                    >
                                        <div className="p-1">
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    handleShare();
                                                }}
                                                className="w-full flex items-center justify-between p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Share2 className="w-4 h-4 text-zinc-400" />
                                                    <span className="font-bold text-sm">Partager</span>
                                                </div>
                                                {isShared && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    setIsSettingsModalOpen(true);
                                                }}
                                                className="w-full flex items-center space-x-3 p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                                            >
                                                <Settings className="w-4 h-4 text-zinc-400" />
                                                <span className="font-bold text-sm">Paramètres</span>
                                            </button>
                                        </div>

                                        <div className="h-px bg-zinc-100 my-1 mx-2" />

                                        {user ? (
                                            <>
                                                <div className="px-3 py-2 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                                    {user.email || 'Mode invité'}
                                                </div>
                                                <div className="p-1">
                                                    <button
                                                        onClick={async () => {
                                                            await supabase.auth.signOut();
                                                        }}
                                                        className="w-full flex items-center space-x-3 p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        <span className="font-black italic text-sm">{dictionary.auth.logout}</span>
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-1">
                                                <button
                                                    onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                                                    className="w-full flex items-center space-x-3 p-2 rounded-xl text-zinc-900 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                                                        <Plus className="w-3 h-3 text-white" />
                                                    </div>
                                                    <div className="flex flex-col items-start pr-2">
                                                        <span className="font-black italic text-sm leading-tight">Sauvegarder</span>
                                                        <span className="text-[10px] font-medium text-zinc-500 leading-tight">mon profil</span>
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* App Logo / Planification Menu */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsPlanificationMenuOpen(!isPlanificationMenuOpen);
                                    if (!isPlanificationMenuOpen) setIsMenuOpen(false);
                                }}
                                className={clsx(
                                    "w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-premium active:scale-95 transition-all select-none",
                                    isPlanificationMenuOpen && "scale-95 ring-2 ring-zinc-900 ring-offset-2"
                                )}
                            >
                                <div className="w-5 h-5 border-2 border-white rounded-lg flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                            </button>

                            <AnimatePresence>
                                {isPlanificationMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-72 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-50 p-2 z-[60]"
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
                    </div>
                </div>

                {/* Interpretation Block & Runway Indicator */}
                {!isGraphTipDismissed && activeView === 'graph' && (
                    <div className="max-w-sm mx-auto mb-3">
                        <div className={clsx("rounded-xl p-2.5 border-2 flex items-center space-x-3 transition-colors", runwayColor)}>
                            <div className="shrink-0">
                                {negativeMonthIndex !== -1 && negativeMonthIndex === 0 ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                            </div>
                            <p className="text-[11px] font-bold leading-tight flex-1">
                                {runwayMessage}
                            </p>
                            <button
                                onClick={() => setIsGraphTipDismissed(true)}
                                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 active:scale-95 transition-all"
                                title="Fermer"
                            >
                                <X className="w-4 h-4 opacity-50" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Scorecards */}
                <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                    <div
                        className="text-center rounded-[14px] border-2 border-zinc-200 py-1.5 px-2 relative cursor-pointer active:scale-95 transition-transform bg-white/50"
                        onClick={() => {
                            if (!isEditingBalance) {
                                setIsEditingBalance(true);
                                setTempBalance(startingBalance.toString());
                            }
                        }}
                    >
                        <div className="flex items-center justify-center mb-0.5 space-x-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-900">{dictionary.kpi.todayBalance}</p>
                            <Edit2 className="w-2.5 h-2.5 text-zinc-400" />
                        </div>
                        {isEditingBalance ? (
                            <input
                                autoFocus
                                type="number"
                                value={tempBalance}
                                onChange={(e) => setTempBalance(e.target.value)}
                                onBlur={() => {
                                    setStartingBalance(parseFloat(tempBalance) || 0);
                                    setIsEditingBalance(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setStartingBalance(parseFloat(tempBalance) || 0);
                                        setIsEditingBalance(false);
                                    }
                                }}
                                className="w-full text-center text-sm font-black tracking-tighter text-zinc-900 tabular-nums bg-transparent border-none p-0 focus:ring-0"
                            />
                        ) : (
                            <p className="text-sm font-black tracking-tighter text-zinc-900 tabular-nums">{formatCurrency(startingBalance)}</p>
                        )}
                    </div>
                    <div className="text-center rounded-[14px] border-2 border-zinc-200 py-1.5 px-2 bg-white/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-900 mb-0.5">{dictionary.kpi['12mBalance']}</p>
                        <p className={clsx("text-sm font-black tracking-tighter tabular-nums", finalBalance12m < 0 ? "text-rose-500" : "text-zinc-900")}>
                            {formatCurrency(finalBalance12m)}
                        </p>
                    </div>
                </div>

                {/* Tip Card (Only in matrix view) */}
                {!isMatrixTipDismissed && activeView === 'matrix' && (
                    <div className="max-w-sm mx-auto mt-3">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTipIndex}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.3 }}
                                className="rounded-xl p-2.5 border-2 flex items-center space-x-3 transition-colors bg-amber-50 text-amber-800 border-amber-200"
                            >
                                <div className="shrink-0 flex items-center justify-center">
                                    <span className="text-sm">💡</span>
                                </div>
                                <p className="text-[11px] font-bold leading-tight flex-1">
                                    {matrixTips[currentTipIndex]}
                                </p>
                                <div className="flex space-x-1 shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentTipIndex((prev) => (prev + 1) % matrixTips.length);
                                        }}
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100/50 hover:bg-amber-200/50 text-amber-700 active:scale-95 transition-all"
                                        title="Astuce suivante"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMatrixTipDismissed(true);
                                        }}
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100/50 hover:bg-amber-200/50 text-amber-700 active:scale-95 transition-all"
                                        title="Fermer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}

                {/* Selection Bubble previously here, removed */}
            </header>

            {/* Main Content Area */}
            <main onScroll={handleScroll} ref={mainRef} className={clsx("flex-1 pb-32 overflow-y-auto no-scrollbar relative w-full pt-4", activeView === 'graph' ? "mt-[190px]" : "mt-[210px]")}>
                <AnimatePresence mode="wait" initial={false}>
                    {activeView === 'graph' && (
                        <motion.div
                            key="graph"
                            initial={{ x: '-10%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '-10%', opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full px-4"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = Math.abs(offset.x) * velocity.x;
                                if (swipe < -100) setActiveView('matrix');
                            }}
                        >
                            <div className="relative mt-2.5" onClick={() => setSelectedGraphPoint(null)}>
                                {/* Axis Track Markers Above the Graph */}
                                <div className="flex justify-center mb-2" style={{ marginLeft: labelWidth }}>
                                    <div className="relative w-full h-5" style={{ maxWidth: graphWidth }}>
                                        <div className="absolute left-0 text-xs font-black text-zinc-400 -translate-x-1/2">
                                            {formatCurrency(axisMin, true)}
                                        </div>
                                        <div className="absolute left-[50%] text-xs font-black text-zinc-400 -translate-x-1/2">
                                            0
                                        </div>
                                        <div className="absolute right-0 text-xs font-black text-zinc-400 translate-x-1/2">
                                            {formatCurrency(axisMax, true)}
                                        </div>
                                    </div>
                                </div>

                                {/* SVG Overlay for the continuous line and central axis */}
                                <div className="absolute top-8 right-0 bottom-0 pointer-events-none z-10" style={{ width: graphWidth, height: projection.length * rowHeight }}>
                                    <svg width="100%" height="100%" className="overflow-visible">
                                        {/* Center Axis */}
                                        <line x1={midX} y1="0" x2={midX} y2="100%" stroke="#e4e4e7" strokeWidth="1.5" strokeDasharray="4 4" />

                                        {minBalPoint && <line x1={midX + ((minBalPoint.balance / maxBal) * (graphWidth / 2))} y1="0" x2={midX + ((minBalPoint.balance / maxBal) * (graphWidth / 2))} y2="100%" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />}
                                        {maxBalPoint && <line x1={midX + ((maxBalPoint.balance / maxBal) * (graphWidth / 2))} y1="0" x2={midX + ((maxBalPoint.balance / maxBal) * (graphWidth / 2))} y2="100%" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />}

                                        {/* Balance Line connecting points */}
                                        <path
                                            d={linePath}
                                            fill="none"
                                            stroke="#18181b"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />

                                        {/* Balance Points */}
                                        {projection.map((p, i) => {
                                            const y = (i * rowHeight) + (rowHeight / 2);
                                            const x = midX + ((p.balance / maxBal) * (graphWidth / 2));
                                            return (
                                                <g
                                                    key={`pt-${i}`}
                                                    className="pointer-events-auto cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedGraphPoint({ month: p.month, type: 'balance', value: p.balance, x, y });
                                                    }}
                                                >
                                                    <circle cx={x} cy={y} r="15" fill="transparent" />
                                                    <circle cx={x} cy={y} r="7" fill={p.balance < 0 ? "#f43f5e" : "#10b981"} stroke="#ffffff" strokeWidth="2" />
                                                </g>
                                            )
                                        })}
                                        {/* Start point */}
                                        <g
                                            className="pointer-events-auto cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const x = midX + ((startingBalance / maxBal) * (graphWidth / 2));
                                                // @ts-ignore
                                                setSelectedGraphPoint({ month: projection[0]?.month || '', type: 'balance', value: startingBalance, x, y: rowHeight / 2 });
                                            }}
                                        >
                                            <circle cx={midX + ((startingBalance / maxBal) * (graphWidth / 2))} cy={rowHeight / 2} r="15" fill="transparent" />
                                            <circle cx={midX + ((startingBalance / maxBal) * (graphWidth / 2))} cy={rowHeight / 2} r="7" fill={startingBalance < 0 ? "#f43f5e" : "#10b981"} stroke="#ffffff" strokeWidth="2" />
                                        </g>
                                    </svg>
                                </div>

                                {/* Graph Tooltip Overlay */}
                                <AnimatePresence>
                                    {selectedGraphPoint && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                            className="absolute z-50 bg-zinc-900 text-white px-3 py-1.5 rounded-xl shadow-xl pointer-events-none flex items-center space-x-1.5 whitespace-nowrap border border-zinc-700/50"
                                            style={{
                                                right: graphWidth - selectedGraphPoint.x,
                                                top: selectedGraphPoint.y + 32 - 45,
                                                transform: 'translateX(50%)'
                                            }}
                                        >
                                            <div className={clsx(
                                                "w-2 h-2 rounded-full",
                                                selectedGraphPoint.type === 'balance' ? (selectedGraphPoint.value < 0 ? 'bg-rose-500' : 'bg-emerald-500') :
                                                    selectedGraphPoint.type === 'income' ? 'bg-emerald-300' : 'bg-rose-300'
                                            )} />
                                            <span className="font-black text-xs">{formatCurrencyDetailed(selectedGraphPoint.value)}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Rows */}
                                <div className="space-y-0 mt-8" style={{ paddingRight: 0 }}>
                                    {projection.map((p, i) => {
                                        const d = parseISO(`${p.month}-01`);

                                        const incomeW = (p.income / maxFlow) * (graphWidth / 2 * 0.85);
                                        const expenseW = (p.expense / maxFlow) * (graphWidth / 2 * 0.85);

                                        return (
                                            <div key={p.month} className="flex items-center relative" style={{ height: rowHeight }}>
                                                {/* Label (Larger font, bold italic as requested) */}
                                                <div className="w-[60px] flex-shrink-0 text-left">
                                                    <span className="text-sm font-black italic text-zinc-900 capitalize">
                                                        {format(d, 'MMM.yy', { locale: fr }).replace('.', '')}
                                                    </span>
                                                </div>

                                                {/* Bar Chart Container */}
                                                <div className="flex-1 relative flex items-center justify-center h-full">
                                                    {/* Expense Bar (Left) */}
                                                    <div className="absolute right-[50%] flex justify-end items-center pr-1 h-full">
                                                        {p.expense > 0 && (
                                                            <div
                                                                className="h-4 bg-rose-300 rounded-l-md pointer-events-auto cursor-pointer"
                                                                style={{ width: expenseW }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedGraphPoint({ month: p.month, type: 'expense', value: -p.expense, x: midX - expenseW / 2, y: (i * rowHeight) + rowHeight / 2 });
                                                                }}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Income Bar (Right) */}
                                                    <div className="absolute left-[50%] flex justify-start items-center pl-1 h-full">
                                                        {p.income > 0 && (
                                                            <div
                                                                className="h-4 bg-emerald-300 rounded-r-md pointer-events-auto cursor-pointer"
                                                                style={{ width: incomeW }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedGraphPoint({ month: p.month, type: 'income', value: p.income, x: midX + incomeW / 2, y: (i * rowHeight) + rowHeight / 2 });
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </motion.div>
                    )}

                    {activeView === 'matrix' && (
                        <motion.div
                            key="matrix"
                            initial={{ x: '10%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '10%', opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full relative"
                            drag={!draggingTxId ? "x" : false} // Disable page swipe when dragging a pill
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                if (draggingTxId) return; // Ignore if dragging element
                                const swipe = Math.abs(offset.x) * velocity.x;
                                if (swipe > 100) setActiveView('graph');
                            }}
                        >
                            <div className="px-4 mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-3">{dictionary.mobile.monthly}</h3>
                                {/* Pills Layout for Mensuels */}
                                <div className="flex flex-wrap gap-2 relative">
                                    {recurringTxs.length === 0 && (
                                        <div className="text-zinc-400 text-[10px] italic py-3 px-1 w-full text-left">
                                            {dictionary.timeline.emptyIncome}
                                        </div>
                                    )}
                                    {recurringTxs.map(tx => (
                                        <motion.button
                                            key={tx.id}
                                            onClick={(e) => {
                                                if (draggingTxId) {
                                                    e.preventDefault();
                                                    return;
                                                }
                                                handleEdit(tx);
                                            }}
                                            onPointerDown={(e) => {
                                                e.stopPropagation();
                                            }}
                                            drag
                                            dragSnapToOrigin
                                            dragElastic={1}
                                            onDragStart={() => handleDragStart(tx.id)}
                                            onDrag={(e, info) => {
                                                const el = document.elementFromPoint(info.point.x, info.point.y);
                                                if (el) {
                                                    const trash = el.closest('[data-droptarget="trash"]');
                                                    if (trash && !isHoveringTrash) setIsHoveringTrash(true);
                                                    else if (!trash && isHoveringTrash) setIsHoveringTrash(false);
                                                }
                                            }}
                                            onDragEnd={(e, info) => {
                                                // Only handle trash for recurrings
                                                setDraggingTxId(null);
                                                setIsHoveringTrash(false);
                                                const el = document.elementFromPoint(info.point.x, info.point.y);
                                                if (el) {
                                                    const trash = el.closest('[data-droptarget="trash"]');
                                                    if (trash) {
                                                        setTxToDelete(tx.id);
                                                        return;
                                                    }
                                                }
                                            }}
                                            whileDrag={{ scale: 1.1, zIndex: 100, rotate: -2, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)" }}
                                            className={clsx(
                                                "pl-3 pr-2 py-1.5 rounded-lg border-2 text-sm font-black flex items-center space-x-2 active:scale-95 transition-all touch-none",
                                                tx.direction === 'income' ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-rose-200 text-rose-600 bg-rose-50",
                                                draggingTxId === tx.id && "shadow-xl border-zinc-900"
                                            )}
                                        >
                                            <span className="truncate max-w-[100px] italic pointer-events-none">{tx.label}</span>
                                            <span className="opacity-75 text-xs pointer-events-none">{formatCurrencyDetailed(tx.amount)}/m</span>
                                        </motion.button>
                                    ))}
                                    <button
                                        onClick={() => handleAdd(undefined, 'monthly')}
                                        className="w-10 h-10 rounded-lg border-2 border-zinc-200 text-zinc-400 flex items-center justify-center active:bg-zinc-50"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="px-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-2">{dictionary.mobile.oneOff}</h3>
                                {transactions.filter(t => t.recurrence === 'none').length === 0 && (
                                    <div className="text-zinc-400 text-[10px] italic pt-1 pb-3 px-1 w-full text-left">
                                        {dictionary.timeline.emptyOneOff}
                                    </div>
                                )}
                                <div className="space-y-0">
                                    {projection.map(p => {
                                        const d = parseISO(`${p.month}-01`);
                                        const oneOffs = transactions.filter(t => t.month === p.month && t.recurrence === 'none');

                                        return (
                                            <div
                                                key={p.month}
                                                className={clsx(
                                                    "flex min-h-[45px] py-1 transition-colors duration-200 border-2 rounded-xl mb-1 border-transparent",
                                                    hoveredMonth === p.month && "border-zinc-200 bg-zinc-50"
                                                )}
                                                data-droptarget="month"
                                                data-month={p.month}
                                            >
                                                {/* Label (Same format as Graph view) */}
                                                <div className="w-[80px] flex-shrink-0 flex items-center text-left pt-2 px-2">
                                                    <span className="text-sm font-black italic text-zinc-900 capitalize inline-block border-b border-zinc-100 pb-1 w-full border-dotted pointer-events-none">
                                                        {format(d, 'MMM.yy', { locale: fr }).replace('.', '')}
                                                    </span>
                                                </div>

                                                {/* One-off Container */}
                                                <div className="flex-1 flex flex-wrap gap-2 items-start pl-2">
                                                    {oneOffs.map(tx => (
                                                        <motion.button
                                                            key={`p-${tx.id}`}
                                                            onClick={(e) => {
                                                                // Prevent tapping if we just dragged
                                                                if (draggingTxId) {
                                                                    e.preventDefault();
                                                                    return;
                                                                }
                                                                handleEdit(tx);
                                                            }}
                                                            onPointerDown={(e) => {
                                                                // Prevent the swipe gesture of the parent "matrix" view so drag is stable
                                                                e.stopPropagation();
                                                            }}
                                                            drag
                                                            dragSnapToOrigin
                                                            dragElastic={1}
                                                            onDragStart={() => handleDragStart(tx.id)}
                                                            onDrag={(e, info) => {
                                                                // Highlight the row we are hovering
                                                                const el = document.elementFromPoint(info.point.x, info.point.y);
                                                                if (el) {
                                                                    const row = el.closest('[data-droptarget="month"]');
                                                                    if (row) {
                                                                        const m = row.getAttribute('data-month');
                                                                        if (m && m !== hoveredMonth) setHoveredMonth(m);
                                                                    } else {
                                                                        if (hoveredMonth) setHoveredMonth(null);
                                                                    }

                                                                    const trash = el.closest('[data-droptarget="trash"]');
                                                                    if (trash && !isHoveringTrash) setIsHoveringTrash(true);
                                                                    else if (!trash && isHoveringTrash) setIsHoveringTrash(false);

                                                                    const duplicate = el.closest('[data-droptarget="duplicate"]');
                                                                    if (duplicate && !isHoveringDuplicate) setIsHoveringDuplicate(true);
                                                                    else if (!duplicate && isHoveringDuplicate) setIsHoveringDuplicate(false);
                                                                }
                                                            }}
                                                            onDragEnd={(e, info) => handleDragEnd(e, info, tx)}
                                                            whileDrag={{ scale: 1.1, zIndex: 100, rotate: -2, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)" }}
                                                            className={clsx(
                                                                "px-3 py-1.5 rounded-lg text-xs font-black border-2 flex items-center space-x-1 active:scale-95 transition-all touch-none",
                                                                tx.direction === 'income' ? "border-emerald-200 text-emerald-600 bg-white" : "border-rose-200 text-rose-600 bg-white",
                                                                draggingTxId === tx.id && "shadow-xl border-zinc-900"
                                                            )}
                                                        >
                                                            <span className="pointer-events-none">{tx.label || 'Virement'}</span>
                                                            <span className="opacity-75 pointer-events-none">{formatCurrencyDetailed(tx.amount)}</span>
                                                        </motion.button>
                                                    ))}
                                                    <button
                                                        onClick={() => handleAdd(p.month, 'none')}
                                                        className="h-8 w-12 rounded-lg border-2 border-zinc-200 flex items-center justify-center text-zinc-400 active:bg-zinc-50 shrink-0"
                                                    >
                                                        <Plus className="w-4 h-4 pointer-events-none" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Floating Trash and Duplicate Zones (visible only when dragging) */}
                            <AnimatePresence>
                                {draggingTxId && (
                                    <motion.div
                                        initial={{ y: -100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -100, opacity: 0 }}
                                        className="fixed top-28 left-4 right-4 z-50 flex justify-between pointer-events-none"
                                    >
                                        <div
                                            data-droptarget="trash"
                                            className={clsx(
                                                "w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all pointer-events-auto shadow-md",
                                                isHoveringTrash ? "bg-rose-500 border-rose-600 scale-110 shadow-xl" : "bg-white border-rose-200"
                                            )}
                                        >
                                            <Trash2 className={clsx("w-6 h-6", isHoveringTrash ? "text-white" : "text-rose-400")} />
                                        </div>

                                        <div
                                            data-droptarget="duplicate"
                                            className={clsx(
                                                "w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all pointer-events-auto shadow-md",
                                                isHoveringDuplicate ? "bg-emerald-500 border-emerald-600 scale-110 shadow-xl" : "bg-white border-emerald-200"
                                            )}
                                        >
                                            <Copy className={clsx("w-6 h-6", isHoveringDuplicate ? "text-white" : "text-emerald-400")} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Fixed Bottom CTAs */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent z-40 pointer-events-none flex justify-center">
                <AnimatePresence mode="wait">
                    {activeView === 'graph' && (
                        <motion.div
                            key="cta-graph"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-sm pointer-events-auto"
                        >
                            <button
                                onClick={() => setActiveView('matrix')}
                                className="w-full py-[18px] px-6 bg-zinc-900 text-white rounded-[24px] font-black italic shadow-premium flex items-center justify-between active:scale-95 transition-all text-[15px]"
                            >
                                <span>Éditer les entrées/sorties</span>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}
                    {activeView === 'matrix' && (
                        <motion.div
                            key="cta-matrix"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-sm pointer-events-auto"
                        >
                            <button
                                onClick={() => setActiveView('graph')}
                                className="w-full py-[18px] px-6 bg-zinc-900 text-white rounded-[24px] font-black italic shadow-premium flex items-center justify-between active:scale-95 transition-all text-[15px]"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span>Voir le graph</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Editor Bottom Sheet */}
            <BottomSheet isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)}>
                {isEditorOpen && (
                    <MobileTransactionEditor
                        onClose={() => setIsEditorOpen(false)}
                        initialData={isAdding ? { month: addMonth, recurrence: addRecurrence } : selectedTransaction}
                    />
                )}
            </BottomSheet>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {txToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-6 shadow-2xl"
                        >
                            <div>
                                <h3 className="text-xl font-black italic tracking-tighter text-zinc-900 mb-2">Supprimer la transaction ?</h3>
                                <p className="text-sm font-medium text-zinc-500">Cette action est irréversible. Confirmez-vous ?</p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setTxToDelete(null)}
                                    className="flex-1 py-3 rounded-2xl font-bold text-sm text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={async () => {
                                        if (txToDelete) {
                                            await deleteTransaction(txToDelete);
                                            setTxToDelete(null);
                                        }
                                    }}
                                    className="flex-1 py-3 rounded-2xl font-bold text-sm text-white bg-rose-500 hover:bg-rose-600 shadow-premium transition-colors"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />

            {/* Delete Planification Modal */}
            <ConfirmDeleteModal
                isOpen={!!deletingPlanificationId}
                onClose={() => setDeletingPlanificationId(null)}
                onConfirm={async () => {
                    if (deletingPlanificationId) {
                        await deletePlanification(deletingPlanificationId);
                        setDeletingPlanificationId(null);
                    }
                }}
                planName={planifications.find(p => p.id === deletingPlanificationId)?.name || 'Cette planification'}
                dictionary={dictionary}
            />

            {/* Share Success Modal */}
            <AnimatePresence>
                {isShareModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2 text-emerald-500">
                                <Share2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black italic tracking-tighter text-zinc-900 text-center">Lien de partage copié !</h3>
                            <p className="text-sm font-medium text-zinc-500 text-center">
                                Votre configuration actuelle a été copiée. Vous pouvez envoyer ce lien à un ami, ou le garder pour recharger votre Dashboard plus tard.
                            </p>
                            <button
                                onClick={() => setIsShareModalOpen(false)}
                                className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-premium mt-4"
                            >
                                Fermer
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
