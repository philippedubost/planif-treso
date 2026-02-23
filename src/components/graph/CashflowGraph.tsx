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

export function CashflowGraph({ width, height = 280 }: { width?: number, height?: number }) {
    const projection = useProjection(24);
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

    return (
        <div
            className="bg-white/70 backdrop-blur-sm rounded-[40px] p-6 shadow-soft relative select-none touch-none overflow-visible group border border-white"
            style={{ width: width ? `${width}px` : '100%', height: `${height}px` }}
        >
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={projection}
                    margin={{ top: 20, right: 10, bottom: 20, left: -20 }}
                    onClick={(e: any) => e && e.activePayload && handleBarClick(e.activePayload[0].payload)}
                >
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="month"
                        tickFormatter={formatMonth}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatCurrency}
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
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
                                fill={entry.month === selectedMonth ? '#fbbf24' : 'url(#colorIncome)'}
                                className="cursor-pointer transition-all duration-300"
                            />
                        ))}
                    </Bar>
                    <Bar
                        dataKey="expense"
                        fill="url(#colorExpense)"
                        radius={[10, 10, 0, 0]}
                        barSize={24}
                        animationDuration={1500}
                    >
                        {projection.map((entry, index) => (
                            <Cell
                                key={`cell-expense-${index}`}
                                fill={entry.month === selectedMonth ? '#3b82f6' : 'url(#colorExpense)'}
                                className="cursor-pointer transition-all duration-300"
                            />
                        ))}
                    </Bar>
                    <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#10b981"
                        strokeWidth={4}
                        dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                        animationDuration={2000}
                    />
                    <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="3 3" />
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
                        <span className="text-sm font-black text-amber-500">+{data.income}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-400">Dépenses</span>
                        <span className="text-sm font-black text-zinc-900">-{data.expense}€</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-900">Solde Projeté</span>
                        <span className="text-lg font-black text-emerald-500 tracking-tighter">{data.balance}€</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};
