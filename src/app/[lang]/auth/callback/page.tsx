'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            const { error } = await supabase.auth.getSession();
            if (error) {
                console.error('Auth callback error:', error.message);
            }
            router.push('/dashboard');
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center shadow-premium animate-pulse">
                <div className="w-8 h-8 border-2 border-white rounded-lg flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
            </div>

            <div className="text-center space-y-2">
                <h1 className="text-xl font-black italic tracking-tighter text-zinc-900 uppercase">Authentification...</h1>
                <p className="text-zinc-400 text-sm font-medium">Nous préparons votre espace sécurisé.</p>
            </div>

            <Loader2 className="w-6 h-6 text-zinc-200 animate-spin" />
        </div>
    );
}
