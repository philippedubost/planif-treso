'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AuthCallbackPage() {
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        const lang = params?.lang || 'fr';
        router.push(`/${lang}/dashboard`);
    }, [router, params]);

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin" />
        </div>
    );
}
