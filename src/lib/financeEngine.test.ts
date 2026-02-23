import { describe, it, expect } from 'vitest';
import { calculateProjection, Transaction } from './financeEngine';

describe('financeEngine', () => {
    it('should calculate projection with one-off transactions', () => {
        const transactions: Transaction[] = [
            {
                id: '1',
                label: 'Salary',
                categoryId: 'cat1',
                amount: 3000,
                direction: 'income',
                recurrence: 'none',
                month: '2026-03',
            },
            {
                id: '2',
                label: 'Rent',
                categoryId: 'cat2',
                amount: 1000,
                direction: 'expense',
                recurrence: 'none',
                month: '2026-03',
            },
        ];

        const projection = calculateProjection(1000, '2026-03', transactions, 2);

        expect(projection[0].month).toBe('2026-03');
        expect(projection[0].income).toBe(3000);
        expect(projection[0].expense).toBe(1000);
        expect(projection[0].balance).toBe(3000); // 1000 + 3000 - 1000

        expect(projection[1].month).toBe('2026-04');
        expect(projection[1].income).toBe(0);
        expect(projection[1].expense).toBe(0);
        expect(projection[1].balance).toBe(3000);
    });

    it('should calculate projection with monthly recurring transactions', () => {
        const transactions: Transaction[] = [
            {
                id: '1',
                label: 'Salary',
                categoryId: 'cat1',
                amount: 2000,
                direction: 'income',
                recurrence: 'monthly',
                startMonth: '2026-01',
            },
        ];

        const projection = calculateProjection(0, '2026-03', transactions, 3);

        expect(projection[0].month).toBe('2026-03');
        expect(projection[0].balance).toBe(2000);
        expect(projection[1].month).toBe('2026-04');
        expect(projection[1].balance).toBe(4000);
        expect(projection[2].month).toBe('2026-05');
        expect(projection[2].balance).toBe(6000);
    });

    it('should handle endMonth for recurring transactions', () => {
        const transactions: Transaction[] = [
            {
                id: '1',
                label: 'Subscription',
                categoryId: 'cat1',
                amount: 50,
                direction: 'expense',
                recurrence: 'monthly',
                startMonth: '2026-01',
                endMonth: '2026-03',
            },
        ];

        const projection = calculateProjection(1000, '2026-03', transactions, 2);

        expect(projection[0].month).toBe('2026-03');
        expect(projection[0].expense).toBe(50);
        expect(projection[1].month).toBe('2026-04');
        expect(projection[1].expense).toBe(0);
    });
});
