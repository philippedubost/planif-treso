'use client';

import { useFinanceStore } from '@/store/useFinanceStore';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export function KPISection() {
    const projection = useFinanceStore((state) => state.getProjection());

    if (projection.length === 0) return null;

    const currentBalance = projection[0].balance;
    const targetBalance = projection[projection.length - 1].balance;
    const balances = projection.map(p => p.balance);
    const minBalance = Math.min(...balances);
    const isRisk = minBalance < 0;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <KPICard
                label="Balance Today"
                value={formatCurrency(currentBalance)}
                icon={<TrendingUp className="text-emerald-500" />}
            />
            <KPICard
                label="In 12 Months"
                value={formatCurrency(targetBalance)}
                icon={targetBalance >= currentBalance ? <TrendingUp className="text-emerald-500" /> : <TrendingDown className="text-amber-500" />}
            />
            <KPICard
                label="Lowest Point"
                value={formatCurrency(minBalance)}
                status={isRisk ? 'risk' : 'safe'}
                icon={<AlertCircle className={clsx(isRisk ? "text-rose-500" : "text-emerald-500")} />}
            />
        </div>
    );
}

function KPICard({ label, value, icon, status }: { label: string; value: string; icon: React.ReactNode; status?: 'risk' | 'safe' }) {
    return (
        <div className={clsx(
            "p-5 rounded-[24px] border transition-all duration-300",
            status === 'risk' ? "bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30" : "bg-white border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800"
        )}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium text-sm uppercase tracking-wider">{label}</span>
                {icon}
            </div>
            <div className={clsx(
                "text-2xl font-bold font-mono tracking-tight",
                status === 'risk' ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"
            )}>
                {value}
            </div>
        </div>
    );
}
