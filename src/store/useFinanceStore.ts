import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, Category, calculateProjection } from '@/lib/financeEngine';
import { format, addMonths } from 'date-fns';
import { useMemo } from 'react';
import fr from '@/dictionaries/fr.json';
import en from '@/dictionaries/en.json';

const getStoreDict = () => {
    if (typeof document !== 'undefined') {
        const lang = document.documentElement.lang;
        return lang === 'en' ? en : fr;
    }
    return fr;
};

export interface HistoryAction {
    type: 'add' | 'update' | 'delete' | 'reset' | 'bulk_add';
    entity: 'transaction' | 'scenario' | 'simulation';
    data: any;
    inverseData: any;
}

interface FinanceState {
    transactions: Transaction[];
    categories: Category[];
    startingBalance: number;
    startingMonth: string;
    context: 'perso' | 'business';
    currency: string;
    textSize: 'small' | 'medium' | 'large';
    hasCompletedOnboarding: boolean;
    firstName: string;
    ageRange: string;
    title: string;
    projectionMonths: number;

    // History (Undo/Redo) State
    undoStack: HistoryAction[];
    redoStack: HistoryAction[];

    // Actions
    setTitle: (title: string) => void;
    setContext: (context: 'perso' | 'business') => void;
    addTransaction: (transaction: Omit<Transaction, 'id'>, skipHistory?: boolean) => Promise<boolean>;
    updateTransaction: (id: string, updates: Partial<Transaction>, skipHistory?: boolean) => Promise<void>;
    deleteTransaction: (id: string, skipHistory?: boolean) => Promise<void>;

    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => void;

    setStartingBalance: (balance: number) => void;
    setStartingMonth: (month: string) => void;
    resetSimulation: () => Promise<void>;
    setCurrency: (currency: string) => void;
    setTextSize: (size: 'small' | 'medium' | 'large') => void;
    loadProject: (data: any) => void;
    setHasCompletedOnboarding: (completed: boolean) => void;
    setFirstName: (name: string) => void;
    setAgeRange: (range: string) => void;

    // History Actions
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    pushHistory: (action: HistoryAction) => void;
    setProjectionMonths: (months: number) => void;
}

export function useProjection(horizonMonths?: number) {
    const projectionMonths = useFinanceStore((state) => state.projectionMonths);
    const actualHorizon = horizonMonths ?? projectionMonths;
    const startingBalance = useFinanceStore((state) => state.startingBalance);
    const startingMonth = useFinanceStore((state) => state.startingMonth);
    const transactions = useFinanceStore((state) => state.transactions);

    return useMemo(
        () => calculateProjection(startingBalance, startingMonth, transactions, actualHorizon),
        [startingBalance, startingMonth, transactions, actualHorizon]
    );
}

const getTranslatedCategories = (): Category[] => {
    const dict = getStoreDict();
    return [
        { id: 'cat-salary', label: dict.categories["cat-salary"], direction: 'income', color: '#10b981' },
        { id: 'cat-dividend', label: dict.categories["cat-dividend"], direction: 'income', color: '#34d399' },
        { id: 'cat-rent', label: dict.categories["cat-rent"], direction: 'expense', color: '#f43f5e' },
        { id: 'cat-food', label: dict.categories["cat-food"], direction: 'expense', color: '#fb7185' },
        { id: 'cat-transport', label: dict.categories["cat-transport"], direction: 'expense', color: '#fda4af' },
    ];
};

export const getAgeBasedSuggestions = (ageRange: string) => {
    switch (ageRange) {
        case '15-24':
            return {
                income: ['Job étudiant', 'Bourse', 'Aides familiales'],
                expense: ['Loyer étudiant', 'Abonnements', 'Transport'],
                extra: ['Voyage', 'Ordinateur', 'Cadeaux', 'Dépôt de garantie']
            };
        case '25-34':
            return {
                income: ['Salaire', 'Prime', 'Freelance'],
                expense: ['Loyer', 'Crédit étudiant', 'Abonnements', 'Assurance'],
                extra: ['Vacances', 'Voiture', 'Formation', 'Mariage', 'Travaux']
            };
        case '35-50':
            return {
                income: ['Salaire', 'Revenus locatifs', 'Allocations familiales'],
                expense: ['Crédit immobilier', 'Impôts', 'Frais de scolarité', 'Assurances vie'],
                extra: ['Travaux maison', 'Vacances famille', 'Remplacement voiture', 'Sécurisation épargne']
            };
        case '51+':
            return {
                income: ['Salaire', 'Revenus SCPI', 'Rentes'],
                expense: ['Crédit immobilier', 'Impôts', 'Santé', 'Loisirs'],
                extra: ['Aide aux enfants', 'Voyages longs', 'Santé spécifique', 'Transmission']
            };
        case 'Entreprise':
            return {
                income: ['Chiffre d\'affaires', 'Subvention', 'Remboursement TVA'],
                expense: ['Salaires', 'Charges sociales', 'Loyer bureau', 'Logiciels'],
                extra: ['Investissement matériel', 'Formation', 'Évènement client', 'Impôt société']
            };
        default:
            return {
                income: ['Salaire', 'Aides', 'Prime'],
                expense: ['Loyer', 'Abonnements', 'Courses'],
                extra: ['Vente', 'Cadeau', 'Shopping', 'Restaurant']
            };
    }
};

export const useFinanceStore = create<FinanceState>()(
    persist(
        (set, get) => ({
            transactions: [
                { id: crypto.randomUUID(), label: 'Salaire', amount: 1000, month: format(new Date(), 'yyyy-MM'), recurrence: 'monthly', direction: 'income', categoryId: 'cat-salary' },
                { id: crypto.randomUUID(), label: 'Loyer', amount: -800, month: format(new Date(), 'yyyy-MM'), recurrence: 'monthly', direction: 'expense', categoryId: 'cat-rent' },
                { id: crypto.randomUUID(), label: 'Cadeau', amount: 150, month: format(addMonths(new Date(), 3), 'yyyy-MM'), recurrence: 'none', direction: 'income', categoryId: 'cat-dividend' }
            ],
            categories: getTranslatedCategories(),
            startingBalance: 1000,
            startingMonth: format(new Date(), 'yyyy-MM'),
            context: 'perso',
            currency: '€',
            textSize: 'medium',
            hasCompletedOnboarding: false,
            firstName: '',
            ageRange: 'Non spécifié',
            title: 'Ma Planification 1',
            projectionMonths: 12,

            undoStack: [],
            redoStack: [],

            setTitle: (title) => set({ title }),

            pushHistory: (action) => {
                set((state) => {
                    const newStack = [action, ...state.undoStack].slice(0, 15);
                    return {
                        undoStack: newStack,
                        redoStack: [],
                    };
                });
            },

            undo: async () => {
                const { undoStack, redoStack, transactions } = get();
                if (undoStack.length === 0) return;

                const [action, ...remainingUndo] = undoStack;

                let redoneAction = { ...action };
                if (action.type === 'add' && action.entity === 'transaction') {
                    const currentTx = transactions.find(t => t.id === action.data.id);
                    if (currentTx) {
                        redoneAction.data = currentTx;
                    }
                }

                set({
                    undoStack: remainingUndo,
                    redoStack: [redoneAction, ...redoStack].slice(0, 15)
                });

                if (action.entity === 'transaction') {
                    if (action.type === 'add') {
                        await get().deleteTransaction(action.inverseData.id, true);
                    } else if (action.type === 'delete') {
                        await get().addTransaction(action.inverseData, true);
                    } else if (action.type === 'update') {
                        await get().updateTransaction(action.inverseData.id, action.inverseData, true);
                    }
                }
            },

            redo: async () => {
                const { undoStack, redoStack } = get();
                if (redoStack.length === 0) return;

                const [action, ...remainingRedo] = redoStack;

                set({
                    redoStack: remainingRedo,
                    undoStack: [action, ...undoStack].slice(0, 15)
                });

                if (action.entity === 'transaction') {
                    if (action.type === 'add') {
                        await get().addTransaction(action.data, true);
                    } else if (action.type === 'delete') {
                        await get().deleteTransaction(action.data.id, true);
                    } else if (action.type === 'update') {
                        await get().updateTransaction(action.data.id, action.data, true);
                    }
                }
            },

            addTransaction: async (t: any, skipHistory = false) => {
                const newId = t.id || crypto.randomUUID();
                const newTx = { ...t, id: newId };

                set((state) => ({
                    transactions: [...state.transactions, newTx]
                }));

                if (!skipHistory) {
                    get().pushHistory({
                        type: 'add',
                        entity: 'transaction',
                        data: newTx,
                        inverseData: newTx
                    });
                }

                return true;
            },

            updateTransaction: async (id, updates, skipHistory = false) => {
                const { transactions } = get();
                const oldTx = transactions.find(t => t.id === id);

                set((state) => ({
                    transactions: state.transactions.map((t) => t.id === id ? { ...t, ...updates } : t)
                }));

                if (!skipHistory && oldTx) {
                    get().pushHistory({
                        type: 'update',
                        entity: 'transaction',
                        data: { ...oldTx, ...updates },
                        inverseData: oldTx
                    });
                }
            },

            deleteTransaction: async (id, skipHistory = false) => {
                const { transactions } = get();
                const oldTx = transactions.find(t => t.id === id);

                if (!skipHistory && oldTx) {
                    get().pushHistory({
                        type: 'delete',
                        entity: 'transaction',
                        data: oldTx,
                        inverseData: oldTx
                    });
                }

                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id)
                }));
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

            setTextSize: (textSize) => set({ textSize }),

            setContext: (context) => set({ context }),

            setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),

            setFirstName: (firstName) => set({ firstName }),

            setAgeRange: (ageRange) => set({ ageRange }),

            setProjectionMonths: (months: number) => set({ projectionMonths: months }),

            resetSimulation: async () => {
                set({
                    transactions: [],
                    startingBalance: 0,
                    startingMonth: format(new Date(), 'yyyy-MM'),
                    context: 'perso',
                    undoStack: [],
                    redoStack: [],
                });
            },

            loadProject: (data) => {
                set({
                    transactions: data.transactions || [],
                    startingBalance: data.startingBalance || 0,
                    startingMonth: data.startingMonth || format(new Date(), 'yyyy-MM'),
                    context: data.context || 'perso',
                    currency: data.currency || '€',
                    textSize: data.textSize || 'medium',
                    projectionMonths: data.projectionMonths || 12,
                    title: data.title || 'Ma Planification 1',
                });
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
                currency: state.currency,
                textSize: state.textSize,
                projectionMonths: state.projectionMonths,
                title: state.title,
                firstName: state.firstName,
                ageRange: state.ageRange,
                hasCompletedOnboarding: state.hasCompletedOnboarding,
            }),
        }
    )
);
