'use client';

import { useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { TransactionDirection, Recurrence } from '@/lib/financeEngine';
import { format } from 'date-fns';

interface TransactionEditorProps {
    onClose: () => void;
    initialData?: any;
}

export function TransactionEditor({ onClose, initialData }: TransactionEditorProps) {
    const { addTransaction, updateTransaction, categories } = useFinanceStore();

    const [label, setLabel] = useState(initialData?.label || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [direction, setDirection] = useState<TransactionDirection>(initialData?.direction || 'expense');
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || '');
    const [recurrence, setRecurrence] = useState<Recurrence>(initialData?.recurrence || 'none');
    const [month, setMonth] = useState(initialData?.month || format(new Date(), 'yyyy-MM'));

    const handleSave = () => {
        const data = {
            label,
            amount: parseFloat(amount) || 0,
            direction,
            categoryId,
            recurrence,
            month: recurrence === 'none' ? month : undefined,
            startMonth: recurrence !== 'none' ? month : undefined,
        };

        if (initialData?.id) {
            updateTransaction(initialData.id, data);
        } else {
            addTransaction(data);
        }
        onClose();
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
                <button
                    onClick={() => setDirection('income')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${direction === 'income' ? 'bg-white dark:bg-zinc-700 text-emerald-500 shadow-sm' : 'text-zinc-400'}`}
                >
                    Income
                </button>
                <button
                    onClick={() => setDirection('expense')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${direction === 'expense' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-400'}`}
                >
                    Expense
                </button>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-400 ml-2">Label</label>
                <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Rent, Salary..."
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-zinc-900"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-400 ml-2">Amount</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00 €"
                    className="w-full p-4 text-3xl font-black bg-zinc-50 dark:bg-zinc-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-zinc-900"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-400 ml-2">Category</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border-none outline-none appearance-none"
                    >
                        {categories.filter(c => c.direction === direction).map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-400 ml-2">Recurrence</label>
                    <select
                        value={recurrence}
                        onChange={(e) => setRecurrence(e.target.value as any)}
                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border-none outline-none appearance-none"
                    >
                        <option value="none">One-off</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handleSave}
                className="w-full py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[24px] font-bold text-lg active:scale-[0.98] transition-all"
            >
                Save Transaction
            </button>
        </div>
    );
}
