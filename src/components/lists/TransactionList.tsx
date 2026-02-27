'use client';

import { useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Transaction } from '@/lib/financeEngine';
import { Search, Plus, Trash2, Edit2, Repeat, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export function TransactionList() {
    const { transactions, updateTransaction, deleteTransaction, categories, currency } = useFinanceStore();
    const [search, setSearch] = useState('');
    const [editingTxId, setEditingTxId] = useState<string | null>(null);

    // State for inline edit
    const [editLabel, setEditLabel] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editDirection, setEditDirection] = useState<'income' | 'expense'>('expense');

    const startEditing = (tx: Transaction) => {
        setEditingTxId(tx.id);
        setEditLabel(tx.label);
        setEditAmount(tx.amount.toString());
        setEditDirection(tx.direction);
    };

    const saveEdit = (id: string) => {
        const val = parseFloat(editAmount) || 0;
        if (val > 0 && editLabel.trim()) {
            updateTransaction(id, { label: editLabel.trim(), amount: val, direction: editDirection });
        }
        setEditingTxId(null);
    };

    const filteredTransactions = transactions.filter(t =>
        t.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-8 pb-4 flex items-center space-x-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                    <input
                        type="text"
                        placeholder="Rechercher une recette ou dépense..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm font-bold text-zinc-900 placeholder:text-zinc-300"
                    />
                </div>
                {!useFinanceStore.getState().user && (
                    <div className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black italic text-zinc-900 leading-none">{transactions.length}/8</span>
                        <span className="text-[7px] font-bold text-zinc-300 uppercase tracking-tighter">Opérations</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-32 no-scrollbar">
                {filteredTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div
                            className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6"
                        >
                            <Search className="w-8 h-8 text-zinc-100" />
                        </div>
                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mb-2">Aucun mouvement trouvé</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTransactions.map((tx, i) => {
                            const category = categories.find(c => c.id === tx.categoryId);
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={tx.id}
                                    layout
                                    className="group flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 bg-white border border-zinc-50 rounded-[28px] sm:rounded-[32px] shadow-soft hover:shadow-premium transition-all relative overflow-hidden"
                                >
                                    {editingTxId === tx.id ? (
                                        <div className="flex items-center justify-between w-full space-x-3">
                                            <div className="flex-1 flex flex-col space-y-2">
                                                <input
                                                    type="text"
                                                    value={editLabel}
                                                    onChange={e => setEditLabel(e.target.value)}
                                                    className="w-full text-base font-black italic border-none bg-zinc-50 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-zinc-200"
                                                    placeholder="Nom"
                                                    autoFocus
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => setEditDirection(d => d === 'income' ? 'expense' : 'income')}
                                                        className={clsx("w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-white active:scale-95 transition-all outline-none", editDirection === 'income' ? "bg-emerald-500" : "bg-rose-500")}
                                                    >
                                                        {editDirection === 'income' ? '+' : '-'}
                                                    </button>
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="number"
                                                            value={editAmount}
                                                            onChange={e => setEditAmount(e.target.value)}
                                                            className={clsx("w-full text-base font-black italic border-none bg-zinc-50 rounded-xl pl-3 pr-8 py-2.5 outline-none focus:ring-2", editDirection === 'income' ? "focus:ring-emerald-200 text-emerald-600" : "focus:ring-rose-200 text-rose-600")}
                                                            placeholder="Montant"
                                                            onKeyDown={e => e.key === 'Enter' && saveEdit(tx.id)}
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-zinc-400 pointer-events-none">{currency}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col space-y-2 shrink-0">
                                                <button
                                                    onClick={() => saveEdit(tx.id)}
                                                    className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-premium active:scale-95 transition-transform"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingTxId(null)}
                                                    className="w-12 h-8 bg-zinc-100 text-zinc-400 rounded-xl flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: category?.color || '#eee' }} />

                                            <div className="flex items-center space-x-4 w-full sm:w-auto mb-2 sm:mb-0">
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl sm:rounded-3xl flex items-center justify-center font-black text-xl sm:text-2xl italic" style={{ backgroundColor: `${category?.color}15`, color: category?.color }}>
                                                    {tx.label.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-black text-zinc-900 italic tracking-tight text-base sm:text-lg leading-none mb-1 truncate">{tx.label}</h3>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">{category?.label || 'Autre'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-6 pl-16 sm:pl-0">
                                                <div className="text-left sm:text-right">
                                                    <p className={clsx(
                                                        "text-lg sm:text-xl font-black tracking-tighter italic leading-none",
                                                        tx.direction === 'income' ? "text-emerald-500" : "text-rose-500"
                                                    )}>
                                                        {tx.direction === 'income' ? '+' : '-'}{tx.amount}{currency}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mt-1">
                                                        {tx.recurrence !== 'none' ? 'Récurrent' : 'Unique'}
                                                    </p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => startEditing(tx)}
                                                        className="p-2 sm:p-3 bg-zinc-50 rounded-xl sm:rounded-2xl text-zinc-400 transition-colors hover:text-zinc-900 hover:bg-zinc-100 active:scale-95"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTransaction(tx.id)}
                                                        className="p-2 sm:p-3 bg-rose-50 rounded-xl sm:rounded-2xl text-rose-400 hover:text-white hover:bg-rose-500 transition-colors active:scale-95"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
