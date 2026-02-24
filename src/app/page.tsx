'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function Home() {
  const router = useRouter();
  const setTutorialStep = useFinanceStore((state) => state.setTutorialStep);

  useEffect(() => {
    // Start tutorial and redirect
    setTutorialStep(1);
    router.push('/dashboard');
  }, [router, setTutorialStep]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin" />
    </div>
  );
}
