import { format, addMonths, parseISO, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';

export type TransactionDirection = 'income' | 'expense';
export type Recurrence = 'none' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  label: string;
  categoryId: string;
  amount: number;
  direction: TransactionDirection;
  recurrence: Recurrence;
  month?: string; // YYYY-MM for one-off
  startMonth?: string; // YYYY-MM for recurring
  endMonth?: string; // YYYY-MM optional
}

export interface Category {
  id: string;
  label: string;
  direction: TransactionDirection;
  color: string;
}

export interface MonthData {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  balance: number;
  details: {
    categoryTotals: Record<string, number>;
    transactions: Transaction[];
  };
}

export const calculateProjection = (
  startingBalance: number,
  startingMonth: string, // YYYY-MM
  transactions: Transaction[],
  monthsCount: number = 12
): MonthData[] => {
  const projection: MonthData[] = [];
  let currentBalance = startingBalance;
  const startDate = parseISO(`${startingMonth}-01`);

  for (let i = 0; i < monthsCount; i++) {
    const currentDate = addMonths(startDate, i);
    const monthKey = format(currentDate, 'yyyy-MM');

    let monthIncome = 0;
    let monthExpense = 0;
    const categoryTotals: Record<string, number> = {};
    const monthTransactions: Transaction[] = [];

    transactions.forEach((t) => {
      let applies = false;

      if (t.recurrence === 'none') {
        applies = t.month === monthKey;
      } else if (t.recurrence === 'monthly') {
        const start = parseISO(`${t.startMonth}-01`);
        const end = t.endMonth ? parseISO(`${t.endMonth}-01`) : null;
        // Skip current month for recurring
        const isCurrentMonth = i === 0;
        applies = !isCurrentMonth && !isBefore(currentDate, start) && (!end || !isAfter(currentDate, end));
      } else if (t.recurrence === 'yearly') {
        const start = parseISO(`${t.startMonth}-01`);
        const end = t.endMonth ? parseISO(`${t.endMonth}-01`) : null;
        const startMonthNum = start.getMonth();
        // Skip current month for recurring
        const isCurrentMonth = i === 0;
        applies =
          !isCurrentMonth &&
          !isBefore(currentDate, start) &&
          (!end || !isAfter(currentDate, end)) &&
          currentDate.getMonth() === startMonthNum;
      }

      if (applies) {
        const amount = Math.abs(t.amount);
        if (t.direction === 'income') {
          monthIncome += amount;
        } else {
          monthExpense += amount;
        }

        categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + amount;
        monthTransactions.push(t);
      }
    });

    currentBalance += (monthIncome - monthExpense);

    projection.push({
      month: monthKey,
      income: monthIncome,
      expense: monthExpense,
      balance: currentBalance,
      details: {
        categoryTotals,
        transactions: monthTransactions,
      },
    });
  }

  return projection;
};
