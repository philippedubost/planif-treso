'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronDown, Share2, Settings, LogOut, Plus, Check, Edit2, AlertTriangle, Info, X, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useTranslation } from '@/components/i18n/TranslationProvider';
import { useRouter, useParams } from 'next/navigation';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { MobileTransactionEditor } from '@/components/lists/MobileTransactionEditor';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Pencil, Trash2 } from 'lucide-react';

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

export default function ProjectionHorizontalPage() {
    const {
        startingBalance,
        setStartingBalance,
        currency,
        planifications,
        currentPlanificationId,
        addPlanification,
        updatePlanification,
        setCurrentPlanification,
        deletePlanification,
        transactions,
        updateTransaction,
        deleteTransaction,
        addTransaction,
        user
    } = useFinanceStore();
    const projection = useProjection();
    const { width, height } = useWindowSize();
    const router = useRouter();
    const params = useParams();
    const { dictionary } = useTranslation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPlanificationMenuOpen, setIsPlanificationMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isShared, setIsShared] = useState(false);

    const [deletingPlanificationId, setDeletingPlanificationId] = useState<string | null>(null);
    const [isAddingPlanification, setIsAddingPlanification] = useState(false);
    const [newPlanificationName, setNewPlanificationName] = useState('');

    const [isEditingBalance, setIsEditingBalance] = useState(false);
    const [tempBalance, setTempBalance] = useState('');
    const [isGraphTipDismissed, setIsGraphTipDismissed] = useState(false);
    const [scrollOpacity, setScrollOpacity] = useState(1);

    // --- Inline Edit State ---
    const [editingTxId, setEditingTxId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editAmount, setEditAmount] = useState('');

    const [isAddingTx, setIsAddingTx] = useState(false);
    const [addTxRecurrence, setAddTxRecurrence] = useState<'none' | 'monthly'>('none');
    const [addMonth, setAddMonth] = useState<string | undefined>();

    const [isMatrixOpen, setIsMatrixOpen] = useState(true);

    const [draggingTxId, setDraggingTxId] = useState<string | null>(null);
    const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
    const [isHoveringTrash, setIsHoveringTrash] = useState(false);
    const [isHoveringDuplicate, setIsHoveringDuplicate] = useState(false);
    const [txToDelete, setTxToDelete] = useState<string | null>(null);

    const startInlineEdit = (tx: any) => {
        setEditingTxId(tx.id);
        setEditLabel(tx.label);
        setEditAmount(`${tx.amount}`); // Amount sign is handled by direction
    };

    const saveInlineEdit = async (tx: any) => {
        const rawAmount = parseFloat(editAmount);
        if (isNaN(rawAmount) || rawAmount === 0) {
            setEditingTxId(null);
            return;
        }
        const direction = rawAmount < 0 ? 'expense' : 'income';
        const absoluteAmount = Math.abs(rawAmount);

        await updateTransaction(tx.id, {
            ...tx,
            label: editLabel.trim() || (direction === 'income' ? 'Recette' : 'Dépense'),
            amount: absoluteAmount,
            direction
        });
        setEditingTxId(null);
    };

    const handleDragStart = (txId: string) => {
        setDraggingTxId(txId);
    };

    const handleDragEnd = async (e: any, info: any, tx: any) => {
        setDraggingTxId(null);
        setHoveredMonth(null);
        setIsHoveringTrash(false);
        setIsHoveringDuplicate(false);

        const dropTarget = document.elementFromPoint(
            e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : 0),
            e.clientY || (e.changedTouches ? e.changedTouches[0].clientY : 0)
        );

        if (!dropTarget) return;

        const isTrash = dropTarget.closest('[data-droptarget="trash"]');
        if (isTrash) {
            setTxToDelete(tx.id);
            return;
        }

        const isDuplicate = dropTarget.closest('[data-droptarget="duplicate"]');
        if (isDuplicate) {
            const { id, ...txWithoutId } = tx;
            await addTransaction(txWithoutId);
            return;
        }

        const monthRow = dropTarget.closest('[data-droptarget="month"]');
        if (monthRow) {
            const newMonth = monthRow.getAttribute('data-month');
            if (newMonth && newMonth !== tx.month) {
                await updateTransaction(tx.id, { ...tx, month: newMonth });
            }
            return;
        }
    };

    const renderTransactionPill = (tx: any) => {
        const isEditing = editingTxId === tx.id;
        const isMonthly = tx.recurrence === 'monthly';

        if (isEditing) {
            if (!isMonthly) {
                return (
                    <div
                        key={`editing-${tx.id}`}
                        className={clsx(
                            "w-[74px] p-1 rounded-lg border-2 flex flex-col items-center gap-1 shadow-[0_4px_20px_rgba(0,0,0,0.15)] z-50 shrink-0",
                            tx.direction === 'income' ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
                        )}
                        style={{ height: '150px' }}
                    >
                        <input
                            autoFocus
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="w-full bg-white/50 text-[10px] font-black italic border-none focus:outline-none focus:ring-1 focus:ring-zinc-400 p-0.5 rounded text-center placeholder-zinc-400"
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(tx)}
                        />
                        <input
                            type="number"
                            inputMode="decimal"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full bg-white/50 text-xs font-bold text-center border-none focus:outline-none focus:ring-1 focus:ring-zinc-400 p-0.5 rounded tabular-nums"
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(tx)}
                        />
                        <div className="flex w-full justify-between gap-1">
                            <button
                                onClick={() => saveInlineEdit(tx)}
                                className="flex-1 h-6 flex items-center justify-center bg-zinc-900 text-white rounded active:scale-95 shadow-sm"
                            >
                                <Check className="w-3 h-3" />
                            </button>
                            <button
                                onClick={async () => {
                                    await deleteTransaction(tx.id);
                                    setEditingTxId(null);
                                }}
                                className="flex-1 h-6 flex items-center justify-center bg-rose-100 text-rose-500 rounded active:scale-95 shadow-sm"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                );
            }

            return (
                <div
                    key={`editing-${tx.id}`}
                    className={clsx(
                        "pl-2 min-w-[200px] w-full max-w-sm pr-1 py-1 rounded-lg border-2 flex items-center space-x-2 shadow-sm shrink-0",
                        tx.direction === 'income' ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900",
                        "h-9"
                    )}
                >
                    <input
                        autoFocus
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="flex-1 bg-transparent text-sm font-black italic border-none focus:outline-none focus:ring-0 p-0 text-inherit placeholder-zinc-400 min-w-[50px]"
                        onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(tx)}
                    />
                    <input
                        type="number"
                        inputMode="decimal"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-16 bg-transparent text-xs font-bold text-right border-none focus:outline-none focus:ring-0 p-0 text-inherit placeholder-zinc-400 tabular-nums shrink-0"
                        onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(tx)}
                    />
                    <button
                        onClick={() => saveInlineEdit(tx)}
                        className="w-7 h-7 shrink-0 flex items-center justify-center bg-zinc-900 text-white rounded-md active:scale-95 shadow-sm"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setEditingTxId(null)}
                        className="w-7 h-7 shrink-0 flex items-center justify-center bg-white text-zinc-400 border border-zinc-200 rounded-md active:scale-95 shadow-sm ml-1 hover:bg-zinc-50"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={async () => {
                            await deleteTransaction(tx.id);
                            setEditingTxId(null);
                        }}
                        className="w-7 h-7 shrink-0 flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 rounded-md active:scale-95 shadow-sm ml-1 hover:bg-rose-100"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            );
        }

        return (
            <motion.button
                key={tx.id}
                onClick={(e) => {
                    if (draggingTxId) {
                        e.preventDefault();
                        return;
                    }
                    startInlineEdit(tx);
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

                        const row = el.closest('[data-droptarget="month"]');
                        if (row && tx.recurrence === 'none') {
                            const m = row.getAttribute('data-month');
                            if (m && m !== hoveredMonth) setHoveredMonth(m);
                        } else {
                            if (hoveredMonth) setHoveredMonth(null);
                        }

                        const duplicate = el.closest('[data-droptarget="duplicate"]');
                        if (duplicate && !isHoveringDuplicate) setIsHoveringDuplicate(true);
                        else if (!duplicate && isHoveringDuplicate) setIsHoveringDuplicate(false);
                    }
                }}
                onDragEnd={(e, info) => {
                    if (tx.recurrence === 'monthly') {
                        setDraggingTxId(null);
                        setIsHoveringTrash(false);
                        const el = document.elementFromPoint(info.point.x, info.point.y);
                        if (el) {
                            const trash = el.closest('[data-droptarget="trash"]');
                            if (trash) {
                                setTxToDelete(tx.id);
                            }
                        }
                    } else {
                        handleDragEnd(e, info, tx);
                    }
                }}
                whileDrag={{ scale: 1.1, zIndex: 100, rotate: -2, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)" }}
                className={clsx(
                    "rounded-lg font-black border-2 active:scale-95 transition-all touch-none shadow-sm flex shrink-0",
                    tx.direction === 'income' ? "border-emerald-200 text-emerald-600 bg-white" : "border-rose-200 text-rose-600 bg-white",
                    tx.recurrence === 'monthly' && (tx.direction === 'income' ? "bg-emerald-50" : "bg-rose-50"),
                    draggingTxId === tx.id && "shadow-xl border-zinc-900 z-50",
                    tx.recurrence === 'monthly'
                        ? "w-max px-2 text-xs items-center justify-between h-[30px] min-w-[80px]"
                        : "px-1 w-full max-w-[70px] text-[10px] flex-col items-center justify-center py-1 gap-0.5 h-[44px]"
                )}
            >
                {tx.recurrence === 'monthly' ? (
                    <>
                        <span className="truncate flex-1 pr-1 italic pointer-events-none text-left max-w-[80px]">{tx.label || 'Virement'}</span>
                        <span className="opacity-75 pointer-events-none text-[10px] tabular-nums text-right shrink-0">
                            {tx.direction === 'expense' ? `-${formatCurrency(tx.amount).replace(/^-/, '')}` : formatCurrency(tx.amount)}/m
                        </span>
                    </>
                ) : (
                    <>
                        <span className="truncate w-full italic pointer-events-none px-0.5 text-center">{tx.label || 'Virement'}</span>
                        <span className="opacity-80 pointer-events-none tabular-nums text-center leading-none">
                            {tx.direction === 'expense' ? `-${formatCurrency(tx.amount).replace(/^-/, '')}` : formatCurrency(tx.amount)}
                        </span>
                    </>
                )}
            </motion.button>
        );
    };

    const scrollRef = useRef<HTMLDivElement>(null);

    // To auto-center to the first month or current month on load
    useEffect(() => {
        if (scrollRef.current && projection.length > 0) {
            // Slight delay to ensure rendering
            setTimeout(() => {
                if (scrollRef.current) {
                    const firstCol = scrollRef.current.querySelector('[data-month-col]');
                    if (firstCol) {
                        firstCol.scrollIntoView({ behavior: 'instant', inline: 'center' });
                    }
                }
            }, 50);
        }
    }, [projection.length]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft;
        // Fade out completely after 100px of scrolling
        const opacity = Math.max(0, 1 - scrollLeft / 100);
        setScrollOpacity(opacity);
    };

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

    const handleShare = () => {
        const url = `${window.location.origin}${window.location.pathname}`;
        navigator.clipboard.writeText(url).then(() => {
            setIsShared(true);
            setIsShareModalOpen(true);
            setTimeout(() => setIsShared(false), 2000);
        });
    };

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


    // --- Timeline Graph Calculations ---
    const colWidth = 80; // width of each month column
    const canvasWidth = projection.length * colWidth + (width || 375); // padding for scrolling past ends
    const leftAxisLabelsWidth = 80;

    // Dynamic available height for the bottom block considering keyboard
    const availableHeight = height ? height - 150 : 650;
    const bottomSpace = isMatrixOpen ? availableHeight * 0.30 : 0; // 30% height for extras & recurring IF open
    const paddingY = Math.min(60, Math.max(15, (availableHeight - bottomSpace) * 0.15));
    //const paddingY = 15;
    const canvasHeight = Math.max(availableHeight - bottomSpace, 150);

    const { minY, maxY, maxOneOffs } = useMemo(() => {
        let min = startingBalance;
        let max = startingBalance;
        let maxIn = 0;
        let maxOut = 0;
        let maxExtras = 0;

        projection.forEach(p => {
            if (p.balance < min) min = p.balance;
            if (p.balance > max) max = p.balance;
            if (p.income > maxIn) maxIn = p.income;
            if (p.expense > maxOut) maxOut = p.expense;

            const oneOffsCount = transactions.filter(t => t.month === p.month && t.recurrence === 'none').length;
            if (oneOffsCount > maxExtras) maxExtras = oneOffsCount;
        });

        // Ensure maxIn and maxOut find room relative to the 0 curve
        let calcMaxY = Math.max(max, maxIn * 1.5);
        let calcMinY = Math.min(min, -maxOut * 1.5);

        // Add padding
        const padMax = Math.abs(calcMaxY) * 0.1;
        const padMin = Math.abs(calcMinY) * 0.1;

        let finalMaxY = calcMaxY + padMax;
        let finalMinY = calcMinY - padMin;

        if (finalMaxY <= 0) finalMaxY = 100;
        if (finalMinY >= 0) finalMinY = -100;
        if (finalMaxY === finalMinY) {
            finalMaxY += 100;
            finalMinY -= 100;
        }

        return { minY: finalMinY, maxY: finalMaxY, maxOneOffs: maxExtras };
    }, [projection, startingBalance, transactions]);

    // Dynamic height for the extras tray based on maxOneOffs
    // Base height for 1 extra is ~18vh, add more space up to a max
    const dynamicExtrasHeight = Math.min(18 + (Math.max(0, maxOneOffs - 1) * 6), 35);

    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const handleAdd = (month?: string, recurrence: 'monthly' | 'none' = 'none') => {
        setAddMonth(month);
        setAddTxRecurrence(recurrence);
        setIsAddingTx(true);
    };

    const handleAddInlineExtra = (month: string) => {
        const newId = `temp-${Date.now()}`;
        const tx = {
            id: newId,
            month: month,
            startMonth: month,
            recurrence: 'none' as const,
            label: '',
            categoryId: 'temp',
            amount: 0,
            direction: 'out' as const
        };
        useFinanceStore.getState().addTransaction(tx as any);
        setEditingTxId(newId);
        setEditAmount("0");
        setEditLabel("");
    };

    const getBalY = (val: number) => {
        const range = maxY - minY || 1;
        const availableHeight = Math.max(canvasHeight - (paddingY * 2), 10);
        return (canvasHeight - paddingY) - ((val - minY) / range) * availableHeight;
    };

    const getBarProps = (flow: number, type: 'income' | 'expense') => {
        const zeroY = getBalY(0);

        if (type === 'income') {
            const flowY = getBalY(flow);
            // Income goes UP from zero: top = flowY, height = zeroY - flowY
            return { top: flowY, height: Math.max(zeroY - flowY, 4) };
        } else {
            const flowY = getBalY(-flow);
            // Expense goes DOWN from zero: top = zeroY, height = flowY - zeroY
            return { top: zeroY, height: Math.max(flowY - zeroY, 4) };
        }
    };

    const linePath = useMemo(() => {
        if (projection.length === 0) return '';
        let path = '';
        const radius = 30; // for bezier corners

        let pts = projection.map((p, i) => {
            // center point of the column
            const x = (width ? width / 3 : 120) - (colWidth / 2) + (i * colWidth) + (colWidth / 2);
            const y = getBalY(p.balance);
            return { x, y };
        });

        if (pts.length < 2) return `M ${pts[0]?.x || 0},${pts[0]?.y || 0}`;

        path = `M ${pts[0].x},${pts[0].y}`;

        for (let i = 1; i < pts.length - 1; i++) {
            let p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
            let d1 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
            let d2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);

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
    }, [projection, minY, maxY, canvasHeight, width]);

    return (
        <div className="h-[100dvh] bg-zinc-50 font-sans flex flex-col relative overflow-hidden">
            {/* Top Section */}
            <header className="z-50 bg-white px-4 py-4 md:py-6 shadow-sm border-b border-zinc-100 pb-4 shrink-0 flex flex-col justify-between" id="fixed-header">
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex-1 flex justify-start items-center space-x-2">
                            <button onClick={() => router.back()} className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="font-black italic text-zinc-900">Timeline</span>
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

                    {/* Interpretation Block */}
                    {!isGraphTipDismissed && !isMatrixOpen && (
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
                                >
                                    <X className="w-4 h-4 opacity-50" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Scorecards */}
                    {!isMatrixOpen && (
                        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mt-auto mb-2">
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
                        </div>
                    )}
                </div>
            </header>

            {/* Horizontal Timeline Section */}
            <main className="flex-1 relative w-full overflow-hidden flex flex-col bg-zinc-50">
                <div className="flex-1 relative w-full flex flex-col min-h-0">
                    {/* Fixed Y-Axis Subtle Legend */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-12 z-20 pointer-events-none select-none transition-opacity duration-200"
                        style={{ opacity: scrollOpacity }}
                    >
                        <div className="absolute right-0" style={{ top: `${getBalY(maxY)}px`, transform: 'translateY(-50%)' }}>
                            <span className="text-[10px] font-bold text-zinc-400">{formatCurrency(maxY, true)}</span>
                        </div>
                        <div className="absolute right-0" style={{ top: `${getBalY(0)}px`, transform: 'translateY(-50%)' }}>
                            <span className="text-[10px] font-bold text-zinc-400">0</span>
                        </div>
                        <div className="absolute right-0" style={{ top: `${getBalY(minY)}px`, transform: 'translateY(-50%)' }}>
                            <span className="text-[10px] font-bold text-zinc-400">{formatCurrency(minY, true)}</span>
                        </div>
                    </div>

                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex-1 w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar relative flex flex-col pointer-events-auto"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        <div
                            className="relative flex-1 shrink flex items-end pb-8"
                            style={{ width: `${canvasWidth}px` }}
                        >
                            {/* SVG Balance Curve Overlay */}
                            <svg className="absolute inset-0 pointer-events-none z-10" width="100%" height="100%">
                                {/* Zero line */}
                                <motion.line x1="0" animate={{ y1: getBalY(0), y2: getBalY(0) }} transition={{ type: "spring", stiffness: 300, damping: 30 }} x2="100%" stroke="#e4e4e7" strokeWidth="2" strokeDasharray="6 6" />

                                {/* Drop shadow for the curve */}
                                <filter id="dropshadow" height="130%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.15" />
                                </filter>

                                <motion.path
                                    animate={{ d: linePath }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    fill="none"
                                    stroke="#18181b"
                                    strokeWidth="5"
                                    filter="url(#dropshadow)"
                                />

                                {/* Center highlights for dots */}
                                {projection.map((p, i) => {
                                    const x = (width ? width / 3 : 120) - (colWidth / 2) + (i * colWidth) + (colWidth / 2);
                                    const y = getBalY(p.balance);
                                    const isNegative = p.balance < 0;
                                    return (
                                        <g key={`dot-${p.month}`} className="pointer-events-auto">
                                            {/* Invisible touch target area */}
                                            <motion.circle cx={x} animate={{ cy: y }} transition={{ type: "spring", stiffness: 300, damping: 30 }} r="25" fill="transparent" />
                                            <motion.circle
                                                cx={x} animate={{ cy: y }} transition={{ type: "spring", stiffness: 300, damping: 30 }} r="8"
                                                fill={isNegative ? "#f43f5e" : "#18181b"}
                                                stroke="#ffffff" strokeWidth="3"
                                            />
                                            {/* Label above point */}
                                            <motion.text
                                                x={x}
                                                animate={{ y: y - 20 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                textAnchor="middle"
                                                fill={isNegative ? "#f43f5e" : "#18181b"}
                                                className="text-[10px] font-bold tabular-nums pointer-events-none"
                                            >
                                                {formatCurrency(p.balance)}
                                            </motion.text>
                                        </g>
                                    )
                                })}
                            </svg>

                            {/* Month Columns */}
                            <div className="flex h-full absolute inset-0" style={{ paddingLeft: (width ? width / 3 : 120) - (colWidth / 2), paddingRight: (width ? width / 2 : 180) - (colWidth / 2) }}>
                                {projection.map(p => {
                                    const d = parseISO(`${p.month}-01`);
                                    return (
                                        <div
                                            key={p.month}
                                            data-month-col
                                            className={clsx(
                                                "h-full shrink-0 snap-center relative flex justify-center items-end py-8 transition-colors"
                                            )}
                                            style={{ width: colWidth }}
                                        >
                                            <div className="absolute top-4 w-full flex flex-col items-center">
                                                <span className={clsx(
                                                    "text-sm font-black italic tracking-tighter capitalize transition-colors text-zinc-400"
                                                )}>
                                                    {format(d, 'MMM.yy', { locale: fr }).replace('.', '')}
                                                </span>
                                            </div>

                                            {/* Bars */}
                                            <div className="absolute inset-0 z-0 pointer-events-none">
                                                <div className="relative w-8 mx-auto h-full opacity-50 group-hover:opacity-100 transition-opacity">
                                                    {p.income > 0 && (
                                                        <motion.div
                                                            className="absolute w-3 bg-emerald-400 rounded-t-full shadow-sm group left-0"
                                                            animate={getBarProps(p.income, 'income')}
                                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                        >
                                                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                                <span className="text-[9px] font-bold text-emerald-600">+{formatCurrency(p.income)}</span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                    {p.expense > 0 && (
                                                        <motion.div
                                                            className="absolute w-3 bg-rose-400 rounded-b-full shadow-sm group right-0"
                                                            animate={getBarProps(p.expense, 'expense')}
                                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                        >
                                                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                                <span className="text-[9px] font-bold text-rose-600">-{formatCurrency(p.expense)}</span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* EXTRAS & RECURRING Horizontal Area */}
                        <AnimatePresence>
                            {isMatrixOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: `${bottomSpace}px`, opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="w-full shrink-0 flex flex-col pt-2 pb-4 relative z-10 bg-white border-t border-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
                                    style={{ minWidth: `${canvasWidth + leftAxisLabelsWidth}px` }}
                                >

                                    {/* EXTRAS ROW */}
                                    <div className="flex-1 flex w-full relative h-[60%]">
                                        {/* Fixed Left Label Section */}
                                        <div
                                            className="sticky left-0 flex items-center justify-end z-20 pointer-events-none pr-3 w-[120px] bg-gradient-to-r from-white via-white to-transparent"
                                            style={{ left: (width ? width / 3 : 120) - (colWidth / 2) - 80 }}
                                        >
                                            <span className="text-[10px] font-black tracking-widest text-zinc-400">EXTRAS</span>
                                        </div>

                                        <div className="flex w-full h-full" style={{ paddingLeft: 0, paddingRight: (width ? width / 2 : 180) - (colWidth / 2) }}>
                                            {projection.map(p => {
                                                const d = parseISO(`${p.month}-01`);
                                                const oneOffs = transactions.filter(t => t.month === p.month && t.recurrence === 'none');
                                                return (
                                                    <div
                                                        key={`extras-${p.month}`}
                                                        data-droptarget="month"
                                                        data-month={p.month}
                                                        className={clsx(
                                                            "h-full px-1 flex flex-col items-center transition-colors border-l border-zinc-100 border-dashed relative",
                                                            hoveredMonth === p.month ? "bg-zinc-50" : ""
                                                        )}
                                                        style={{ width: colWidth, flexShrink: 0 }}
                                                    >
                                                        <div className="flex flex-col space-y-2 w-full px-0.5 pb-2 items-center flex-1 overflow-y-auto no-scrollbar">
                                                            {oneOffs.map(t => renderTransactionPill(t))}
                                                            <button
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    handleAddInlineExtra(p.month);
                                                                }}
                                                                className="w-[70px] min-h-[44px] h-[44px] rounded-lg border-dashed border-[1.5px] border-zinc-200 flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors bg-white/50 shrink-0 mt-2"
                                                            >
                                                                <Plus className="w-5 h-5 mb-0.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* CHAQUE MOIS ROW */}
                                    <div className="h-[40%] flex w-full relative mt-2 border-t border-zinc-50 pt-2 pb-2">
                                        <div
                                            className="sticky left-0 flex items-center justify-end z-20 pointer-events-none pr-3 w-[120px] bg-gradient-to-r from-white via-white to-transparent"
                                            style={{ left: (width ? width / 3 : 120) - (colWidth / 2) - 80 }}
                                        >
                                            <span className="text-[10px] font-black tracking-widest text-zinc-400">CHAQUE MOIS</span>
                                        </div>

                                        <div className="flex flex-1 h-full overflow-x-auto no-scrollbar items-center justify-start gap-1.5 px-2">
                                            {transactions.filter(t => t.recurrence === 'monthly').map(t => renderTransactionPill(t))}
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    handleAdd(undefined, 'monthly');
                                                }}
                                                className="w-[80px] min-h-[30px] h-[30px] rounded-lg border-dashed border-[1.5px] border-zinc-200 flex flex-row items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors bg-white/50 shrink-0"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-0.5" />
                                                <span className="text-[10px] font-bold italic">Mensuel</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                {/* Spacer padding for bottom */}
                <motion.div
                    className="w-full shrink-0 bg-zinc-50 pointer-events-none"
                    initial={false}
                    animate={{ height: isMatrixOpen ? '30vh' : '85px' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </main>

            {/* Floating Top Handle */}
            <motion.div
                className={clsx(
                    "absolute left-0 right-0 bg-white cursor-pointer z-[50] flex flex-col justify-start items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-zinc-100 rounded-t-[32px] transition-all",
                    isMatrixOpen ? "h-[50px] border-t-0 shadow-none bg-white rounded-b-none bottom-[30vh]" : "h-[85px] border-t bottom-0"
                )}
                onClick={() => setIsMatrixOpen(!isMatrixOpen)}
            >
                <div className="w-12 h-1.5 bg-zinc-200 rounded-full mt-3 mb-1" />
                <div className="flex items-center space-x-2 text-zinc-900 mt-1">
                    <span className="font-black italic tracking-tighter text-lg">Éditer Entrées et Sorties</span>
                    {isMatrixOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 -rotate-90" />}
                </div>
            </motion.div>

            {/* Floating Trash and Duplicate Zones (visible only when dragging) */}
            <AnimatePresence>
                {
                    draggingTxId && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="fixed top-28 left-4 right-4 z-[90] flex justify-between pointer-events-none"
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
                    )
                }
            </AnimatePresence >

            <BottomSheet isOpen={isAddingTx} onClose={() => setIsAddingTx(false)}>
                <MobileTransactionEditor
                    onClose={() => setIsAddingTx(false)}
                    initialData={{ month: addMonth, startMonth: addMonth, recurrence: addTxRecurrence }}
                />
            </BottomSheet>

            {/* Backdrop for matrix removed as requested to avoid graying graph */}

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />

            <ConfirmDeleteModal
                isOpen={!!deletingPlanificationId}
                planName={planifications.find(p => p.id === deletingPlanificationId)?.name}
                onClose={() => setDeletingPlanificationId(null)}
                dictionary={dictionary}
                onConfirm={async () => {
                    if (deletingPlanificationId) {
                        const newPlanificationList = planifications.filter(p => p.id !== deletingPlanificationId);
                        await deletePlanification(deletingPlanificationId);
                        setDeletingPlanificationId(null);
                        if (currentPlanificationId === deletingPlanificationId && newPlanificationList.length > 0) {
                            setCurrentPlanification(newPlanificationList[0].id);
                        }
                    }
                }}
            />

            {/* Share Success Toast */}
            <AnimatePresence>
                {isShareModalOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3"
                    >
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                        <div className="pr-2">
                            <p className="text-sm font-bold">Lien copié</p>
                            <p className="text-[10px] text-zinc-400 font-medium">Prêt à être partagé</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
