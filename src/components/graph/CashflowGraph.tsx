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

export function CashflowGraph() {
    const projection = useFinanceStore((state) => state.getProjection());
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [dragInfo, setDragInfo] = useState<{ month: string; type: 'income' | 'expense'; initialValue: number; currentValue: number } | null>(null);

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
        <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-[32px] p-4 relative select-none touch-none">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={projection}
                    margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                    onClick={(e: any) => e && e.activePayload && handleBarClick(e.activePayload[0].payload)}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="month"
                        tickFormatter={formatMonth}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatCurrency}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    />
                    <Bar
                        dataKey="income"
                        fill="#fbbf24"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    >
                        {projection.map((entry, index) => (
                            <Cell
                                key={`cell-income-${index}`}
                                fill={entry.month === selectedMonth ? '#f59e0b' : '#fbbf24'}
                                className="cursor-pointer"
                            />
                        ))}
                    </Bar>
                    <Bar
                        dataKey="expense"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    >
                        {projection.map((entry, index) => (
                            <Cell
                                key={`cell-expense-${index}`}
                                fill={entry.month === selectedMonth ? '#2563eb' : '#3b82f6'}
                                className="cursor-pointer"
                            />
                        ))}
                    </Bar>
                    <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                    />
                    <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                </ComposedChart>
            </ResponsiveContainer>

            {selectedMonth && (
                <div className="absolute inset-x-4 bottom-4 flex justify-between items-center bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl animate-in slide-in-from-bottom-4 duration-300">
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">Month: {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr })}</span>
                    <button
                        onClick={() => setSelectedMonth(null)}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-700 min-w-[150px]">
                <p className="text-zinc-400 text-xs uppercase font-bold mb-2">{format(parseISO(`${label}-01`), 'MMMM yyyy', { locale: fr })}</p>
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-emerald-500 font-medium">
                        <span>Income</span>
                        <span>+{data.income}€</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-500 font-medium">
                        <span>Expense</span>
                        <span>-{data.expense}€</span>
                    </div>
                    <hr className="my-1 border-zinc-100 dark:border-zinc-700" />
                    <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-100 font-bold">
                        <span>Balance</span>
                        <span>{data.balance}€</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};
