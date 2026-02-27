'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { MonthData } from '@/lib/financeEngine';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { clsx } from 'clsx';

export function CashflowGraph({ width, height = 280, leftPadding = 0 }: { width?: number, height?: number, leftPadding?: number }) {
    const projection = useProjection();
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const formatMonth = (monthStr: string) => {
        return format(parseISO(`${monthStr}-01`), 'MMM', { locale: fr });
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(val);

    if (projection.length === 0) return <div className="h-[300px] flex items-center justify-center text-zinc-400 font-bold italic">Aucune donnée</div>;

    const handleBarClick = (data: any) => {
        setSelectedMonth(data.month);
    };

    // Calculate key balance points for Y-Axis
    const startBal = projection[0].balance;
    const minBal = projection.reduce((min, p) => p.balance < min ? p.balance : min, projection[0].balance);
    const maxBal = projection.reduce((max, p) => p.balance > max ? p.balance : max, projection[0].balance);

    // Range for threshold calculation (e.g., 10% of range)
    const range = Math.max(Math.abs(maxBal - minBal), 100);
    const threshold = range * 0.15;

    const yTicks = [startBal];
    if (Math.abs(minBal - startBal) > threshold) yTicks.push(minBal);
    if (Math.abs(maxBal - startBal) > threshold && Math.abs(maxBal - minBal) > threshold) yTicks.push(maxBal);

    return (
        <div
            className="bg-white/70 backdrop-blur-sm rounded-[32px] md:rounded-[40px] py-4 md:py-6 px-0 shadow-soft relative select-none touch-none overflow-visible group border border-white w-full"
            style={{ height: height ? `${height}px` : (window.innerWidth < 768 ? '320px' : '480px') }}
        >
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={projection.map(p => ({ ...p, expenseRaw: p.expense, expense: -p.expense }))}
                    margin={{ top: 20, right: 0, bottom: 0, left: leftPadding ? leftPadding - 60 : 0 }}
                    onClick={(e: any) => e && e.activePayload && handleBarClick(e.activePayload[0].payload)}
                >
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.8} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={false}
                        interval={0}
                        height={1}
                        padding={{ left: 0, right: 0 }}
                    />
                    <YAxis
                        orientation="left"
                        axisLine={false}
                        tickLine={false}
                        ticks={yTicks}
                        tickFormatter={(val) => `${new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(val)}€`}
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 800 }}
                        width={60}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: '#f8fafc', radius: 20 }}
                    />
                    <Bar
                        dataKey="income"
                        fill="url(#colorIncome)"
                        radius={[10, 10, 0, 0]}
                        barSize={24}
                        animationDuration={1500}
                    >
                        {projection.map((entry, index) => (
                            <Cell
                                key={`cell-income-${index}`}
                                fill={entry.month === selectedMonth ? '#10b981' : 'url(#colorIncome)'}
                                className="cursor-pointer transition-all duration-300"
                            />
                        ))}
                    </Bar>
                    <Bar
                        dataKey="expense"
                        fill="url(#colorExpense)"
                        radius={[15, 15, 0, 0]}
                        barSize={24}
                        animationDuration={1500}
                    >
                        {projection.map((entry, index) => (
                            <Cell
                                key={`cell-expense-${index}`}
                                fill={entry.month === selectedMonth ? '#f43f5e' : 'url(#colorExpense)'}
                                className="cursor-pointer transition-all duration-300"
                            />
                        ))}
                    </Bar>
                    <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#0f172a"
                        strokeWidth={4}
                        dot={{ r: 6, fill: '#0f172a', strokeWidth: 3, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                        animationDuration={2000}
                    />
                    <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="3 3" />
                    <ReferenceLine y={maxBal} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" />

                </ComposedChart>
            </ResponsiveContainer>

            <AnimatePresence>
                {selectedMonth && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-x-6 bottom-6 flex justify-between items-center glass p-6 rounded-[32px] shadow-premium border-none"
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Mois sélectionné</span>
                            <span className="text-zinc-900 font-black italic text-lg leading-tight">{format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr })}</span>
                        </div>
                        <button
                            onClick={() => setSelectedMonth(null)}
                            className="bg-zinc-900 text-white p-2 rounded-xl active:scale-90 transition-transform"
                        >
                            <Plus className="w-4 h-4 rotate-45" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[32px] shadow-premium border border-white/40 min-w-[200px]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">
                    {format(parseISO(`${data.month}-01`), 'MMMM yyyy', { locale: fr })}
                </p>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-400">Revenus</span>
                        <span className="text-sm font-black text-emerald-500">+{data.income}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-400">Dépenses</span>
                        <span className="text-sm font-black text-rose-500">-{Math.abs(data.expense)}€</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-900">Solde Projeté</span>
                        <span className="text-lg font-black text-slate-900 tracking-tighter">{data.balance}€</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};
