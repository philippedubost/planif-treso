'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFinanceStore } from '@/store/useFinanceStore';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, RotateCcw, Eye } from 'lucide-react';
import { format, addMonths } from 'date-fns';

function makeDemoProject() {
    const m = (offset: number) => format(addMonths(new Date(), offset), 'yyyy-MM');
    return {
        title: 'Exemple — Planif.app',
        startingBalance: 2850,
        startingMonth: m(0),
        currency: '€',
        projectionMonths: 12,
        context: 'perso',
        textSize: 'medium',
        transactions: [
            { id: 'demo-1', label: 'Salaire', amount: 2800, direction: 'income', recurrence: 'monthly', month: m(0), categoryId: 'cat-salary' },
            { id: 'demo-2', label: 'Loyer', amount: 950, direction: 'expense', recurrence: 'monthly', month: m(0), categoryId: 'cat-rent' },
            { id: 'demo-3', label: 'Courses', amount: 380, direction: 'expense', recurrence: 'monthly', month: m(0), categoryId: 'cat-groceries' },
            { id: 'demo-4', label: 'Abonnements', amount: 65, direction: 'expense', recurrence: 'monthly', month: m(0), categoryId: 'cat-subscriptions' },
            { id: 'demo-5', label: 'Vacances', amount: 1200, direction: 'expense', recurrence: 'none', month: m(3), categoryId: 'cat-travel' },
            { id: 'demo-6', label: 'Prime', amount: 800, direction: 'income', recurrence: 'none', month: m(2), categoryId: 'cat-salary' },
            { id: 'demo-7', label: 'Réparation voiture', amount: 450, direction: 'expense', recurrence: 'none', month: m(5), categoryId: 'cat-transport' },
        ],
    };
}

// ── Decorative confetti shapes ────────────────────────────────
const SHAPES = [
    { top: '6%',  left: '4%',   w: 40, h: 40,  color: '#fcd34d', radius: '50%',       rotate: 0   },
    { top: '4%',  left: '18%',  w: 28, h: 28,  color: '#86efac', radius: '6px',       rotate: 20  },
    { top: '8%',  right: '6%',  w: 50, h: 50,  color: '#c4b5fd', radius: '50%',       rotate: 0   },
    { top: '14%', right: '14%', w: 34, h: 34,  color: '#67e8f9', radius: '6px',       rotate: 35  },
    { top: '22%', right: '4%',  w: 20, h: 20,  color: '#f87171', radius: '50%',       rotate: 0   },
    { top: '30%', left: '2%',   w: 26, h: 26,  color: '#86efac', radius: '50%',       rotate: 0   },
    { top: '42%', left: '6%',   w: 18, h: 18,  color: '#fcd34d', radius: '50%',       rotate: 0   },
    { top: '55%', left: '3%',   w: 32, h: 32,  color: '#f87171', radius: '50%',       rotate: 0   },
    { top: '65%', right: '5%',  w: 22, h: 22,  color: '#fcd34d', radius: '4px',       rotate: 15  },
    { top: '72%', left: '8%',   w: 16, h: 24,  color: '#a78bfa', radius: '4px',       rotate: -20 },
    { top: '75%', right: '3%',  w: 30, h: 20,  color: '#86efac', radius: '4px',       rotate: 10  },
    { top: '15%', left: '10%',  w: 14, h: 14,  color: '#f87171', radius: '3px',       rotate: 45  },
    { top: '50%', right: '10%', w: 18, h: 18,  color: '#67e8f9', radius: '50%',       rotate: 0   },
    { top: '38%', right: '2%',  w: 24, h: 16,  color: '#fcd34d', radius: '4px',       rotate: -10 },
];

function Confetti() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            {SHAPES.map((s, i) => (
                <motion.div
                    key={i}
                    animate={{ y: [0, -12, 0], rotate: [s.rotate, s.rotate + 8, s.rotate] }}
                    transition={{ duration: 3 + (i % 4) * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                    style={{
                        position: 'absolute',
                        top: s.top,
                        left: (s as any).left,
                        right: (s as any).right,
                        width: s.w,
                        height: s.h,
                        backgroundColor: s.color,
                        borderRadius: s.radius,
                        opacity: 0.85,
                    }}
                />
            ))}
        </div>
    );
}

export default function LandingPage() {
    const router = useRouter();
    const params = useParams();
    const { hasCompletedOnboarding, transactions, loadProject } = useFinanceStore();
    const lang = (params?.lang as string) || 'fr';

    const hasSession = hasCompletedOnboarding || transactions.length > 0;

    // Prefetch next routes so clicks feel instant
    useEffect(() => {
        router.prefetch(`/${lang}/onboarding`);
        router.prefetch(`/${lang}/dashboard`);
    }, [lang, router]);

    const handleDemo = () => {
        loadProject(makeDemoProject());
        router.push(`/${lang}/dashboard?demo=true`);
    };

    const isFr = lang === 'fr';

    const steps = isFr
        ? [
            { icon: '💰', label: 'Entre ton solde' },
            { icon: '📈', label: 'Ajoute tes revenus et dépenses' },
            { icon: '🔮', label: 'Visualise ton futur' },
          ]
        : [
            { icon: '💰', label: 'Enter your balance' },
            { icon: '📈', label: 'Add income & expenses' },
            { icon: '🔮', label: 'See your future' },
          ];

    return (
        <div className="relative min-h-screen flex flex-col items-center overflow-hidden select-none"
            style={{ background: 'linear-gradient(160deg, #ede9fe 0%, #ddd6fe 40%, #c4b5fd 100%)' }}
        >
            <Confetti />

            {/* ── Content ── */}
            <div className="relative z-10 flex flex-col items-center w-full px-6 pt-10 md:pt-14 pb-10">

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2 mb-8 md:mb-10"
                >
                    <Image src="/images/favicon.png" alt="Planif.app" width={32} height={32} className="w-7 h-7 md:w-8 md:h-8 rounded-xl shadow-md" />
                    <span className="font-black italic text-lg md:text-xl tracking-tighter text-violet-600">Planif.app</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.1 }}
                    className="text-3xl md:text-5xl font-black italic tracking-tighter text-zinc-900 text-center leading-tight max-w-2xl"
                >
                    {isFr
                        ? <>À quoi ressemblera<br className="hidden md:block" /> ton compte en banque<br className="hidden md:block" /> dans 12 mois&nbsp;?</>
                        : <>What will your bank account<br className="hidden md:block" /> look like in 12 months?</>
                    }
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-4 text-base md:text-lg text-zinc-600 font-medium text-center"
                >
                    {isFr ? 'Entre quelques chiffres. On fait le reste.' : 'Enter a few numbers. We do the rest.'}
                </motion.p>

                {/* Steps — inline text, above the fold */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="mt-5 flex items-center justify-center gap-3 md:gap-6 flex-wrap"
                >
                    {steps.map((s, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-sm md:text-base font-bold text-zinc-700">
                            <span>{s.icon}</span>
                            <span>{s.label}</span>
                            {i < steps.length - 1 && <span className="text-violet-300 ml-1 md:ml-2">›</span>}
                        </span>
                    ))}
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="mt-7 flex flex-col items-center gap-3 w-full max-w-xs md:flex-row md:justify-center md:max-w-none"
                >
                    <button
                        onClick={() => router.push(`/${lang}/onboarding`)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-black italic text-base md:text-lg rounded-2xl shadow-lg transition-all"
                    >
                        {isFr ? "J'essaye en 30 sec !" : 'Try it in 30 sec!'}
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    {hasSession ? (
                        <button
                            onClick={() => router.push(`/${lang}/dashboard`)}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/70 hover:bg-white active:scale-95 text-violet-700 font-black italic text-base md:text-lg rounded-2xl border border-violet-200 shadow transition-all backdrop-blur-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {isFr ? 'Reprendre ma session' : 'Resume my session'}
                        </button>
                    ) : (
                        <button
                            onClick={handleDemo}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/70 hover:bg-white active:scale-95 text-violet-700 font-black italic text-base md:text-lg rounded-2xl border border-violet-200 shadow transition-all backdrop-blur-sm"
                        >
                            <Eye className="w-4 h-4" />
                            {isFr ? 'Voir un exemple' : 'See an example'}
                        </button>
                    )}
                </motion.div>

                {/* Badge */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 text-xs text-violet-500 font-medium tracking-wide"
                >
                    {isFr ? 'sans inscription • gratuit' : 'no signup • free'}
                </motion.p>

                {/* Illustration */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.45 }}
                    className="mt-6 md:mt-8 w-64 h-64 md:w-96 md:h-96 relative"
                >
                    <picture>
                        <source srcSet="/images/hero3.webp" type="image/webp" />
                        <Image
                            src="/images/hero3.png"
                            alt="Planif app preview"
                            fill
                            className="object-contain drop-shadow-2xl"
                            priority
                        />
                    </picture>
                </motion.div>
            </div>
        </div>
    );
}
