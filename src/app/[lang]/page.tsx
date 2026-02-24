'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function Home() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Redirect to dashboard without auto-starting the tutorial
    const lang = params?.lang || 'fr';
    router.push(`/${lang}/dashboard`);
  }, [router, params]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin" />
    </div>
  );
}
