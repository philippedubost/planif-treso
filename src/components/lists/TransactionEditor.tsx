'use client';

import { useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { TransactionDirection, Recurrence } from '@/lib/financeEngine';
import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
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
        <div className="flex flex-col space-y-8 p-10 bg-white min-h-[500px]">
            <div className="space-y-6">
                <div className="flex bg-zinc-50 p-1 rounded-3xl">
                    <button
                        onClick={() => setDirection('income')}
                        className={clsx(
                            "flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-500",
                            direction === 'income' ? "bg-white shadow-premium text-zinc-900" : "text-zinc-400"
                        )}
                    >
                        Positive Flow
                    </button>
                    <button
                        onClick={() => setDirection('expense')}
                        className={clsx(
                            "flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-500",
                            direction === 'expense' ? "bg-white shadow-premium text-zinc-900" : "text-zinc-400"
                        )}
                    >
                        Outgoing
                    </button>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 ml-4">Label</label>
                    <input
                        type="text"
                        placeholder="What for?"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full p-6 bg-zinc-50 border-none rounded-[32px] font-black text-zinc-900 italic tracking-tight focus:ring-4 focus:ring-zinc-100 transition-all text-xl"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 ml-4">Amount</label>
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-6 bg-zinc-50 border-none rounded-[32px] font-black text-zinc-900 tracking-tighter focus:ring-4 focus:ring-zinc-100 transition-all text-4xl pr-16"
                        />
                        <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-2xl text-zinc-200">€</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 ml-4">Category</label>
                    <div className="grid grid-cols-2 gap-3">
                        {categories.filter(c => c.direction === direction).map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setCategoryId(cat.id)}
                                className={clsx(
                                    "p-5 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden group btn-satisfying",
                                    categoryId === cat.id ? "bg-white border-zinc-900 shadow-premium" : "bg-zinc-50 border-transparent text-zinc-400"
                                )}
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20">
                                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: cat.color }} />
                                </div>
                                <span className={clsx("font-black italic tracking-tight", categoryId === cat.id ? "text-zinc-900" : "text-zinc-400")}>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 ml-4">Recurrence</label>
                    <div className="flex space-x-3">
                        {['none', 'monthly', 'yearly'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRecurrence(r as any)}
                                className={clsx(
                                    "flex-1 py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest btn-satisfying",
                                    recurrence === r ? "bg-white border-zinc-900 shadow-premium text-zinc-900" : "bg-zinc-50 border-transparent text-zinc-300"
                                )}
                            >
                                {r === 'none' ? 'Once' : r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-8">
                <button
                    onClick={handleSave}
                    className="w-full py-6 bg-zinc-900 text-white rounded-[40px] font-black text-xl italic tracking-tight shadow-premium active:scale-95 transition-all flex items-center justify-center space-x-3"
                >
                    <span>{initialData ? 'Update Flow' : 'Create Flow'}</span>
                    <Plus className={clsx("w-6 h-6 stroke-[3px]", initialData && "hidden")} />
                </button>
            </div>
        </div>
    );
}
