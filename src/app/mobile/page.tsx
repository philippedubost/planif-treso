'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronRight, ChevronLeft, Plus, Settings, Share2, Check, ChevronDown, LogOut, HelpCircle, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { MobileTransactionEditor } from '@/components/lists/MobileTransactionEditor';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { Transaction } from '@/lib/financeEngine';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { supabase } from '@/lib/supabase';

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
        user,
        setTutorialStep
    } = useFinanceStore();
    const projection = useProjection();
    const { width } = useWindowSize();

    const [activeView, setActiveView] = useState<'graph' | 'matrix'>('graph');

    const [isEditingBalance, setIsEditingBalance] = useState(false);
    const [tempBalance, setTempBalance] = useState(startingBalance.toString());

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addMonth, setAddMonth] = useState<string | undefined>();
    const [addRecurrence, setAddRecurrence] = useState<'monthly' | 'none'>('none');

    // Drag tracking state
    const [draggingTxId, setDraggingTxId] = useState<string | null>(null);
    const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
    const [isHoveringTrash, setIsHoveringTrash] = useState(false);

    // Header state
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isShared, setIsShared] = useState(false);

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
    const { updateTransaction, deleteTransaction } = useFinanceStore();

    const handleDragStart = (txId: string) => {
        setDraggingTxId(txId);
    };

    const handleDragEnd = async (e: any, info: any, tx: Transaction) => {
        setDraggingTxId(null);
        setHoveredMonth(null);
        setIsHoveringTrash(false);

        // Simple DOM element overlap detection since we are scrolling and standard HTML5 Dnd is tricky on mobile
        // Look for the element under the pointer
        const dropTarget = document.elementFromPoint(e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : 0), e.clientY || (e.changedTouches ? e.changedTouches[0].clientY : 0));

        if (!dropTarget) return;

        // Check if it's the trash
        const isTrash = dropTarget.closest('[data-droptarget="trash"]');
        if (isTrash) {
            await deleteTransaction(tx.id);
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

    // Points for the continuous line graph (Balance evolution)
    const linePath = useMemo(() => {
        if (projection.length === 0) return '';

        let pts = [];
        let x0 = midX + ((startingBalance / maxBal) * (graphWidth / 2));
        pts.push({ x: x0, y: 0 });

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

    const handleShare = () => {
        // Just a dummy local share since we don't have all state here, 
        // normally we'd copy the encoded state as in dashboard
        const url = `${window.location.origin}${window.location.pathname}`;
        navigator.clipboard.writeText(url).then(() => {
            setIsShared(true);
            setTimeout(() => setIsShared(false), 2000);
        });
    };

    return (
        <div className="min-h-screen bg-zinc-50 font-sans flex flex-col relative overflow-hidden">
            {/* Header Sticky (Shared) */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-100 px-4 py-4 md:py-6 shadow-sm">
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
                                Graph
                            </button>
                            <button
                                onClick={() => setActiveView('matrix')}
                                className={clsx(
                                    "px-4 py-1.5 rounded-full text-xs font-black tracking-wide transition-all",
                                    activeView === 'matrix' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400"
                                )}>
                                Détails
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-end items-center space-x-2">
                        {/* Share Button */}
                        <button
                            onClick={handleShare}
                            className={clsx(
                                "w-10 h-10 bg-white border border-zinc-100 rounded-full flex items-center justify-center shadow-soft active:scale-95 relative",
                                isShared && "border-emerald-500 bg-emerald-50"
                            )}
                        >
                            {isShared ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <Share2 className="w-4 h-4 text-zinc-400" />
                            )}
                        </button>

                        {/* Settings Button */}
                        <button
                            onClick={() => setIsSettingsModalOpen(true)}
                            className="w-10 h-10 bg-white border border-zinc-100 rounded-full flex items-center justify-center shadow-soft active:scale-95"
                        >
                            <Settings className="w-4 h-4 text-zinc-400" />
                        </button>

                        {/* Profile Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="px-3 py-1.5 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-premium active:scale-95 h-10"
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
                                        <button
                                            onClick={() => { setTutorialStep(1); setIsMenuOpen(false); }}
                                            className="w-full flex items-center space-x-3 p-3 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
                                        >
                                            <HelpCircle className="w-4 h-4" />
                                            <span className="font-black italic text-sm">Tutoriel</span>
                                        </button>
                                        <div className="h-px bg-zinc-50 my-1" />
                                        {user ? (
                                            <>
                                                <div className="p-3 text-xs text-zinc-400 italic">
                                                    {user.email || 'Connecté'}
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        await supabase.auth.signOut();
                                                    }}
                                                    className="w-full flex items-center space-x-3 p-3 rounded-xl text-zinc-400 hover:text-zinc-900 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span className="font-black italic text-sm">Déconnexion</span>
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                                                className="w-full flex items-center space-x-3 p-3 rounded-xl text-zinc-900 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                                            >
                                                <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center">
                                                    <Plus className="w-2 h-2 text-white" />
                                                </div>
                                                <span className="font-black italic text-sm">Se connecter</span>
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                    <div
                        className="text-center rounded-[20px] border-2 border-zinc-200 py-3 relative cursor-pointer active:scale-95 transition-transform"
                        onClick={() => {
                            if (!isEditingBalance) {
                                setIsEditingBalance(true);
                                setTempBalance(startingBalance.toString());
                            }
                        }}
                    >
                        <div className="flex items-center justify-center mb-1 space-x-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Solde aujourd'hui</p>
                            <Edit2 className="w-3 h-3 text-zinc-400" />
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
                                className="w-full text-center text-xl font-black tracking-tighter text-zinc-900 tabular-nums bg-transparent border-none p-0 focus:ring-0"
                            />
                        ) : (
                            <p className="text-xl font-black tracking-tighter text-zinc-900 tabular-nums">{formatCurrency(startingBalance)}</p>
                        )}
                    </div>
                    <div className="text-center rounded-[20px] border-2 border-zinc-200 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 mb-1">Solde 12 mois</p>
                        <p className={clsx("text-xl font-black tracking-tighter tabular-nums", finalBalance12m < 0 ? "text-rose-500" : "text-zinc-900")}>
                            {formatCurrency(finalBalance12m)}
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 mt-[200px] pb-32 overflow-y-auto no-scrollbar relative w-full pt-4">
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
                            <div className="relative">
                                {/* Axis Track Markers Above the Graph */}
                                <div className="flex justify-center mb-2" style={{ marginLeft: labelWidth }}>
                                    <div className="relative w-full" style={{ maxWidth: graphWidth }}>
                                        <div className="absolute left-0 text-sm font-black text-zinc-900 -translate-x-1/2">
                                            {formatCurrency(axisMin, true)}
                                        </div>
                                        <div className="absolute right-0 text-sm font-black text-zinc-900 translate-x-1/2">
                                            {formatCurrency(axisMax, true)}
                                        </div>
                                    </div>
                                </div>

                                {/* SVG Overlay for the continuous line and central axis */}
                                <div className="absolute top-8 right-0 bottom-0 pointer-events-none z-10" style={{ width: graphWidth, height: projection.length * rowHeight }}>
                                    <svg width="100%" height="100%" className="overflow-visible">
                                        {/* Center Axis */}
                                        <line x1={midX} y1="0" x2={midX} y2="100%" stroke="#18181b" strokeWidth="1" strokeDasharray="2 4" />

                                        {/* Balance Line connecting points */}
                                        <path
                                            d={linePath}
                                            fill="none"
                                            stroke="#18181b"
                                            strokeWidth="2.5"
                                        />

                                        {/* Balance Points */}
                                        {projection.map((p, i) => {
                                            const y = (i * rowHeight) + (rowHeight / 2);
                                            const x = midX + ((p.balance / maxBal) * (graphWidth / 2));
                                            return (
                                                <circle key={`pt-${i}`} cx={x} cy={y} r="6" fill="#18181b" />
                                            )
                                        })}
                                        {/* Start point */}
                                        <circle cx={midX + ((startingBalance / maxBal) * (graphWidth / 2))} cy="0" r="6" fill="#18181b" />
                                    </svg>
                                </div>

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
                                                            <div className="h-4 bg-rose-300 rounded-l-md" style={{ width: expenseW }} />
                                                        )}
                                                    </div>

                                                    {/* Income Bar (Right) */}
                                                    <div className="absolute left-[50%] flex justify-start items-center pl-1 h-full">
                                                        {p.income > 0 && (
                                                            <div className="h-4 bg-emerald-300 rounded-r-md" style={{ width: incomeW }} />
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
                            <div className="px-4 mb-8">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-3">Mensuels</h3>
                                {/* Pills Layout for Mensuels */}
                                <div className="flex flex-wrap gap-2">
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
                                                        if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction mensuelle ?")) {
                                                            deleteTransaction(tx.id);
                                                        }
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
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-2">Ponctuels</h3>
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
                            {/* Floating Trash Zone (visible only when dragging) */}
                            <AnimatePresence>
                                {draggingTxId && (
                                    <motion.div
                                        initial={{ y: -100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -100, opacity: 0 }}
                                        className="fixed top-28 left-0 right-0 z-50 flex justify-center pointer-events-none"
                                    >
                                        <div
                                            data-droptarget="trash"
                                            className={clsx(
                                                "w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all pointer-events-auto",
                                                isHoveringTrash ? "bg-rose-500 border-rose-600 scale-110 shadow-xl" : "bg-white border-rose-200 shadow-md"
                                            )}
                                        >
                                            <Trash2 className={clsx("w-8 h-8", isHoveringTrash ? "text-white" : "text-rose-400")} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Editor Bottom Sheet */}
            <BottomSheet isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)}>
                {isEditorOpen && (
                    <MobileTransactionEditor
                        onClose={() => setIsEditorOpen(false)}
                        initialData={isAdding ? { month: addMonth, recurrence: addRecurrence } : selectedTransaction}
                    />
                )}
            </BottomSheet>

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
        </div>
    );
}
