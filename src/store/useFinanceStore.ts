import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, Category, MonthData, calculateProjection } from '@/lib/financeEngine';
import { format } from 'date-fns';

interface FinanceState {
    transactions: Transaction[];
    categories: Category[];
    startingBalance: number;
    startingMonth: string;

    // Actions
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    updateTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;

    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => void;

    setStartingBalance: (balance: number) => void;
    setStartingMonth: (month: string) => void;

    // Selectors
    getProjection: () => MonthData[];
}

const defaultCategories: Category[] = [
    { id: 'cat-salary', label: 'Salary', direction: 'income', color: '#fbbf24' }, // warm
    { id: 'cat-dividend', label: 'Dividends', direction: 'income', color: '#f59e0b' },
    { id: 'cat-rent', label: 'Rent', direction: 'expense', color: '#3b82f6' }, // cool
    { id: 'cat-food', label: 'Food', direction: 'expense', color: '#60a5fa' },
    { id: 'cat-transport', label: 'Transport', direction: 'expense', color: '#93c5fd' },
];

export const useFinanceStore = create<FinanceState>()(
    persist(
        (set, get) => ({
            transactions: [],
            categories: defaultCategories,
            startingBalance: 0,
            startingMonth: format(new Date(), 'yyyy-MM'),

            addTransaction: (t) => set((state) => ({
                transactions: [...state.transactions, { ...t, id: crypto.randomUUID() }]
            })),

            updateTransaction: (id, updates) => set((state) => ({
                transactions: state.transactions.map((t) => t.id === id ? { ...t, ...updates } : t)
            })),

            deleteTransaction: (id) => set((state) => ({
                transactions: state.transactions.filter((t) => t.id !== id)
            })),

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

            getProjection: () => {
                const { startingBalance, startingMonth, transactions } = get();
                return calculateProjection(startingBalance, startingMonth, transactions);
            },
        }),
        {
            name: 'planif-treso-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
