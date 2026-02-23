'use client';

import { useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Transaction } from '@/lib/financeEngine';
import { Search, Plus, Trash2, Edit2, Repeat } from 'lucide-react';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { TransactionEditor } from './TransactionEditor';

export function TransactionList() {
    const { transactions, deleteTransaction, categories } = useFinanceStore();
    const [search, setSearch] = useState('');
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const filtered = transactions.filter(t =>
        t.label.toLowerCase().includes(search.toLowerCase())
    );

    const getCategoryColor = (catId: string) => {
        return categories.find(c => c.id === catId)?.color || '#cbd5e1';
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none"
                    />
                </div>

                <button
                    className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                    onClick={() => setIsAddSheetOpen(true)}
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Transaction</span>
                </button>
            </div>

            <BottomSheet
                isOpen={isAddSheetOpen || !!editingTransaction}
                onClose={() => {
                    setIsAddSheetOpen(false);
                    setEditingTransaction(null);
                }}
                title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
            >
                <TransactionEditor
                    onClose={() => {
                        setIsAddSheetOpen(false);
                        setEditingTransaction(null);
                    }}
                    initialData={editingTransaction}
                />
            </BottomSheet>

            <div className="flex-1 overflow-y-auto px-4 pb-20">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                        No transactions found
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((t) => (
                            <div
                                key={t.id}
                                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl"
                            >
                                <div className="flex items-center space-x-4">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: getCategoryColor(t.categoryId) }}
                                    />
                                    <div>
                                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{t.label}</h4>
                                        <div className="flex items-center space-x-2 text-xs text-zinc-400 uppercase font-medium">
                                            <span>{t.direction}</span>
                                            {t.recurrence !== 'none' && <Repeat className="w-3 h-3" />}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-mono font-bold ${t.direction === 'income' ? 'text-emerald-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                        {t.direction === 'income' ? '+' : '-'}{t.amount}€
                                    </div>
                                    <div className="flex items-center justify-end space-x-2 mt-1">
                                        <button onClick={() => setEditingTransaction(t)} className="text-zinc-300 hover:text-indigo-500 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteTransaction(t.id)} className="text-zinc-300 hover:text-rose-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
