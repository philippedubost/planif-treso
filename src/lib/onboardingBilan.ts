import { format } from 'date-fns';
import { calculateProjection, Transaction } from '@/lib/financeEngine';

export type BilanSeverity = 'success' | 'warning' | 'danger' | 'neutral';

export interface OnboardingBilan {
    severity: BilanSeverity;
    emoji: string;
    headline: string;
    message: string;
    colorClass: string;
    bgClass: string;
    textClass: string;
    monthsToZero: number | null;
    projectedBalance12: number;
    cashflow: number;
    balance: number;
}

function fmt(n: number) {
    return Math.round(n).toLocaleString('fr-FR');
}

function buildOnboardingTransactions(
    income: number,
    expense: number,
    extra = 0,
    extraMonth = '',
    extraDirection: 'income' | 'expense' = 'expense'
): Transaction[] {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const txs: Transaction[] = [];

    if (income > 0) {
        txs.push({
            id: 'inc',
            label: 'Entrée 1',
            amount: income,
            direction: 'income',
            recurrence: 'monthly',
            startMonth: currentMonth,
            categoryId: 'cat-salary',
        });
    }
    if (expense > 0) {
        txs.push({
            id: 'exp',
            label: 'Sortie 1',
            amount: expense,
            direction: 'expense',
            recurrence: 'monthly',
            startMonth: currentMonth,
            categoryId: 'cat-rent',
        });
    }
    if (extra > 0 && extraMonth) {
        txs.push({
            id: 'ext',
            label: 'Extra 1',
            amount: extra,
            direction: extraDirection,
            recurrence: 'none',
            month: extraMonth,
            categoryId: extraDirection === 'expense' ? 'cat-shopping' : 'cat-salary',
        });
    }

    return txs;
}

export function computeOnboardingBilan(
    balance: number,
    income: number,
    expense: number,
    extra = 0,
    extraMonth = '',
    extraDirection: 'income' | 'expense' = 'expense'
): OnboardingBilan {
    const cashflow = income - expense;
    const currentMonth = format(new Date(), 'yyyy-MM');
    const txs = buildOnboardingTransactions(income, expense, extra, extraMonth, extraDirection);
    const projection = calculateProjection(balance, currentMonth, txs, 12);
    const projectedBalance12 = projection[projection.length - 1]?.balance ?? balance;

    const firstNegIndex = projection.findIndex((p) => p.balance < 0);
    const monthsToZero = firstNegIndex === -1 ? null : firstNegIndex;

    let severity: BilanSeverity = 'success';
    let emoji = '📈';
    let headline = 'Tu es sur la bonne voie';
    let message = '';
    let colorClass = 'text-emerald-500';
    let bgClass = 'bg-emerald-50';
    let textClass = 'text-emerald-600';

    if (balance < 0) {
        severity = 'danger';
        emoji = '📉';
        headline = 'Ton solde est déjà négatif';
        message = `Tu es à découvert de ${fmt(Math.abs(balance))} €. Reprends le contrôle avant que ça s'aggrave.`;
    } else if (income === 0 && expense === 0) {
        severity = 'neutral';
        emoji = '📊';
        headline = 'Solde sans flux';
        message =
            balance > 0
                ? `Ton solde de ${fmt(balance)} € reste stable — ajoute entrées et sorties pour une vraie projection.`
                : 'Ajoute tes entrées et sorties mensuelles pour voir la suite.';
        colorClass = 'text-zinc-500';
        bgClass = 'bg-zinc-50';
        textClass = 'text-zinc-500';
    } else if (income === 0 && expense > 0) {
        severity = 'danger';
        emoji = '🚨';
        headline = 'Sorties sans entrées';
        if (monthsToZero !== null && monthsToZero > 0 && monthsToZero <= 12) {
            message =
                monthsToZero === 1
                    ? `Tu dépenses ${fmt(expense)} €/mois sans revenu — découvert dès le mois prochain.`
                    : `Sans revenu, passage à zéro dans ${monthsToZero} mois.`;
        } else if (balance === 0) {
            message = `Tu dépenses ${fmt(expense)} €/mois sans aucun revenu.`;
        } else {
            message = `Tu dépenses ${fmt(expense)} €/mois sans revenu — ton matelas fond vite.`;
        }
    } else if (expense === 0 && income > 0) {
        severity = 'success';
        emoji = '🚀';
        headline = 'Bravo, que des entrées !';
        message = `Tu génères +${fmt(income)} €/mois — tu pourrais atteindre ${fmt(projectedBalance12)} € d'ici un an !`;
    } else if (cashflow < 0) {
        const monthlyLoss = Math.abs(cashflow);

        if (monthsToZero !== null) {
            if (monthsToZero === 0) {
                severity = 'danger';
                emoji = '🔴';
                headline = 'Découvert dès maintenant';
                message = `Tes sorties dépassent tes entrées de ${fmt(monthlyLoss)} €/mois.`;
            } else if (monthsToZero === 1) {
                severity = 'danger';
                emoji = '⏳';
                headline = 'Passage à zéro dès le mois prochain';
                message = `Tu perds ${fmt(monthlyLoss)} €/mois — sans changement, c'est la case rouge bientôt.`;
            } else if (monthsToZero <= 3) {
                severity = 'danger';
                emoji = '🚨';
                headline = `Passage à zéro dans ${monthsToZero} mois`;
                message = `Tu perds ${fmt(monthlyLoss)} €/mois. Pense à rééquilibrer vite.`;
            } else if (monthsToZero <= 6) {
                severity = 'warning';
                emoji = '⚠️';
                headline = `Découvert prévu dans ${monthsToZero} mois`;
                message = `Tu perds ${fmt(monthlyLoss)} €/mois — encore du temps pour agir.`;
                colorClass = 'text-amber-500';
                bgClass = 'bg-amber-50';
                textClass = 'text-amber-600';
            } else {
                severity = 'warning';
                emoji = '🟠';
                headline = `Passage à zéro dans ${monthsToZero} mois`;
                message = `Tu perds ${fmt(monthlyLoss)} €/mois mais ton solde de ${fmt(balance)} € tient encore un moment.`;
                colorClass = 'text-amber-500';
                bgClass = 'bg-amber-50';
                textClass = 'text-amber-600';
            }
        } else {
            severity = 'warning';
            emoji = '🛡️';
            headline = 'Tu perds un peu chaque mois';
            message = `−${fmt(monthlyLoss)} €/mois, mais ton matelas de ${fmt(balance)} € couvre largement l'année.`;
            colorClass = 'text-amber-500';
            bgClass = 'bg-amber-50';
            textClass = 'text-amber-600';
        }
    } else if (cashflow === 0) {
        severity = 'warning';
        emoji = '⚖️';
        headline = 'Équilibre fragile';
        message =
            balance > 0
                ? `Entrées = sorties (${fmt(income)} €) — ton solde de ${fmt(balance)} € ne bouge pas. Pas de marge pour les imprévus.`
                : 'Entrées = sorties — à zéro, le moindre imprévu compte.';
        colorClass = 'text-amber-500';
        bgClass = 'bg-amber-50';
        textClass = 'text-amber-600';
    } else {
        severity = 'success';
        emoji = projectedBalance12 >= balance + cashflow * 3 ? '🎉' : '📈';
        headline = projectedBalance12 >= balance + cashflow * 3 ? 'Bravo, ça tourne bien !' : 'Tu es sur la bonne voie';
        message = `Tu épargnes +${fmt(cashflow)} €/mois — tu pourrais atteindre ${fmt(projectedBalance12)} € d'ici un an !`;
    }

    if (severity === 'danger') {
        colorClass = 'text-rose-500';
        bgClass = 'bg-rose-50';
        textClass = 'text-rose-600';
    }

    return {
        severity,
        emoji,
        headline,
        message,
        colorClass,
        bgClass,
        textClass,
        monthsToZero,
        projectedBalance12,
        cashflow,
        balance,
    };
}
