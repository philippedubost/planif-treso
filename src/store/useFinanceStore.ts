import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, Category, MonthData, calculateProjection } from '@/lib/financeEngine';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface FinanceState {
    transactions: Transaction[];
    categories: Category[];
    startingBalance: number;
    startingMonth: string;
    context: 'perso' | 'business';
    user: User | null;
    currency: string;

    // Actions
    initAuth: () => void;
    setContext: (context: 'perso' | 'business') => void;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<boolean>;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;

    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => void;

    setStartingBalance: (balance: number) => void;
    setStartingMonth: (month: string) => void;
    fetchTransactions: () => Promise<void>;
    resetSimulation: () => Promise<void>;
    setCurrency: (currency: string) => void;
}

export function useProjection(horizonMonths: number = 24) {
    const startingBalance = useFinanceStore((state) => state.startingBalance);
    const startingMonth = useFinanceStore((state) => state.startingMonth);
    const transactions = useFinanceStore((state) => state.transactions);

    return useMemo(
        () => calculateProjection(startingBalance, startingMonth, transactions, horizonMonths),
        [startingBalance, startingMonth, transactions, horizonMonths]
    );
}

const defaultCategories: Category[] = [
    { id: 'cat-salary', label: 'Salaire', direction: 'income', color: '#10b981' }, // emerald-500
    { id: 'cat-dividend', label: 'Dividendes', direction: 'income', color: '#34d399' }, // emerald-400
    { id: 'cat-rent', label: 'Loyer', direction: 'expense', color: '#f43f5e' }, // rose-500
    { id: 'cat-food', label: 'Alimentation', direction: 'expense', color: '#fb7185' }, // rose-400
    { id: 'cat-transport', label: 'Transport', direction: 'expense', color: '#fda4af' }, // rose-300
];

export const useFinanceStore = create<FinanceState>()(
    persist(
        (set, get) => ({
            transactions: [],
            categories: defaultCategories,
            startingBalance: 0,
            startingMonth: format(new Date(), 'yyyy-MM'),
            context: 'perso',
            user: null,
            currency: '€',

            initAuth: () => {
                supabase.auth.onAuthStateChange((_event, session) => {
                    set({ user: session?.user ?? null });
                    if (session?.user) {
                        get().fetchTransactions();
                    }
                });
            },

            fetchTransactions: async () => {
                const { user } = get();
                if (!user) return;
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', user.id);

                if (data && !error) {
                    set({ transactions: data });
                }
            },

            setContext: (context) => set({ context }),

            addTransaction: async (t) => {
                const { user, transactions } = get();

                // 8-flux limit for guests
                if (!user && transactions.length >= 8) {
                    return false;
                }

                const newId = crypto.randomUUID();
                const newTx = { ...t, id: newId };

                set((state) => ({
                    transactions: [...state.transactions, newTx]
                }));

                if (user) {
                    await supabase.from('transactions').insert({
                        ...t,
                        id: newId,
                        user_id: user.id
                    });
                }
                return true;
            },

            updateTransaction: async (id, updates) => {
                const { user } = get();
                set((state) => ({
                    transactions: state.transactions.map((t) => t.id === id ? { ...t, ...updates } : t)
                }));

                if (user) {
                    await supabase.from('transactions').update(updates).eq('id', id);
                }
            },

            deleteTransaction: async (id) => {
                const { user } = get();
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id)
                }));

                if (user) {
                    await supabase.from('transactions').delete().eq('id', id);
                }
            },

            addCategory: (c) => set((state) => ({
                categories: [...state.categories, { ...c, id: crypto.randomUUID() }]
            })),

            updateCategory: (id, updates) => set((state) => ({
                categories: state.categories.map((c) => c.id === id ? { ...c, ...updates } : c)
            })),

            deleteCategory: (id) => set((state) => ({
                categories: state.categories.filter((c) => c.id !== id)
            })),

            setStartingBalance: (balance) => set({ startingBalance: balance }),
            setStartingMonth: (month) => set({ startingMonth: month }),
            setCurrency: (currency) => set({ currency }),

            resetSimulation: async () => {
                const { user } = get();
                if (user) {
                    const { confirm } = window;
                    if (confirm("Voulez-vous vraiment effacer toutes vos données de simulation ?")) {
                        await supabase.from('transactions').delete().eq('user_id', user.id);
                        set({
                            transactions: [],
                            startingBalance: 0,
                            startingMonth: format(new Date(), 'yyyy-MM'),
                            context: 'perso'
                        });
                    }
                } else {
                    set({
                        transactions: [],
                        startingBalance: 0,
                        startingMonth: format(new Date(), 'yyyy-MM'),
                        context: 'perso'
                    });
                }
            }
        }),
        {
            name: 'planif-treso-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                transactions: state.transactions,
                categories: state.categories,
                startingBalance: state.startingBalance,
                startingMonth: state.startingMonth,
                context: state.context,
                currency: state.currency
            }),
        }
    )
);
