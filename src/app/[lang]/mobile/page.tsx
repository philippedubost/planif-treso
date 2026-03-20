'use client';

import { useState, useRef, useEffect } from 'react';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import {
    Settings, Plus, Check, Share2,
    ChevronDown, Undo2, Redo2, X, GripVertical
} from 'lucide-react';
import { clsx } from 'clsx';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { useTranslation } from '@/components/i18n/TranslationProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    ReferenceLine
} from 'recharts';
import { Transaction, TransactionDirection } from '@/lib/financeEngine';
import { MobileTransactionEditor } from '@/components/lists/MobileTransactionEditor';
import { SentenceTransactionEditor } from '@/components/lists/SentenceTransactionEditor';

// ── Column width for mobile (narrower than desktop's 96px) ──
const MOBILE_COL = 82; // px per month column
const LABEL_WIDTH = 52; // sticky left label area

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
function formatCurrencyCompact(val: number, currency: string) {
    const sign = val < 0 ? '-' : '';
    const abs = Math.abs(val);
    if (abs >= 1000) return `${sign}${Math.round(abs / 1000)}K${currency}`;
    return `${sign}${Math.round(abs)}${currency}`;
}

// ────────────────────────────────────────────────────────────
// Inline-editable pill for recurring transactions
// ────────────────────────────────────────────────────────────
function RecurringPill({ transaction }: { transaction: Transaction }) {
    const { updateTransaction, deleteTransaction, currency } = useFinanceStore();
    const [localLabel, setLocalLabel] = useState(transaction.label);
    const [localAmount, setLocalAmount] = useState(
        transaction.amount === 0 ? '' : (transaction.direction === 'expense' ? -transaction.amount : transaction.amount).toString()
    );
    const [showDelete, setShowDelete] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const labelRef = useRef<HTMLInputElement>(null);
    const amountRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalLabel(transaction.label);
        setLocalAmount(transaction.amount === 0 ? '' : (transaction.direction === 'expense' ? -transaction.amount : transaction.amount).toString());
    }, [transaction.label, transaction.amount, transaction.direction]);

    const scrollIntoView = (el: HTMLElement | null) => {
        if (!el) return;
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    };

    const commitLabel = () => {
        if (localLabel !== transaction.label) updateTransaction(transaction.id, { label: localLabel });
    };
    const commitAmount = () => {
        const val = parseFloat(localAmount) || 0;
        const newAmount = Math.abs(val);
        const newDirection: TransactionDirection = val < 0 ? 'expense' : 'income';
        if (newAmount !== transaction.amount || newDirection !== transaction.direction) {
            updateTransaction(transaction.id, { amount: newAmount, direction: newDirection });
        }
        setLocalAmount(newAmount === 0 ? '' : (newDirection === 'expense' ? -newAmount : newAmount).toString());
    };

    const isIncome = transaction.direction === 'income';

    return (
        <div
            className={clsx(
                'relative flex items-center pl-2 pr-1.5 py-1 rounded-lg border-2 shadow-sm shrink-0',
                isIncome ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            )}
            onTouchStart={() => setShowDelete(false)}
        >
            <input
                ref={labelRef}
                className={clsx(
                    'bg-transparent font-black italic text-xs outline-none border-none p-0 w-[48px] truncate',
                    isIncome ? 'text-emerald-700 placeholder-emerald-400' : 'text-rose-700 placeholder-rose-400'
                )}
                placeholder="Label..."
                value={localLabel}
                autoFocus={transaction.label === ''}
                onChange={e => setLocalLabel(e.target.value)}
                onFocus={e => { scrollIntoView(e.currentTarget); setIsFocused(true); }}
                onBlur={() => { commitLabel(); setIsFocused(false); }}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            />
            <div className="flex items-center ml-1">
                <input
                    ref={amountRef}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    className={clsx(
                        'bg-transparent font-black text-[11px] outline-none border-none p-0 w-10 text-right',
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                    )}
                    value={localAmount}
                    placeholder="0"
                    onChange={e => setLocalAmount(e.target.value)}
                    onFocus={e => { scrollIntoView(e.currentTarget); setIsFocused(true); }}
                    onBlur={() => { commitAmount(); setIsFocused(false); }}
                    onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                />
                <span className={clsx('text-[10px] font-black ml-0.5', isIncome ? 'text-emerald-500' : 'text-rose-500')}>
                    {currency}/m
                </span>
            </div>
            <AnimatePresence mode="wait">
                {(isFocused || isSuccess) ? (
                    <motion.button
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={isSuccess
                            ? { scale: [1, 1.2, 0], opacity: [1, 1, 0], backgroundColor: '#10b981' }
                            : { scale: 1, opacity: 1, backgroundColor: '#18181b' }
                        }
                        transition={isSuccess
                            ? { duration: 0.4 }
                            : { duration: 0.2 }
                        }
                        exit={{ scale: 0, opacity: 0 }}
                        onPointerDown={(e) => {
                            e.preventDefault();
                            setIsSuccess(true);
                            setTimeout(() => {
                                labelRef.current?.blur();
                                amountRef.current?.blur();
                                setIsSuccess(false);
                            }, 400);
                        }}
                        className="ml-1 p-1 text-white rounded-full shadow-lg z-40 active:scale-95 transition-transform"
                    >
                        <Check className="w-3 h-3 stroke-[3px]" />
                    </motion.button>
                ) : (
                    <motion.button
                        key="x"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onPointerDown={e => { e.preventDefault(); setShowDelete(s => !s); }}
                        className="ml-1 p-0.5 opacity-40 active:opacity-80"
                    >
                        <X className="w-3 h-3 text-zinc-500" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDelete && !isFocused && (
                    <motion.button
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        onClick={() => deleteTransaction(transaction.id)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg z-30"
                    >
                        <X className="w-3 h-3 stroke-[3px]" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// Inline-editable one-off pill (per month column)
// Long-press to activate drag, then slide to target month
// ────────────────────────────────────────────────────────────
function OneOffPill({ transaction, months, onTargetMonthChange }: {
    transaction: Transaction;
    months: string[];
    onTargetMonthChange?: (month: string | null) => void;
}) {
    const { updateTransaction, deleteTransaction, currency } = useFinanceStore();
    const [localLabel, setLocalLabel] = useState(transaction.label);
    const [localAmount, setLocalAmount] = useState(
        transaction.direction === 'expense'
            ? (transaction.amount === 0 ? '-' : (-transaction.amount).toString())
            : (transaction.amount === 0 ? '' : transaction.amount.toString())
    );
    const [showDelete, setShowDelete] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isLongPressing, setIsLongPressing] = useState(false);
    const labelRef = useRef<HTMLInputElement>(null);
    const amountRef = useRef<HTMLInputElement>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pointerStart = useRef({ x: 0, y: 0 });
    const pillRef = useRef<HTMLDivElement>(null);
    const motionX = useMotionValue(0);

    const formatAmount = (amount: number, direction: TransactionDirection) =>
        direction === 'expense'
            ? (amount === 0 ? '-' : (-amount).toString())
            : (amount === 0 ? '' : amount.toString());

    useEffect(() => {
        setLocalLabel(transaction.label);
        setLocalAmount(formatAmount(transaction.amount, transaction.direction));
    }, [transaction.label, transaction.amount, transaction.direction]);

    const scrollIntoView = (el: HTMLElement | null) => {
        if (!el) return;
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    };

    const commitLabel = () => {
        if (localLabel !== transaction.label) updateTransaction(transaction.id, { label: localLabel });
    };
    const commitAmount = () => {
        const val = parseFloat(localAmount);
        // Bare '-' or empty or NaN → keep direction, set amount to 0
        if (isNaN(val) || localAmount === '-') {
            setLocalAmount(transaction.direction === 'expense' ? '-' : '');
            return;
        }
        const newAmount = Math.abs(val);
        const newDirection: TransactionDirection = val < 0 ? 'expense' : 'income';
        if (newAmount !== transaction.amount || newDirection !== transaction.direction) {
            updateTransaction(transaction.id, { amount: newAmount, direction: newDirection });
        }
        setLocalAmount(formatAmount(newAmount, newDirection));
    };

    // Use elementsFromPoint (plural) so the pill itself doesn't block column detection
    const getMonthFromPoint = (x: number, y: number): string | null => {
        const els = document.elementsFromPoint(x, y);
        for (const el of els) {
            const month = (el as HTMLElement).closest?.('[data-month]')?.getAttribute('data-month');
            if (month) return month;
        }
        return null;
    };

    const cancelDrag = () => {
        if (longPressTimer.current !== null) clearTimeout(longPressTimer.current);
        setIsLongPressing(false);
        setIsDragActive(false);
        onTargetMonthChange?.(null);
        animate(motionX, 0, { type: 'spring', stiffness: 500, damping: 30 });
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // Don't intercept taps on inputs
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        if (isFocused) return;
        pointerStart.current = { x: e.clientX, y: e.clientY };
        setIsLongPressing(true);
        longPressTimer.current = setTimeout(() => {
            setIsLongPressing(false);
            setIsDragActive(true);
            if (navigator.vibrate) navigator.vibrate(40);
            // capture so pointer move/up fire on this element even outside bounds
            try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
        }, 380);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;
        if (!isDragActive) {
            // Cancel long-press if finger drifts
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                if (longPressTimer.current !== null) clearTimeout(longPressTimer.current);
                setIsLongPressing(false);
            }
            return;
        }
        motionX.set(dx);
        const month = getMonthFromPoint(e.clientX, e.clientY);
        onTargetMonthChange?.(month && month !== transaction.month ? month : null);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (longPressTimer.current !== null) clearTimeout(longPressTimer.current);
        setIsLongPressing(false);
        if (!isDragActive) return;
        onTargetMonthChange?.(null);
        const month = getMonthFromPoint(e.clientX, e.clientY);
        if (month && month !== transaction.month) {
            updateTransaction(transaction.id, { month });
        }
        setIsDragActive(false);
        animate(motionX, 0, { type: 'spring', stiffness: 500, damping: 30 });
    };

    const isIncome = transaction.direction === 'income';

    return (
        <motion.div
            ref={pillRef}
            layout
            animate={{ scale: isDragActive ? 1.12 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={cancelDrag}
            style={{ x: motionX, touchAction: 'none', zIndex: isDragActive ? 50 : 1, cursor: isDragActive ? 'grabbing' : 'default' }}
            className="relative flex flex-row items-center select-none"
        >
            {/* Long-press charging ring */}
            <AnimatePresence>
                {isLongPressing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1.35 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.38 }}
                        className="absolute inset-0 rounded-lg border-2 border-zinc-400 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <div
                className={clsx(
                    'pl-0.5 pr-1.5 py-1.5 rounded-lg shadow-sm flex flex-row items-center gap-0.5 w-[76px] border transition-shadow',
                    isIncome ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100',
                    isDragActive && 'shadow-lg'
                )}
            >
                <GripVertical className={clsx('w-3 h-3 shrink-0 pointer-events-none transition-opacity', isDragActive ? 'opacity-100 text-zinc-600' : 'opacity-40 text-zinc-400')} />
                <div className="flex flex-col items-center flex-1">
                    <input
                        ref={labelRef}
                        className="bg-transparent text-[8px] font-black italic uppercase leading-none mb-0.5 text-zinc-400 text-center w-full outline-none border-none p-0"
                        value={localLabel}
                        placeholder="Extra..."
                        autoFocus={transaction.label === ''}
                        onChange={e => setLocalLabel(e.target.value)}
                        onFocus={e => { scrollIntoView(e.currentTarget); setIsFocused(true); }}
                        onBlur={() => { commitLabel(); setIsFocused(false); }}
                        onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                    />
                    <div className="flex items-center justify-center space-x-0.5">
                        <input
                            ref={amountRef}
                            type="text"
                            inputMode="text"
                            autoComplete="off"
                            className={clsx(
                                'bg-transparent text-[11px] font-black leading-none w-12 text-center outline-none border-none p-0',
                                isIncome ? 'text-emerald-600' : 'text-rose-600'
                            )}
                            value={localAmount}
                            placeholder="0"
                            onChange={e => setLocalAmount(e.target.value)}
                            onFocus={e => { scrollIntoView(e.currentTarget); setIsFocused(true); }}
                            onBlur={() => { commitAmount(); setIsFocused(false); }}
                            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                        />
                        <span className={clsx('text-[9px] font-bold leading-none', isIncome ? 'text-emerald-300' : 'text-rose-300')}>
                            {currency}
                        </span>
                    </div>
                </div>
            </div>
            <AnimatePresence mode="wait">
                {(isFocused || isSuccess) ? (
                    <motion.button
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={isSuccess
                            ? { scale: [1, 1.3, 0], opacity: [1, 1, 0], backgroundColor: '#10b981' }
                            : { scale: 1, opacity: 1, backgroundColor: '#18181b' }
                        }
                        transition={isSuccess ? { duration: 0.4 } : { duration: 0.2 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onPointerDown={(e) => {
                            e.preventDefault();
                            setIsSuccess(true);
                            setTimeout(() => {
                                labelRef.current?.blur();
                                amountRef.current?.blur();
                                setIsSuccess(false);
                            }, 400);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 text-white rounded-full flex items-center justify-center shadow-lg z-40 active:scale-90 transition-transform"
                    >
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </motion.button>
                ) : (
                    <motion.button
                        key="del-trigger"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onPointerDown={e => { e.preventDefault(); setShowDelete(s => !s); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white/80 backdrop-blur-sm border border-zinc-100 rounded-full flex items-center justify-center shadow-sm opacity-40 active:opacity-80"
                    >
                        <X className="w-2.5 h-2.5 text-zinc-500" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDelete && !isFocused && (
                    <motion.button
                        key="del-action"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        onClick={() => deleteTransaction(transaction.id)}
                        className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg z-30"
                    >
                        <X className="w-3 h-3 stroke-[3px]" />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ────────────────────────────────────────────────────────────
// Compact Graph (uses same Recharts approach as desktop)
// ────────────────────────────────────────────────────────────
const Y_AXIS_WIDTH = 44;

function MobileGraph({ height, leftPadding = 0 }: { height: number; leftPadding?: number }) {
    const projection = useProjection();
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    if (projection.length === 0) return null;

    const startBal = projection[0].balance;
    const minBal = projection.reduce((min, p) => p.balance < min ? p.balance : min, projection[0].balance);
    const maxBal = projection.reduce((max, p) => p.balance > max ? p.balance : max, projection[0].balance);
    const range = Math.max(Math.abs(maxBal - minBal), 100);
    const threshold = range * 0.15;

    const yTicks = [startBal];
    if (Math.abs(minBal - startBal) > threshold) yTicks.push(minBal);
    if (Math.abs(maxBal - startBal) > threshold && Math.abs(maxBal - minBal) > threshold) yTicks.push(maxBal);
    // Always show 0 label if range spans zero
    if (minBal < 0 && maxBal > 0 && !yTicks.includes(0)) yTicks.push(0);

    // Gradient for balance line: black above 0, red below
    const lineHasNeg = minBal < 0;
    const lineHasPos = maxBal > 0;
    const zeroStopPct = lineHasNeg && lineHasPos
        ? `${(maxBal / (maxBal - minBal)) * 100}%`
        : lineHasNeg ? '0%' : '100%';
    const lineAboveColor = '#0f172a';
    const lineBelowColor = '#f43f5e';

    return (
        <div className="relative" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={projection.map(p => ({ ...p, expense: -p.expense }))}
                    margin={{ top: 10, right: 0, bottom: 0, left: 0 }}
                    onClick={(e: any) => e?.activePayload && setSelectedMonth(e.activePayload[0].payload.month)}
                >
                    <defs>
                        <linearGradient id="mobileColorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="mobileColorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="mobileBalanceLine" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                            <stop offset={zeroStopPct} stopColor={lineAboveColor} stopOpacity={1} />
                            <stop offset={zeroStopPct} stopColor={lineBelowColor} stopOpacity={1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={false} height={1} />
                    <YAxis
                        orientation="left"
                        axisLine={false}
                        tickLine={false}
                        ticks={yTicks}
                        tickFormatter={val => `${new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(val)}€`}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                        width={44}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                                <div className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl shadow-premium border border-white/40 min-w-[140px] text-xs">
                                    <p className="font-black uppercase tracking-widest text-zinc-400 mb-2 text-[9px]">
                                        {format(parseISO(`${d.month}-01`), 'MMMM yyyy', { locale: fr })}
                                    </p>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between"><span className="text-zinc-400 font-bold">Revenus</span><span className="font-black text-emerald-500">+{d.income}€</span></div>
                                        <div className="flex justify-between"><span className="text-zinc-400 font-bold">Dépenses</span><span className="font-black text-rose-500">-{Math.abs(d.expense)}€</span></div>
                                        <div className="pt-1.5 border-t border-zinc-100 flex justify-between"><span className="font-bold text-zinc-900">Solde</span><span className="font-black text-slate-900">{d.balance}€</span></div>
                                    </div>
                                </div>
                            );
                        }}
                        cursor={false}
                    />
                    <Bar dataKey="income" fill="url(#mobileColorIncome)" radius={[8, 8, 0, 0]} barSize={16} animationDuration={1200} activeBar={false}>
                        {projection.map((e, i) => (
                            <Cell key={i} fill={e.month === selectedMonth ? '#10b981' : 'url(#mobileColorIncome)'} />
                        ))}
                    </Bar>
                    <Bar dataKey="expense" fill="url(#mobileColorExpense)" radius={[12, 12, 0, 0]} barSize={16}>
                        {projection.map((e, i) => (
                            <Cell key={i} fill={e.month === selectedMonth ? '#f43f5e' : 'url(#mobileColorExpense)'} />
                        ))}
                    </Bar>
                    <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="url(#mobileBalanceLine)"
                        strokeWidth={3}
                        dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            const color = payload.balance < 0 ? lineBelowColor : lineAboveColor;
                            return <circle key={`dot-${payload.month}`} cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />;
                        }}
                        activeDot={(props: any) => {
                            const { cx, cy, payload } = props;
                            const color = payload.balance < 0 ? lineBelowColor : lineAboveColor;
                            return <circle key={`adot-${payload.month}`} cx={cx} cy={cy} r={6} fill={color} strokeWidth={0} />;
                        }}
                        animationDuration={1800}
                    />
                    <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="3 3" />
                    <ReferenceLine y={maxBal} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" />
                </ComposedChart>
            </ResponsiveContainer>

            <AnimatePresence>
                {selectedMonth && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-x-3 bottom-3 flex justify-between items-center bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-premium border border-white"
                    >
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400">Mois</span>
                            <span className="text-zinc-900 font-black italic text-sm leading-tight">
                                {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr })}
                            </span>
                        </div>
                        <button onClick={() => setSelectedMonth(null)} className="bg-zinc-900 text-white p-1.5 rounded-xl active:scale-90">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// KPI Section (compact mobile variant)
// ────────────────────────────────────────────────────────────
function MobileKPISection() {
    const projection = useProjection();
    const { startingBalance, setStartingBalance, currency, projectionMonths } = useFinanceStore();
    const { dictionary, locale } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [inputValue, setInputValue] = useState(startingBalance.toString());
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setInputValue(startingBalance.toString()); }, [startingBalance, isEditing]);

    if (projection.length === 0) return null;

    const currentBalance = projection[0].balance;
    const targetBalance = projection[projection.length - 1].balance;

    const fmt = (val: number) => {
        const sign = val < 0 ? '-' : '';
        return `${sign}${new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(val))}${currency}`;
    };

    const submit = () => {
        const val = parseFloat(inputValue);
        if (!isNaN(val)) setStartingBalance(val);
        else setInputValue(startingBalance.toString());
        setIsEditing(false);
    };

    const scrollIntoView = (el: HTMLElement | null) => {
        if (!el) return;
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    };

    return (
        <div className="grid grid-cols-2 gap-1.5 mb-2 px-4 pt-2">
            {/* Editable current balance */}
            <motion.div
                whileHover={{ y: -1 }}
                className="p-2 rounded-2xl border border-white bg-white shadow-soft cursor-pointer min-h-[60px] flex flex-col justify-between"
                onClick={() => !isEditing && setIsEditing(true)}
            >
                <span className="text-zinc-400 font-bold text-[7px] uppercase tracking-widest leading-tight">{dictionary.kpi.currentBalance}</span>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        autoFocus
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onFocus={e => scrollIntoView(e.currentTarget)}
                        onBlur={submit}
                        onKeyDown={e => e.key === 'Enter' && submit()}
                        className="text-sm font-black tracking-tighter text-zinc-900 bg-zinc-50 rounded-lg w-full outline-none p-0.5 border-b-2 border-zinc-900"
                    />
                ) : (
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm font-black tracking-tighter text-zinc-900">{fmt(currentBalance)}</div>
                        <AnimatePresence mode="wait">
                            {(isEditing || isSuccess) ? (
                                <motion.button
                                    key="check-solde"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={isSuccess
                                        ? { scale: [1, 1.2, 0], opacity: [1, 1, 0], backgroundColor: '#10b981' }
                                        : { scale: 1, opacity: 1, backgroundColor: '#18181b' }
                                    }
                                    transition={isSuccess
                                        ? { duration: 0.4 }
                                        : { duration: 0.2 }
                                    }
                                    exit={{ scale: 0, opacity: 0 }}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        setIsSuccess(true);
                                        setTimeout(() => {
                                            submit();
                                            setIsSuccess(false);
                                        }, 400);
                                    }}
                                    className="p-1 text-white rounded-full shadow-lg z-40 active:scale-95 transition-transform"
                                >
                                    <Check className="w-3 h-3 stroke-[3px]" />
                                </motion.button>
                            ) : null}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* Target simulation balance */}
            <div className="p-2 rounded-2xl border border-white bg-white shadow-soft min-h-[60px] flex flex-col justify-between">
                <span className="text-zinc-400 font-bold text-[7px] uppercase tracking-widest leading-tight">
                    {dictionary.kpi.simulation.replace('{months}', projectionMonths.toString())}
                </span>
                <div className="text-sm font-black tracking-tighter text-zinc-900">{fmt(targetBalance)}</div>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────
export default function DashboardMobilePage() {
    const {
        transactions, currency, textSize,
        startingBalance, startingMonth,
        loadProject, projectionMonths, title,
        undo, redo, undoStack, redoStack
    } = useFinanceStore();

    const { dictionary, locale } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isShared, setIsShared] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [dragTargetMonth, setDragTargetMonth] = useState<string | null>(null);

    // Editor bottom sheet
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addMonth, setAddMonth] = useState<string | undefined>();
    const [addRecurrence, setAddRecurrence] = useState<'monthly' | 'none'>('none');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const months = Array.from({ length: projectionMonths }).map((_, i) => {
        const date = addMonths(parseISO(`${startingMonth}-01`), i);
        return format(date, 'yyyy-MM');
    });

    const oneOffTransactions = transactions.filter(t => t.recurrence === 'none');
    const recurringTransactions = transactions.filter(t => t.recurrence !== 'none');

    useEffect(() => {
        const sharedData = searchParams.get('data');
        if (sharedData) {
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(sharedData)));
                loadProject(decoded);
                router.replace(`/${locale}/mobile`);
            } catch { }
        }
    }, [searchParams, loadProject, router, locale]);

    // Undo/Redo keyboard
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) { if (redoStack.length > 0) redo(); }
                else { if (undoStack.length > 0) undo(); }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [undo, redo, undoStack.length, redoStack.length]);

    const handleShare = async () => {
        const state = { transactions, startingBalance, startingMonth, currency, textSize, projectionMonths };
        const encoded = btoa(encodeURIComponent(JSON.stringify(state)));
        const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Ma simulation PLANIF', url });
                setIsShared(true);
                setTimeout(() => setIsShared(false), 2000);
            } catch { /* user cancelled */ }
        } else {
            navigator.clipboard.writeText(url).then(() => {
                setIsShared(true);
                setTimeout(() => setIsShared(false), 2000);
            });
        }
    };

    const handleOpenEditor = (tx?: Transaction, month?: string, recurrence: 'monthly' | 'none' = 'none') => {
        if (tx) { setSelectedTransaction(tx); setIsAdding(false); }
        else { setSelectedTransaction(null); setAddMonth(month); setAddRecurrence(recurrence); setIsAdding(true); }
        setIsEditorOpen(true);
    };

    const TOTAL_WIDTH = LABEL_WIDTH + projectionMonths * MOBILE_COL;

    return (
        <div className={clsx(
            'min-h-screen bg-zinc-50/50 flex flex-col overflow-hidden relative font-sans transition-all duration-500',
            textSize === 'small' && 'scale-[0.98]',
            textSize === 'large' && 'scale-[1.02]'
        )}>
            {/* ── Header ── */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-white/85 backdrop-blur-xl z-50 border-b border-zinc-100 px-4 flex items-center justify-between">
                {/* Left: logo + planification */}
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1.5">
                        <Image
                            src="/images/favicon.png"
                            alt="Planif.app"
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-xl shadow-premium"
                        />
                    </div>

                    {/* Title pill */}
                    <div className="flex items-center px-2.5 py-1 rounded-xl border bg-zinc-50 border-zinc-100">
                        <span className="truncate max-w-[120px] text-[10px] font-black uppercase tracking-wider text-zinc-600">{title}</span>
                    </div>
                </div>

                {/* Right: undo/redo + share + settings + profile */}
                <div className="flex items-center space-x-1.5">
                    {/* Undo / Redo */}
                    <div className="flex items-center bg-zinc-50 border border-zinc-100 rounded-xl p-0.5 space-x-0.5">
                        <button onClick={() => undo()} disabled={undoStack.length === 0}
                            className={clsx('p-1.5 rounded-lg transition-all', undoStack.length === 0 ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-600 hover:bg-zinc-200 active:scale-95')}>
                            <Undo2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px h-3 bg-zinc-200" />
                        <button onClick={() => redo()} disabled={redoStack.length === 0}
                            className={clsx('p-1.5 rounded-lg transition-all', redoStack.length === 0 ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-600 hover:bg-zinc-200 active:scale-95')}>
                            <Redo2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Share */}
                    <button
                        onClick={handleShare}
                        className={clsx('w-9 h-9 border rounded-xl flex items-center justify-center shadow-soft active:scale-95 transition-all',
                            isShared ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-zinc-100'
                        )}
                    >
                        {isShared
                            ? <Check className="w-4 h-4 text-emerald-500" />
                            : <Share2 className="w-4 h-4 text-zinc-400" />
                        }
                    </button>

                    {/* Settings */}
                    <button onClick={() => setIsSettingsModalOpen(true)} className="w-9 h-9 bg-white border border-zinc-100 rounded-xl flex items-center justify-center shadow-soft active:scale-95 group">
                        <Settings className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                    </button>

                </div>
            </header>

            {/* ── Main scroll area ── */}
            <main className="flex-1 overflow-y-auto pt-14 pb-8 no-scrollbar">

                {/* KPI section */}
                <MobileKPISection />

                {/* Horizontally scrollable: months axis + graph + extras */}
                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto no-scrollbar pb-4"
                >
                    <div style={{ minWidth: `${TOTAL_WIDTH}px` }} className="flex flex-col space-y-0 relative">

                        {/* Months axis — alternating backgrounds */}
                        <div className="flex border-b border-zinc-200 pb-2 pt-1 sticky top-0 z-20 backdrop-blur-md" style={{ backgroundColor: 'rgba(249,249,251,0.95)' }}>
                            <div style={{ width: LABEL_WIDTH }} className="flex-shrink-0 px-2 font-black text-[8px] uppercase tracking-widest text-zinc-400 flex items-end justify-start">
                                Mois
                            </div>
                            <div className="flex flex-1">
                                {months.map((m, i) => (
                                    <div
                                        key={m}
                                        style={{ width: MOBILE_COL, minWidth: MOBILE_COL }}
                                        className={clsx(
                                            'text-center font-black italic text-[9px] text-zinc-400 capitalize shrink-0',
                                            i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9fb]'
                                        )}
                                    >
                                        {format(parseISO(`${m}-01`), 'MMM yy', { locale: fr })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Graph with alternating column stripes behind it */}
                        <motion.div
                            animate={{ height: showDetails ? 240 : 400 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                            className="relative rounded-[24px] mx-0 my-0 overflow-hidden"
                        >
                            {/* Alternating column background stripes */}
                            <div className="absolute inset-0 flex pointer-events-none z-0" style={{ paddingLeft: LABEL_WIDTH }}>
                                {months.map((m, i) => (
                                    <div
                                        key={m}
                                        style={{ width: MOBILE_COL, minWidth: MOBILE_COL }}
                                        className={clsx('shrink-0 h-full', i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9fb]')}
                                    />
                                ))}
                            </div>
                            <div className="relative z-10 h-full">
                                <MobileGraph height={showDetails ? 240 : 400} leftPadding={LABEL_WIDTH} />
                            </div>
                        </motion.div>

                        {/* Extras + CHAQUE MOIS — hidden/shown via AnimatePresence */}
                        <AnimatePresence>
                            {showDetails && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    {/* ── Extras (one-off) ── */}
                                    <div className="flex border-t border-zinc-100">
                                        <div style={{ width: LABEL_WIDTH }} className="flex-shrink-0 sticky left-0 bg-zinc-50/95 backdrop-blur-md z-10 px-1.5 pt-2">
                                            <span className="text-[7px] uppercase font-black tracking-widest text-zinc-500">Extras</span>
                                        </div>
                                        <div className="flex flex-1">
                                            {months.map((m, i) => {
                                                const monthOneOffs = oneOffTransactions.filter(t => t.month === m);
                                                const isDropTarget = dragTargetMonth === m;
                                                return (
                                                    <div
                                                        key={m}
                                                        data-month={m}
                                                        style={{ width: MOBILE_COL, minWidth: MOBILE_COL }}
                                                        className={clsx(
                                                            'flex flex-col items-center justify-start py-2 space-y-1.5 border-l border-zinc-100 border-dashed min-h-[90px] transition-colors',
                                                            isDropTarget
                                                                ? 'bg-blue-50 ring-2 ring-inset ring-blue-300'
                                                                : i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9fb]'
                                                        )}
                                                    >
                                                        {monthOneOffs.map(t => (
                                                            <OneOffPill
                                                                key={t.id}
                                                                transaction={t}
                                                                months={months}
                                                                onTargetMonthChange={setDragTargetMonth}
                                                            />
                                                        ))}
                                                        <button
                                                            onClick={() => handleOpenEditor(undefined, m, 'none')}
                                                            className="w-10 h-8 rounded-lg border-2 border-dashed border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all flex items-center justify-center"
                                                        >
                                                            <Plus className="w-3 h-3 text-zinc-400" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ── Chaque mois (recurring) ── */}
                                    <div className="flex items-start py-2 border-t border-zinc-100">
                                        <div style={{ width: LABEL_WIDTH, lineHeight: 1 }} className="flex-shrink-0 sticky left-0 bg-zinc-50/95 backdrop-blur-md z-10 px-1.5 pt-1">
                                            <span className="text-[7px] uppercase font-black tracking-widest text-zinc-500">Chaque mois</span>
                                        </div>
                                        <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap px-1.5 flex-1 py-1">
                                            {recurringTransactions.map(tx => (
                                                <RecurringPill key={tx.id} transaction={tx} />
                                            ))}
                                            <button
                                                onClick={() => handleOpenEditor(undefined, undefined, 'monthly')}
                                                className="h-7 w-7 rounded-lg border-2 border-dashed border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all flex items-center justify-center shrink-0"
                                            >
                                                <Plus className="w-3.5 h-3.5 text-zinc-400" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Toggle button — at the very bottom */}
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="mx-4 my-2 flex items-center space-x-1.5 px-3 py-1.5 bg-white rounded-xl shadow-soft border border-zinc-100 group transition-all active:scale-95 self-start"
                        >
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                {showDetails ? 'Masquer' : 'Editer entrées / sorties'}
                            </span>
                            <motion.div animate={{ rotate: showDetails ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900" />
                            </motion.div>
                        </button>

                    </div>
                </div>
            </main>

            {/* -- Bottom Sheet: NEW transaction (sentence style) -- */}
            <BottomSheet isOpen={isEditorOpen && isAdding} onClose={() => setIsEditorOpen(false)}>
                {isEditorOpen && isAdding && (
                    <SentenceTransactionEditor
                        recurrence={addRecurrence}
                        month={addMonth}
                        onClose={() => setIsEditorOpen(false)}
                    />
                )}
            </BottomSheet>

            {/* -- Bottom Sheet: EDIT existing transaction -- */}
            <BottomSheet isOpen={isEditorOpen && !isAdding} onClose={() => setIsEditorOpen(false)}>
                {isEditorOpen && !isAdding && (
                    <MobileTransactionEditor
                        onClose={() => setIsEditorOpen(false)}
                        initialData={selectedTransaction}
                    />
                )}
            </BottomSheet>

            {/* -- Modals -- */}
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
        </div>
    );
}
