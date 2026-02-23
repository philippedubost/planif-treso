'use client';

import { useState, useEffect } from 'react';
import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { clsx } from 'clsx';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function KPISection() {
    const projection = useProjection();
    const { startingBalance, setStartingBalance, currency } = useFinanceStore();
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(startingBalance.toString());

    useEffect(() => {
        setInputValue(startingBalance.toString());
    }, [startingBalance, isEditing]);

    if (projection.length === 0) return null;

    const currentBalance = projection[0].balance;
    const targetBalance = projection[projection.length - 1].balance;
    const balances = projection.map(p => p.balance);
    const minBalance = Math.min(...balances);
    const isRisk = minBalance < 0;

    const formatCurrency = (val: number) => {
        const sign = val < 0 ? '-' : '';
        const absVal = Math.abs(val);
        const formatted = new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(absVal);
        return `${sign}${formatted}${currency}`;
    };

    const handleBalanceSubmit = () => {
        const val = parseFloat(inputValue);
        if (!isNaN(val)) {
            setStartingBalance(val);
        } else {
            setInputValue(startingBalance.toString());
        }
        setIsEditing(false);
    };

    return (
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
            <motion.div
                whileHover={{ y: -2, scale: 1.01 }}
                className="p-3 md:p-4 rounded-2xl md:rounded-3xl border border-white bg-white shadow-soft transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[100px] flex flex-col justify-between"
                onClick={() => !isEditing && setIsEditing(true)}
            >
                <div className="absolute top-0 right-0 p-2 md:p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wallet className="text-zinc-400 w-3 h-3 md:w-4 md:h-4" />
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-zinc-400 font-bold text-[7px] md:text-[9px] uppercase tracking-widest leading-tight">Solde Actuel</span>
                </div>
                {isEditing ? (
                    <div className="flex items-center">
                        <input
                            autoFocus
                            type="number"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onBlur={handleBalanceSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleBalanceSubmit()}
                            className="text-sm md:text-2xl font-black tracking-tighter leading-none text-zinc-900 bg-zinc-50 rounded-lg w-full outline-none p-1 border-b-2 border-zinc-900"
                        />
                    </div>
                ) : (
                    <div className="text-sm md:text-2xl font-black tracking-tighter leading-none text-zinc-900 group-hover:text-zinc-500 transition-colors flex items-center">
                        {formatCurrency(currentBalance)}
                    </div>
                )}
            </motion.div>
            <KPICard
                label="Simulation +24m"
                value={formatCurrency(targetBalance)}
                icon={<TrendingUp className="text-emerald-500 w-3 h-3 md:w-4 md:h-4" />}
            />
            <KPICard
                label="Point Bas (Risque)"
                value={formatCurrency(minBalance)}
                status={isRisk ? 'risk' : 'safe'}
                icon={<AlertTriangle className={minBalance < 0 ? "text-rose-500 w-3 h-3 md:w-4 md:h-4" : "text-zinc-200 w-3 h-3 md:w-4 md:h-4"} />}
            />
        </div>
    );
}

function KPICard({ label, value, icon, status }: { label: string; value: string; icon: React.ReactNode; status?: 'risk' | 'safe' }) {
    return (
        <motion.div
            whileHover={{ y: -2, scale: 1.01 }}
            className={clsx(
                "p-3 md:p-4 rounded-2xl md:rounded-3xl border shadow-soft transition-all duration-300 relative overflow-hidden group min-h-[100px] flex flex-col justify-between",
                status === 'risk' ? "bg-rose-50/50 border-rose-100" : "bg-white border-white"
            )}
        >
            <div className="absolute top-0 right-0 p-2 md:p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                {icon}
            </div>
            <div className="flex justify-between items-start">
                <span className="text-zinc-400 font-bold text-[7px] md:text-[9px] uppercase tracking-widest leading-tight">{label}</span>
            </div>
            <div className={clsx(
                "text-sm md:text-2xl font-black tracking-tighter leading-none",
                status === 'risk' ? "text-rose-600" : "text-zinc-900"
            )}>
                {value}
            </div>
        </motion.div>
    );
}
