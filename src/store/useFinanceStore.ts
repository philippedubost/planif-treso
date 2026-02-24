import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, Category, MonthData, calculateProjection } from '@/lib/financeEngine';
import { format, addMonths } from 'date-fns';
import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import fr from '@/dictionaries/fr.json';
import en from '@/dictionaries/en.json';

const getStoreDict = () => {
    if (typeof document !== 'undefined') {
        const lang = document.documentElement.lang;
        return lang === 'en' ? en : fr;
    }
    return fr;
};

export interface Planification {
    id: string;
    name: string;
    updatedAt?: string;
    starting_balance?: number;
}

export interface ScenarioVersion {
    id?: string;
    planification_id: string;
    scenario_id: string;
    user_id: string;
    name: string;
    data: {
        scenario: Scenario;
        transactions: Transaction[];
    };
    created_at?: string;
}

export interface HistoryAction {
    type: 'add' | 'update' | 'delete' | 'reset' | 'bulk_add';
    entity: 'transaction' | 'scenario' | 'simulation';
    data: any;
    inverseData: any;
}

export interface Scenario {
    id: string;
    planificationId?: string;
    name: string;
    startingBalance: number;
    startingMonth: string;
    currency: string;
    updatedAt: string;
}

interface FinanceState {
    transactions: Transaction[];
    categories: Category[];
    startingBalance: number;
    startingMonth: string;
    context: 'perso' | 'business';
    user: User | null;
    currency: string;
    textSize: 'small' | 'medium' | 'large';

    // Planification & Scenario & History State
    planifications: Planification[];
    currentPlanificationId: string | null;
    scenarios: Scenario[];
    currentScenarioId: string | null;
    showScenarioBadge: boolean;
    projectionMonths: number;

    // Actions
    initAuth: () => void;
    setContext: (context: 'perso' | 'business') => void;
    addTransaction: (transaction: Omit<Transaction, 'id'>, skipHistory?: boolean) => Promise<boolean>;
    updateTransaction: (id: string, updates: Partial<Transaction>, skipHistory?: boolean) => Promise<void>;
    deleteTransaction: (id: string, skipHistory?: boolean) => Promise<void>;

    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => void;

    setStartingBalance: (balance: number) => void;
    setStartingMonth: (month: string) => void;
    fetchTransactions: () => Promise<void>;
    resetSimulation: () => Promise<void>;
    setCurrency: (currency: string) => void;
    setTextSize: (size: 'small' | 'medium' | 'large') => void;
    loadProject: (data: any) => void;

    // Autosave State
    lastAutosaveDate: number;
    hasModificationsSinceSave: boolean;
    scenarioVersions: ScenarioVersion[];

    // History (Undo/Redo) State
    undoStack: HistoryAction[];
    redoStack: HistoryAction[];

    // History Actions
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    pushHistory: (action: HistoryAction) => void;
    checkAutosave: () => void;
    createScenarioVersion: (name: string) => Promise<void>;
    fetchScenarioVersions: (scenarioId: string) => Promise<void>;
    restoreVersionAsNewScenario: (version: ScenarioVersion) => Promise<string | undefined>;

    // Planification & Scenario Actions
    fetchPlanifications: () => Promise<void>;
    addPlanification: (name: string) => Promise<string>;
    updatePlanification: (id: string, updates: Partial<Planification>) => Promise<void>;
    deletePlanification: (id: string) => Promise<void>;
    setCurrentPlanification: (id: string | null) => void;
    fetchScenarios: () => Promise<void>;
    addScenario: (name: string) => Promise<string>;
    setCurrentScenario: (id: string | null) => void;
    updateScenario: (id: string, updates: Partial<Scenario>) => Promise<void>;
    deleteScenario: (id: string) => Promise<void>;
    setShowScenarioBadge: (show: boolean) => void;
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

const defaultCategories: Category[] = [
    { id: 'cat-salary', label: 'Salaire', direction: 'income', color: '#10b981' }, // emerald-500
    { id: 'cat-dividend', label: 'Dividendes', direction: 'income', color: '#34d399' }, // emerald-400
    { id: 'cat-rent', label: 'Loyer', direction: 'expense', color: '#f43f5e' }, // rose-500
    { id: 'cat-food', label: 'Alimentation', direction: 'expense', color: '#fb7185' }, // rose-400
    { id: 'cat-transport', label: 'Transport', direction: 'expense', color: '#fda4af' }, // rose-300
];

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

let globalSyncChannel: any = null;

const setupRealtimeSync = (get: any, userId: string) => {
    if (globalSyncChannel) {
        supabase.removeChannel(globalSyncChannel);
    }
    globalSyncChannel = supabase.channel(`sync-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, () => {
            get().fetchTransactions();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'scenarios', filter: `user_id=eq.${userId}` }, () => {
            get().fetchScenarios();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'planifications', filter: `user_id=eq.${userId}` }, () => {
            get().fetchPlanifications();
        })
        .subscribe();
};

const cleanupRealtimeSync = () => {
    if (globalSyncChannel) {
        supabase.removeChannel(globalSyncChannel);
        globalSyncChannel = null;
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
            user: null,
            currency: '€',
            textSize: 'medium',
            planifications: [],
            currentPlanificationId: null,
            scenarios: [],
            currentScenarioId: null,
            showScenarioBadge: false,
            projectionMonths: 12,

            // History / Autosave initials
            lastAutosaveDate: Date.now(),
            hasModificationsSinceSave: false,
            scenarioVersions: [],
            undoStack: [],
            redoStack: [],

            initAuth: async () => {
                // Get initial session
                const { data: { session } } = await supabase.auth.getSession();
                set({ user: session?.user ?? null });
                if (session?.user) {
                    await get().fetchPlanifications();
                    await get().fetchScenarios();
                    await get().fetchTransactions();
                    setupRealtimeSync(get, session.user.id);
                } else {
                    cleanupRealtimeSync();
                }

                // Listen for changes
                supabase.auth.onAuthStateChange(async (_event, session) => {
                    const currentUser = get().user;
                    if (session?.user?.id !== currentUser?.id) {
                        set({ user: session?.user ?? null });
                        if (session?.user) {
                            await get().fetchPlanifications();
                            await get().fetchScenarios();
                            await get().fetchTransactions();
                            setupRealtimeSync(get, session.user.id);
                        } else {
                            cleanupRealtimeSync();
                        }
                    }
                });
            },

            checkAutosave: () => {
                const { lastAutosaveDate, hasModificationsSinceSave, currentScenarioId } = get();
                // Check if we need to auto save (1 hour = 3600000ms)
                if (hasModificationsSinceSave && currentScenarioId && Date.now() - lastAutosaveDate > 3600000) {
                    get().createScenarioVersion(getStoreDict().scenarios.autoSave);
                }
            },

            createScenarioVersion: async (name) => {
                const { user, currentPlanificationId, currentScenarioId, scenarios, transactions } = get();
                if (!user || !currentPlanificationId || !currentScenarioId) return;

                const currentScenario = scenarios.find(s => s.id === currentScenarioId);
                if (!currentScenario) return;

                const newVersion = {
                    planification_id: currentPlanificationId,
                    scenario_id: currentScenarioId,
                    user_id: user.id,
                    name,
                    data: {
                        scenario: currentScenario,
                        transactions: transactions
                    }
                };

                const { data, error } = await supabase.from('scenario_versions').insert(newVersion).select().single();
                if (!error && data) {
                    set((state) => ({
                        lastAutosaveDate: Date.now(),
                        hasModificationsSinceSave: false,
                        scenarioVersions: [data, ...state.scenarioVersions]
                    }));
                }
            },

            fetchScenarioVersions: async (scenarioId) => {
                const { user } = get();
                if (!user) return;
                const { data, error } = await supabase
                    .from('scenario_versions')
                    .select('*')
                    .eq('scenario_id', scenarioId)
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    set({ scenarioVersions: data });
                }
            },

            restoreVersionAsNewScenario: async (version) => {
                const { user, currentPlanificationId } = get();
                if (!user) return;

                const baseName = version.data.scenario.name;
                const newName = `${baseName} (${getStoreDict().scenarios.restoredName} ${new Date().toLocaleDateString()})`;

                const newScenarioId = await get().addScenario(newName);

                if (newScenarioId) {
                    // Les transactions existantes ont déjà été copiées par addScenario (qui copie les actuelles)
                    // Mais on veut FORCER les transactions de la version.
                    // Donc on efface les tx copiées par addScenario pour ce nouveau scénario,
                    // et on insère celles de notre "data" historique.
                    await supabase.from('transactions').delete().eq('scenario_id', newScenarioId);

                    const restoredTxs = version.data.transactions.map((tx: any) => ({
                        id: crypto.randomUUID(), // always new IDs to prevent overlap
                        label: tx.label,
                        amount: tx.amount,
                        month: tx.month,
                        recurrence: tx.recurrence,
                        direction: tx.direction,
                        category_id: tx.categoryId,
                        user_id: user.id,
                        planification_id: currentPlanificationId,
                        scenario_id: newScenarioId
                    }));

                    if (restoredTxs.length > 0) {
                        await supabase.from('transactions').insert(restoredTxs);
                    }

                    // On rafraichit et on select
                    await get().fetchScenarios();
                    await get().fetchTransactions(); // that re-fetches for everything since we set it below
                    set({ currentScenarioId: newScenarioId });
                    return newScenarioId;
                }
            },

            pushHistory: (action) => {
                set((state) => {
                    const newStack = [action, ...state.undoStack].slice(0, 15);
                    return {
                        undoStack: newStack,
                        redoStack: [],
                        hasModificationsSinceSave: true
                    };
                });
                get().checkAutosave();
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

                // Appliquer les données inverses
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

                // Ré-appliquer l'action
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

            fetchTransactions: async () => {
                const { user, currentScenarioId, currentPlanificationId, transactions: localTransactions } = get();
                if (!user) return;

                let query = supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', user.id);

                if (currentPlanificationId) {
                    query = query.eq('planification_id', currentPlanificationId);
                }

                if (currentScenarioId) {
                    query = query.eq('scenario_id', currentScenarioId);
                } else {
                    query = query.is('scenario_id', null);
                }

                const { data: remoteData, error } = await query;

                if (!error && remoteData) {
                    const mappedTxs = remoteData.map((d: any) => ({
                        id: d.id,
                        label: d.label,
                        amount: d.amount,
                        month: d.month,
                        recurrence: d.recurrence,
                        direction: d.direction,
                        categoryId: d.category_id
                    }));
                    set({ transactions: mappedTxs });
                }
            },

            fetchPlanifications: async () => {
                const { user } = get();
                if (!user) return;

                const { data, error } = await supabase
                    .from('planifications')
                    .select('id, name, created_at, updated_at, starting_balance')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });

                if (!error && data) {
                    const plans = data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        updatedAt: p.updated_at,
                        starting_balance: p.starting_balance
                    }));
                    set({ planifications: plans });

                    if (plans.length > 0 && !get().currentPlanificationId) {
                        get().setCurrentPlanification(plans[0].id);
                    }
                }
            },

            addPlanification: async (name) => {
                const { user } = get();
                if (!user) return '';

                const { data, error } = await supabase
                    .from('planifications')
                    .insert({ user_id: user.id, name })
                    .select()
                    .single();

                if (!error && data) {
                    await get().fetchPlanifications();
                    // Auto-select this new planification
                    set({ currentPlanificationId: data.id, currentScenarioId: null, transactions: [] });

                    // Create a default scenario for it
                    const newScenarioId = await get().addScenario(getStoreDict().scenarios.defaultName);
                    if (newScenarioId) {
                        get().setCurrentScenario(newScenarioId);
                    } else {
                        await get().fetchScenarios();
                        await get().fetchTransactions();
                    }

                    return data.id;
                }
                return '';
            },

            updatePlanification: async (id, updates) => {
                const { user, planifications } = get();
                if (!user) return;

                set({ planifications: planifications.map(p => p.id === id ? { ...p, ...updates } : p) });

                await supabase.from('planifications').update({
                    ...updates,
                    updated_at: new Date().toISOString()
                }).eq('id', id);
            },

            deletePlanification: async (id) => {
                const { user, currentPlanificationId } = get();
                if (!user) return;

                const { error } = await supabase
                    .from('planifications')
                    .delete()
                    .eq('id', id);

                if (!error) {
                    if (currentPlanificationId === id) {
                        set({ currentPlanificationId: null, currentScenarioId: null, transactions: [] });
                    }
                    await get().fetchPlanifications();
                }
            },

            setCurrentPlanification: async (id) => {
                const { planifications } = get();
                const planif = planifications.find(p => p.id === id);
                set({
                    currentPlanificationId: id,
                    currentScenarioId: null,
                    transactions: [],
                    startingBalance: planif?.starting_balance || 0
                });
                await get().fetchScenarios();
                const scenarios = get().scenarios;
                if (scenarios.length > 0) {
                    await get().setCurrentScenario(scenarios[0].id);
                } else {
                    await get().fetchTransactions();
                }
            },

            fetchScenarios: async () => {
                const { user, currentPlanificationId } = get();
                if (!user) return;

                let query = supabase
                    .from('scenarios')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });

                if (currentPlanificationId) {
                    query = query.eq('planification_id', currentPlanificationId);
                }

                const { data, error } = await query;

                if (!error && data) {
                    // Check if we are scoped to a planification and it has 0 scenarios
                    if (currentPlanificationId && data.length === 0) {
                        // Create a default scenario
                        const newScenarioId = await get().addScenario(getStoreDict().scenarios.defaultName);
                        if (newScenarioId) return; // addScenario will re-trigger fetchScenarios
                    }

                    set({
                        scenarios: data.map((s: any) => ({
                            id: s.id,
                            planificationId: s.planification_id,
                            name: s.name,
                            startingBalance: s.starting_balance,
                            startingMonth: s.starting_month,
                            currency: s.currency,
                            updatedAt: s.updated_at
                        }))
                    });
                }
            },

            addScenario: async (name) => {
                const { user, startingBalance, startingMonth, currency, transactions, currentPlanificationId } = get();
                if (!user) return '';

                const newScenario = {
                    user_id: user.id,
                    planification_id: currentPlanificationId,
                    name,
                    starting_balance: startingBalance,
                    starting_month: startingMonth,
                    currency
                };

                const { data: sData, error: sError } = await supabase
                    .from('scenarios')
                    .insert(newScenario)
                    .select()
                    .single();

                if (!sError && sData) {
                    // Copy transactions
                    if (transactions.length > 0) {
                        const newTxs = transactions.map(tx => ({
                            id: crypto.randomUUID(),
                            label: tx.label,
                            amount: tx.amount,
                            month: tx.month,
                            recurrence: tx.recurrence,
                            direction: tx.direction,
                            category_id: tx.categoryId,
                            user_id: user.id,
                            planification_id: currentPlanificationId,
                            scenario_id: sData.id
                        }));
                        await supabase.from('transactions').insert(newTxs);
                    }

                    await get().fetchScenarios();
                    return sData.id;
                }
                return '';
            },

            setCurrentScenario: async (id) => {
                set({ currentScenarioId: id, transactions: [] });
                await get().fetchTransactions();
                // Rafraîchir l'historique de versions pour ce scénario
                if (id) {
                    get().fetchScenarioVersions(id);
                } else {
                    set({ scenarioVersions: [] });
                }
            },

            updateScenario: async (id, updates) => {
                const { user } = get();
                if (!user) return;

                const dbUpdates: any = {};
                if (updates.name) dbUpdates.name = updates.name;
                if (updates.startingBalance !== undefined) dbUpdates.starting_balance = updates.startingBalance;
                if (updates.startingMonth) dbUpdates.starting_month = updates.startingMonth;
                if (updates.currency) dbUpdates.currency = updates.currency;

                const { error } = await supabase
                    .from('scenarios')
                    .update(dbUpdates)
                    .eq('id', id);

                if (!error) {
                    await get().fetchScenarios();
                }
            },

            deleteScenario: async (id) => {
                const { user, currentScenarioId } = get();
                if (!user) return;

                const { error } = await supabase
                    .from('scenarios')
                    .delete()
                    .eq('id', id);

                if (!error) {
                    if (currentScenarioId === id) {
                        set({ currentScenarioId: null });
                    }
                    await get().fetchScenarios();
                    await get().fetchTransactions();
                }
            },

            setShowScenarioBadge: (show) => set({ showScenarioBadge: show }),

            setContext: (context) => set({ context }),

            addTransaction: async (t: any, skipHistory = false) => {
                const { user, currentScenarioId, currentPlanificationId } = get();

                const newId = t.id || crypto.randomUUID(); // Garder l'ID s'il vient de undo/redo
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


                if (user) {
                    const dbTx = {
                        id: newId,
                        label: t.label,
                        amount: t.amount,
                        month: t.month,
                        recurrence: t.recurrence,
                        direction: t.direction,
                        category_id: t.categoryId,
                        user_id: user.id,
                        planification_id: currentPlanificationId,
                        scenario_id: currentScenarioId
                    };

                    // Log to history
                    await supabase.from('history').insert({
                        user_id: user.id,
                        planification_id: currentPlanificationId,
                        scenario_id: currentScenarioId,
                        change_type: 'create',
                        table_name: 'transactions',
                        row_id: newId,
                        after_data: dbTx
                    });

                    await supabase.from('transactions').insert(dbTx);
                }
                return true;
            },

            updateTransaction: async (id, updates, skipHistory = false) => {
                const { user, currentScenarioId, currentPlanificationId, transactions } = get();
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

                if (user && oldTx) {
                    const dbUpdates: any = {};
                    if (updates.label !== undefined) dbUpdates.label = updates.label;
                    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
                    if (updates.month !== undefined) dbUpdates.month = updates.month;
                    if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence;
                    if (updates.direction !== undefined) dbUpdates.direction = updates.direction;
                    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;

                    // Log to history
                    await supabase.from('history').insert({
                        user_id: user.id,
                        planification_id: currentPlanificationId,
                        scenario_id: currentScenarioId,
                        change_type: 'update',
                        table_name: 'transactions',
                        row_id: id,
                        before_data: oldTx,
                        after_data: { ...oldTx, ...dbUpdates }
                    });

                    await supabase.from('transactions').update(dbUpdates).eq('id', id);
                }
            },

            deleteTransaction: async (id, skipHistory = false) => {
                const { user, currentScenarioId, currentPlanificationId, transactions } = get();
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

                if (user && oldTx) {
                    // Log to history
                    await supabase.from('history').insert({
                        user_id: user.id,
                        planification_id: currentPlanificationId,
                        scenario_id: currentScenarioId,
                        change_type: 'delete',
                        table_name: 'transactions',
                        row_id: id,
                        before_data: oldTx
                    });

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

            setStartingBalance: (balance) => {
                const { user, currentPlanificationId, planifications } = get();

                set({ startingBalance: balance });
                set({ planifications: planifications.map(p => p.id === currentPlanificationId ? { ...p, starting_balance: balance } : p) });

                if (user && currentPlanificationId) {
                    supabase.from('planifications').update({ starting_balance: balance }).eq('id', currentPlanificationId).then();
                }
            },
            setStartingMonth: (month) => {
                set({ startingMonth: month });
                const { user, currentScenarioId } = get();
                if (user && currentScenarioId) {
                    supabase.from('scenarios').update({ starting_month: month }).eq('id', currentScenarioId).then();
                }
            },
            setCurrency: (currency) => {
                set({ currency });
                const { user, currentScenarioId } = get();
                if (user && currentScenarioId) {
                    supabase.from('scenarios').update({ currency }).eq('id', currentScenarioId).then();
                }
            },
            setTextSize: (textSize) => set({ textSize }),

            resetSimulation: async () => {
                const { user, currentScenarioId, currentPlanificationId } = get();
                if (user) {
                    let query = supabase.from('transactions').delete().eq('user_id', user.id);
                    if (currentPlanificationId) {
                        query = query.eq('planification_id', currentPlanificationId);
                    }
                    if (currentScenarioId) {
                        query = query.eq('scenario_id', currentScenarioId);
                    } else {
                        query = query.is('scenario_id', null);
                    }
                    await query;
                }
                set({
                    transactions: [],
                    startingBalance: 0,
                    startingMonth: format(new Date(), 'yyyy-MM'),
                    context: 'perso'
                });
            },

            setProjectionMonths: (months: number) => {
                set({ projectionMonths: months });
                const { user, currentScenarioId } = get();
                if (user && currentScenarioId) {
                    supabase.from('scenarios').update({ projection_months: months }).eq('id', currentScenarioId).then();
                }
            },

            loadProject: (data) => {
                set({
                    transactions: data.transactions || [],
                    startingBalance: data.startingBalance || 0,
                    startingMonth: data.startingMonth || format(new Date(), 'yyyy-MM'),
                    context: data.context || 'perso',
                    currency: data.currency || '€',
                    textSize: data.textSize || 'medium',
                    projectionMonths: data.projectionMonths || 12
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
                currentPlanificationId: state.currentPlanificationId,
                currentScenarioId: state.currentScenarioId,
                showScenarioBadge: state.showScenarioBadge,
                projectionMonths: state.projectionMonths
            }),
        }
    )
);
