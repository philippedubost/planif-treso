'use client';

import { useState } from 'react';
import { useFinanceStore, getAgeBasedSuggestions } from '@/store/useFinanceStore';
import { TransactionDirection, Recurrence } from '@/lib/financeEngine';
import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
import { useTranslation } from '@/components/i18n/TranslationProvider';

interface MobileTransactionEditorProps {
    onClose: () => void;
    initialData?: any;
}

export function MobileTransactionEditor({ onClose, initialData }: MobileTransactionEditorProps) {
    const { addTransaction, updateTransaction, categories, ageRange } = useFinanceStore();
    const suggestions = getAgeBasedSuggestions(ageRange);
    const { dictionary } = useTranslation();

    const [label, setLabel] = useState(initialData?.label || '');
    // If we have an initial amount and it's an expense, we want to show it as negative so the user understands
    // However, internally 'expense' is stored as a positive absolute value.
    const initialAmountRaw = initialData?.amount?.toString() || '';
    const initialAmountWithSign = initialData?.amount ? (initialData.direction === 'expense' ? `-${initialData.amount}` : `${initialData.amount}`) : '';

    const [amountInput, setAmountInput] = useState(initialAmountWithSign);

    // We infer recurrence and month from initialData to keep context (e.g., clicking on a month in dashboard7)
    const recurrence: Recurrence = initialData?.recurrence || 'none';
    const month = initialData?.month;

    const handleSave = async () => {
        const rawAmount = parseFloat(amountInput);
        if (isNaN(rawAmount) || rawAmount === 0) {
            alert("Veuillez entrer un montant valide.");
            return;
        }

        // Implicit rule: Negative = Expense, Positive = Income
        const direction: TransactionDirection = rawAmount < 0 ? 'expense' : 'income';
        const absoluteAmount = Math.abs(rawAmount);

        // Pick a default category based on direction if none provided
        const availableCategories = categories.filter(c => c.direction === direction);
        const categoryId = initialData?.categoryId || (availableCategories.length > 0 ? availableCategories[0].id : '');

        const data = {
            label: label.trim() || (direction === 'income' ? 'Recette' : 'Dépense'),
            amount: absoluteAmount,
            direction,
            categoryId,
            recurrence,
            month: recurrence === 'none' ? month : undefined,
            startMonth: recurrence !== 'none' ? month : undefined,
        };

        if (initialData?.id) {
            await updateTransaction(initialData.id, data);
            onClose();
        } else {
            const success = await addTransaction(data);
            if (success) {
                onClose();
            } else {
                alert("Limite atteinte ! Connectez-vous pour ajouter plus de 8 recettes/dépenses et partager avec vos proches.");
            }
        }
    };

    return (
        <div className="flex flex-col space-y-6 p-6 md:p-10 bg-white min-h-[400px]">
            <div className="text-center mb-4">
                <h2 className="text-xl font-black italic text-zinc-900">
                    {recurrence === 'none' ? 'Évènement Ponctuel' : 'Entrée ou Sortie tous les mois'}
                </h2>
                <p className="text-[10px] text-zinc-300 italic mt-2">Pensez à mettre un (-) pour une dépense.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <input
                        type="text"
                        placeholder="Nom (ex: Loyer, Salaire...)"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        onFocus={(e) => {
                            // Delay slightly to let keyboard appear before scrolling on native webviews
                            setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSave();
                            }
                        }}
                        className="w-full p-4 bg-zinc-50 border-none rounded-2xl font-black text-zinc-900 italic tracking-tight focus:ring-4 focus:ring-zinc-100 transition-all text-lg"
                    />
                    <p className="text-[10px] text-zinc-400 italic px-2 mt-2 text-center">
                        {recurrence === 'none'
                            ? dictionary.timeline.hintOneOff
                            : (amountInput.startsWith('-') ? dictionary.timeline.hintExpense : dictionary.timeline.hintIncome)}
                    </p>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                        {recurrence === 'none' ? (
                            suggestions.extra.map((s, i) => (
                                <button
                                    key={`extra-${i}`}
                                    onClick={() => { setLabel(s); if (!amountInput || !amountInput.startsWith('-')) setAmountInput('-' + amountInput.replace('-', '')); }}
                                    className="px-3 py-1 bg-zinc-50 text-zinc-600 rounded-full text-[11px] font-black italic border border-zinc-100"
                                >
                                    {s}
                                </button>
                            ))
                        ) : (
                            <>
                                {suggestions.income.map((s, i) => (
                                    <button
                                        key={`inc-${i}`}
                                        onClick={() => { setLabel(s); if (!amountInput) setAmountInput(''); }}
                                        className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-black italic border border-emerald-100"
                                    >
                                        + {s}
                                    </button>
                                ))}
                                {suggestions.expense.map((s, i) => (
                                    <button
                                        key={`exp-${i}`}
                                        onClick={() => { setLabel(s); if (!amountInput || !amountInput.startsWith('-')) setAmountInput('-' + amountInput.replace('-', '')); }}
                                        className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[11px] font-black italic border border-rose-100"
                                    >
                                        - {s}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-1 relative">
                    <input
                        type="number"
                        placeholder="-50 ou 150"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        onFocus={(e) => {
                            setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSave();
                            }
                        }}
                        className={clsx(
                            "w-full p-6 bg-zinc-50 border-none rounded-2xl font-black tracking-tighter focus:ring-4 focus:ring-zinc-100 transition-all text-3xl md:text-4xl pr-20 md:pr-16 text-center",
                            amountInput.startsWith('-') ? "text-rose-500" : (parseFloat(amountInput) > 0 ? "text-emerald-500" : "text-zinc-900")
                        )}
                    />
                    <span className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 font-black text-xl md:text-2xl text-zinc-300 pointer-events-none">
                        {recurrence === 'monthly' ? '€ / mois' : '€'}
                    </span>
                </div>
            </div>

            <div className="pt-6 mt-auto">
                <button
                    onClick={handleSave}
                    className="w-full py-5 bg-zinc-900 text-white rounded-full font-black text-lg italic tracking-tight shadow-premium active:scale-95 transition-transform flex items-center justify-center space-x-2"
                >
                    <span>{initialData && initialData.id ? 'Mettre à jour' : 'Enregistrer'}</span>
                    {!initialData?.id && <Plus className="w-5 h-5 stroke-[3px]" />}
                </button>
            </div>
        </div>
    );
}
