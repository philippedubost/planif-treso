'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function Home() {
  const router = useRouter();
  const params = useParams();

  const { hasCompletedOnboarding, setHasCompletedOnboarding, transactions, planifications, user } = useFinanceStore();

  useEffect(() => {
    // Redirect to Dashboard or Onboarding depending on state.
    // To respect existing users, if they have not explicitly completed onboarding
    // but they already have transactions or planifications, we flag them as completed to bypass.
    const lang = params?.lang || 'fr';

    if (hasCompletedOnboarding) {
      router.push(`/${lang}/dashboard`);
    } else if (transactions.length > 5 || planifications.length > 0) {
      setHasCompletedOnboarding(true);
      router.push(`/${lang}/dashboard`);
    } else {
      router.push(`/${lang}/onboarding`);
    }
  }, [router, params, hasCompletedOnboarding, setHasCompletedOnboarding, transactions.length, planifications.length]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin" />
    </div>
  );
}
