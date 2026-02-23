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
import { useFinanceStore } from '@/store/useFinanceStore';
import { MonthData } from '@/lib/financeEngine';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

export function CashflowGraph() {
    const projection = useFinanceStore((state) => state.getProjection());
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const formatMonth = (monthStr: string) => {
        return format(parseISO(`${monthStr}-01`), 'MMM', { locale: fr });
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(val);

    if (projection.length === 0) return <div className="h-[300px] flex items-center justify-center text-zinc-400">No data</div>;

    const handleBarClick = (data: any) => {
        setSelectedMonth(data.month);
    };

    return (
        <div className="w-full h-[400px] bg-white rounded-[40px] p-6 shadow-soft relative select-none touch-none overflow-hidden group">
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
                        className="absolute inset-x-6 bottom-6 flex justify-between items-center glass p-4 rounded-3xl shadow-premium border-none"
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Selected Month</span>
                            <span className="text-zinc-900 font-black italic">{format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr })}</span>
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

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900/90 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white/10 min-w-[180px]"
            >
                <p className="text-zinc-400 text-[10px] uppercase font-black tracking-tighter mb-4">{format(parseISO(`${label}-01`), 'MMMM yyyy', { locale: fr })}</p>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs font-bold">Income</span>
                        <span className="text-amber-400 font-black tracking-tight">+{data.income}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs font-bold">Expense</span>
                        <span className="text-blue-400 font-black tracking-tight">-{data.expense}€</span>
                    </div>
                    <div className="h-[1px] bg-white/10 my-2" />
                    <div className="flex justify-between items-center">
                        <span className="text-white text-xs font-black italic">Balance</span>
                        <span className="text-emerald-400 font-black text-lg tracking-tighter">{data.balance}€</span>
                    </div>
                </div>
            </motion.div>
        );
    }
    return null;
};
