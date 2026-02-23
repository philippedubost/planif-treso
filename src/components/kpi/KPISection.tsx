'use client';

import { useFinanceStore, useProjection } from '@/store/useFinanceStore';
import { clsx } from 'clsx';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function KPISection() {
    const projection = useProjection();

    if (projection.length === 0) return null;

    const currentBalance = projection[0].balance;
    const targetBalance = projection[projection.length - 1].balance;
    const balances = projection.map(p => p.balance);
    const minBalance = Math.min(...balances);
    const isRisk = minBalance < 0;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <KPICard
                label="Solde Actuel"
                value={formatCurrency(currentBalance)}
                icon={<Wallet className="text-zinc-400" />}
            />
            <KPICard
                label="Solde à +12 mois"
                value={formatCurrency(targetBalance)}
                icon={<TrendingUp className="text-amber-500" />}
            />
            <KPICard
                label="Point Bas (Risque)"
                value={formatCurrency(minBalance)}
                status={isRisk ? 'risk' : 'safe'}
                icon={<AlertTriangle className={minBalance < 0 ? "text-rose-500" : "text-zinc-200"} />}
            />
        </div>
    );
}

function KPICard({ label, value, icon, status }: { label: string; value: string; icon: React.ReactNode; status?: 'risk' | 'safe' }) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className={clsx(
                "p-6 rounded-3xl border shadow-soft transition-all duration-300 relative overflow-hidden group",
                status === 'risk' ? "bg-rose-50/50 border-rose-100" : "bg-white border-white"
            )}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {icon}
            </div>
            <div className="flex justify-between items-start mb-4">
                <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">{label}</span>
            </div>
            <div className={clsx(
                "text-3xl font-black tracking-tighter leading-none",
                status === 'risk' ? "text-rose-600" : "text-zinc-900"
            )}>
                {value}
            </div>
        </motion.div>
    );
}
