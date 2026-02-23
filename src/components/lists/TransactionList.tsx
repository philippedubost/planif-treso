'use client';

import { useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Transaction } from '@/lib/financeEngine';
import { Search, Plus, Trash2, Edit2, Repeat } from 'lucide-react';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { TransactionEditor } from './TransactionEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export function TransactionList() {
    const { transactions, deleteTransaction, categories, currency } = useFinanceStore();
    const [search, setSearch] = useState('');
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
                        placeholder="Rechercher un flux..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm font-bold text-zinc-900 placeholder:text-zinc-300"
                    />
                </div>
                {!useFinanceStore.getState().user && (
                    <div className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black italic text-zinc-900 leading-none">{transactions.length}/8</span>
                        <span className="text-[7px] font-bold text-zinc-300 uppercase tracking-tighter">FLUX</span>
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
                                    className="group flex items-center justify-between p-5 bg-white border border-zinc-50 rounded-[32px] shadow-soft hover:shadow-premium transition-all active:scale-[0.98] relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: category?.color || '#eee' }} />

                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 rounded-3xl flex items-center justify-center font-black text-2xl italic" style={{ backgroundColor: `${category?.color}15`, color: category?.color }}>
                                            {tx.label.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-zinc-900 italic tracking-tight text-lg leading-none mb-1">{tx.label}</h3>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{category?.label || 'Autre'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6">
                                        <div className="text-right">
                                            <p className={clsx(
                                                "text-xl font-black tracking-tighter italic leading-none",
                                                tx.direction === 'income' ? "text-emerald-500" : "text-rose-500"
                                            )}>
                                                {tx.direction === 'income' ? '+' : '-'}{tx.amount}{currency}
                                            </p>
                                            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mt-1">
                                                {tx.recurrence !== 'none' ? 'Récurrent' : 'Unique'}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingTransaction(tx)}
                                                className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 transition-colors hover:text-zinc-900"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteTransaction(tx.id)}
                                                className="p-3 bg-rose-50 rounded-2xl text-zinc-400 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <BottomSheet
                isOpen={!!editingTransaction}
                onClose={() => {
                    setEditingTransaction(null);
                }}
                title="Modifier le flux"
            >
                <TransactionEditor
                    onClose={() => {
                        setEditingTransaction(null);
                    }}
                    initialData={editingTransaction}
                />
            </BottomSheet>
        </div>
    );
}
