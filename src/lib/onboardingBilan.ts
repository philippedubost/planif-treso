import { format } from 'date-fns';
import { calculateProjection, Transaction, type MonthData } from '@/lib/financeEngine';

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

interface EventImpact {
    hasEvents: boolean;
    eventDelta: number;
    positiveEventTotal: number;
    negativeEventTotal: number;
    recurringMonthsToZero: number | null;
    recurringProjectedEnd: number;
}

function computeEventImpact(
    balance: number,
    startingMonth: string,
    transactions: Transaction[],
    projectionMonths: number,
    projectedBalance12: number
): EventImpact {
    const recurringTxs = transactions.filter((t) => t.recurrence !== 'none');
    const recurringProjection = calculateProjection(balance, startingMonth, recurringTxs, projectionMonths);
    const recurringProjectedEnd = recurringProjection[recurringProjection.length - 1]?.balance ?? balance;
    const recurringFirstNeg = recurringProjection.findIndex((p) => p.balance < 0);
    const recurringMonthsToZero = recurringFirstNeg === -1 ? null : recurringFirstNeg;

    let positiveEventTotal = 0;
    let negativeEventTotal = 0;
    for (const t of transactions) {
        if (t.recurrence === 'none') {
            const abs = Math.abs(t.amount);
            if (t.direction === 'income') positiveEventTotal += abs;
            else negativeEventTotal += abs;
        }
    }

    return {
        hasEvents: positiveEventTotal > 0 || negativeEventTotal > 0,
        eventDelta: projectedBalance12 - recurringProjectedEnd,
        positiveEventTotal,
        negativeEventTotal,
        recurringMonthsToZero,
        recurringProjectedEnd,
    };
}

function impactThreshold(balance: number) {
    return Math.max(150, Math.abs(balance) * 0.03);
}

function applyEventAdjustments(
    bilan: OnboardingBilan,
    cashflow: number,
    impact: EventImpact
): OnboardingBilan {
    if (!impact.hasEvents) return bilan;

    const threshold = impactThreshold(bilan.balance);
    const monthsChanged = bilan.monthsToZero !== impact.recurringMonthsToZero;
    const deltaSignificant = Math.abs(impact.eventDelta) >= threshold;

    if (!monthsChanged && !deltaSignificant) return bilan;

    const { monthsToZero, projectedBalance12 } = bilan;
    const rZero = impact.recurringMonthsToZero;

    const recurringLooksBad = cashflow < 0 || (rZero !== null && rZero <= 12);
    const eventsRescue =
        impact.positiveEventTotal > 0 &&
        ((rZero !== null && monthsToZero === null) ||
            (rZero !== null && monthsToZero !== null && monthsToZero > rZero) ||
            (cashflow < 0 && impact.eventDelta >= threshold));

    if (recurringLooksBad && eventsRescue) {
        if (rZero !== null && monthsToZero === null) {
            const zeroLabel =
                rZero === 1 ? 'dès le mois prochain' : `dans ${rZero} mois`;
            return {
                ...bilan,
                severity: 'warning',
                emoji: '✨',
                headline: 'Tes événements te sauvent la mise',
                message: `Ta tendance mensuelle mènerait à zéro ${zeroLabel} — tes entrées ponctuelles (+${fmt(impact.positiveEventTotal)} €) maintiennent le cap : ${fmt(projectedBalance12)} € à horizon.`,
                colorClass: 'text-amber-500',
                bgClass: 'bg-amber-50',
                textClass: 'text-amber-600',
            };
        }
        if (rZero !== null && monthsToZero !== null && monthsToZero > rZero) {
            return {
                ...bilan,
                severity: bilan.severity === 'danger' ? 'warning' : bilan.severity,
                emoji: '🛟',
                headline: 'Tes événements repoussent la limite',
                message: `Sans eux, passage à zéro dans ${rZero} mois — avec tes entrées ponctuelles, tu gagnes ${monthsToZero - rZero} mois (zéro repoussé à ${monthsToZero} mois).`,
                colorClass: 'text-amber-500',
                bgClass: 'bg-amber-50',
                textClass: 'text-amber-600',
            };
        }
    }

    const recurringLooksGood = cashflow > 0 || (rZero === null && cashflow >= 0);
    const eventsHurt =
        impact.negativeEventTotal > 0 &&
        ((rZero === null && monthsToZero !== null) ||
            (rZero !== null && monthsToZero !== null && monthsToZero < rZero) ||
            (cashflow > 0 && impact.eventDelta <= -threshold));

    if (recurringLooksGood && eventsHurt) {
        if (rZero === null && monthsToZero !== null) {
            const isUrgent = monthsToZero <= 3;
            return {
                ...bilan,
                severity: isUrgent ? 'danger' : 'warning',
                emoji: '💸',
                headline: 'Des événements pénalisent ta projection',
                message:
                    cashflow > 0
                        ? `Ta base mensuelle est positive (+${fmt(cashflow)} €/mois), mais tes sorties ponctuelles (−${fmt(impact.negativeEventTotal)} €) plombent l'année — passage à zéro dans ${monthsToZero} mois.`
                        : `Tes événements négatifs (−${fmt(impact.negativeEventTotal)} €) tirent le solde vers le bas — passage à zéro dans ${monthsToZero} mois.`,
                colorClass: isUrgent ? 'text-rose-500' : 'text-amber-500',
                bgClass: isUrgent ? 'bg-rose-50' : 'bg-amber-50',
                textClass: isUrgent ? 'text-rose-600' : 'text-amber-600',
            };
        }
        if (cashflow > 0 && impact.eventDelta <= -threshold) {
            return {
                ...bilan,
                severity: projectedBalance12 < bilan.balance ? 'warning' : bilan.severity,
                emoji: '⚡',
                headline: 'Des imprévus freinent ta progression',
                message: `Sans événements, tu serais à ${fmt(impact.recurringProjectedEnd)} € — avec eux, ${fmt(projectedBalance12)} € (${fmt(impact.eventDelta)} € sur l'année).`,
                colorClass: 'text-amber-500',
                bgClass: 'bg-amber-50',
                textClass: 'text-amber-600',
            };
        }
        if (rZero !== null && monthsToZero !== null && monthsToZero < rZero) {
            return {
                ...bilan,
                severity: monthsToZero <= 3 ? 'danger' : 'warning',
                emoji: '⚠️',
                headline: 'Des événements accélèrent la chute',
                message: `Sans eux, tu tiendrais ${rZero} mois avant zéro — tes sorties ponctuelles avancent l'échéance à ${monthsToZero} mois.`,
                colorClass: monthsToZero <= 3 ? 'text-rose-500' : 'text-amber-500',
                bgClass: monthsToZero <= 3 ? 'bg-rose-50' : 'bg-amber-50',
                textClass: monthsToZero <= 3 ? 'text-rose-600' : 'text-amber-600',
            };
        }
    }

    if (deltaSignificant) {
        const suffix =
            impact.eventDelta > 0
                ? ` Tes événements ajoutent +${fmt(impact.eventDelta)} € sur la période.`
                : ` Tes événements retirent ${fmt(Math.abs(impact.eventDelta))} € sur la période.`;
        return { ...bilan, message: bilan.message + suffix };
    }

    return bilan;
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
            label: 'Événement',
            amount: extra,
            direction: extraDirection,
            recurrence: 'none',
            month: extraMonth,
            categoryId: extraDirection === 'expense' ? 'cat-shopping' : 'cat-salary',
        });
    }

    return txs;
}

function evaluateBilan(
    balance: number,
    income: number,
    expense: number,
    projection: MonthData[],
    transactions: Transaction[],
    startingMonth: string,
    projectionMonths: number
): OnboardingBilan {
    const cashflow = income - expense;
    const projectedBalance12 = projection[projection.length - 1]?.balance ?? balance;
    const eventImpact = computeEventImpact(balance, startingMonth, transactions, projectionMonths, projectedBalance12);

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
        if (eventImpact.hasEvents && Math.abs(eventImpact.eventDelta) >= impactThreshold(balance)) {
            severity = eventImpact.eventDelta >= 0 ? 'success' : 'warning';
            emoji = eventImpact.eventDelta >= 0 ? '📅' : '💸';
            headline = eventImpact.eventDelta >= 0 ? 'Tes événements font bouger la ligne' : 'Tes événements pèsent sur le solde';
            message =
                eventImpact.eventDelta >= 0
                    ? `Pas de flux mensuel — tes entrées ponctuelles (+${fmt(eventImpact.positiveEventTotal)} €) portent le solde à ${fmt(projectedBalance12)} €.`
                    : `Pas de flux mensuel — tes sorties ponctuelles (−${fmt(eventImpact.negativeEventTotal)} €) tirent le solde à ${fmt(projectedBalance12)} €.`;
            colorClass = eventImpact.eventDelta >= 0 ? 'text-emerald-500' : 'text-amber-500';
            bgClass = eventImpact.eventDelta >= 0 ? 'bg-emerald-50' : 'bg-amber-50';
            textClass = eventImpact.eventDelta >= 0 ? 'text-emerald-600' : 'text-amber-600';
        } else {
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
        }
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

    const base: OnboardingBilan = {
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

    const eventsOnlyPlan =
        income === 0 &&
        expense === 0 &&
        eventImpact.hasEvents &&
        Math.abs(eventImpact.eventDelta) >= impactThreshold(balance);

    if (eventsOnlyPlan) return base;

    return applyEventAdjustments(base, cashflow, eventImpact);
}

export function computeOnboardingBilan(
    balance: number,
    income: number,
    expense: number,
    extra = 0,
    extraMonth = '',
    extraDirection: 'income' | 'expense' = 'expense'
): OnboardingBilan {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const txs = buildOnboardingTransactions(income, expense, extra, extraMonth, extraDirection);
    const projection = calculateProjection(balance, currentMonth, txs, 12);
    return evaluateBilan(balance, income, expense, projection, txs, currentMonth, 12);
}

export function computeBilanFromFinanceState(
    balance: number,
    startingMonth: string,
    transactions: Transaction[],
    projectionMonths: number
): OnboardingBilan {
    const projection = calculateProjection(balance, startingMonth, transactions, projectionMonths);

    let income = 0;
    let expense = 0;
    for (const t of transactions) {
        if (t.recurrence === 'monthly') {
            const abs = Math.abs(t.amount);
            if (t.direction === 'income') income += abs;
            else expense += abs;
        }
    }

    return evaluateBilan(balance, income, expense, projection, transactions, startingMonth, projectionMonths);
}
