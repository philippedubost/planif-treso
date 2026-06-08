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
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none hidden md:block">
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
    const { hasCompletedOnboarding, loadProject } = useFinanceStore();
    const lang = (params?.lang as string) || 'fr';

    const hasSession = hasCompletedOnboarding;

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
        <div className="relative min-h-dvh flex flex-col overflow-hidden select-none"
            style={{ background: 'linear-gradient(160deg, #ede9fe 0%, #ddd6fe 40%, #c4b5fd 100%)' }}
        >
            <Confetti />

            {/* Logo — top left */}
            <motion.header
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute top-0 left-0 z-20 flex items-center gap-2 px-5 py-4 sm:px-6 sm:py-5"
            >
                <Image src="/images/favicon.png" alt="Planif.app" width={32} height={32} className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shadow-md" />
                <span className="font-black italic text-base sm:text-lg tracking-tighter text-violet-600">Planif.app</span>
            </motion.header>

            {/* Main — vertically centered */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center w-full px-5 sm:px-6 py-14 sm:py-16 min-h-dvh max-h-dvh overflow-y-auto [@media(max-height:820px)]:py-12">

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.1 }}
                    className="text-xl min-[400px]:text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-black italic tracking-tighter text-zinc-900 text-center leading-snug max-w-2xl [@media(max-height:950px)]:md:text-2xl [@media(max-height:950px)]:lg:text-3xl"
                >
                    {isFr
                        ? (
                            <>
                                <span className="block">À quoi ressemblera</span>
                                <span className="block">ton compte en banque</span>
                                <span className="block">dans 12 mois&nbsp;?</span>
                            </>
                        )
                        : (
                            <>
                                <span className="block">What will your</span>
                                <span className="block">bank account look like</span>
                                <span className="block">in 12 months?</span>
                            </>
                        )
                    }
                </motion.h1>

                {/* Hero — under title */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-3 sm:mt-4 md:mt-5 [@media(max-height:820px)]:mt-2 w-full max-w-[200px] sm:max-w-sm md:max-w-xl mx-auto overflow-hidden shrink-0
                        max-h-[12dvh] sm:max-h-[16dvh] md:max-h-[22dvh] [@media(min-height:951px)]:md:max-h-[28dvh] [@media(min-height:1100px)]:md:max-h-[34dvh]
                        [@media(max-height:640px)]:max-h-[10dvh] [@media(max-height:820px)]:max-h-[8dvh] [@media(max-height:820px)]:sm:max-h-[10dvh]"
                >
                    <Image
                        src="/images/hero4.png"
                        alt="Planif app preview"
                        width={1335}
                        height={619}
                        unoptimized
                        priority
                        sizes="(max-width: 768px) 220px, (max-width: 1200px) 480px, 640px"
                        className="w-full h-auto max-h-[inherit] object-contain object-center drop-shadow-xl md:drop-shadow-2xl"
                    />
                </motion.div>

                {/* Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.28 }}
                    className="mt-3 sm:mt-4 md:mt-5 [@media(max-height:950px)]:md:mt-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-6 flex-wrap max-w-lg"
                >
                    {steps.map((s, i) => (
                        <span key={i} className="flex items-center gap-1 text-[11px] sm:text-sm md:text-base font-bold text-zinc-700">
                            <span className="text-xs sm:text-sm">{s.icon}</span>
                            <span>{s.label}</span>
                            {i < steps.length - 1 && <span className="text-violet-300 ml-0.5 sm:ml-1 md:ml-2 hidden min-[400px]:inline">›</span>}
                        </span>
                    ))}
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="mt-4 sm:mt-5 md:mt-6 [@media(max-height:950px)]:md:mt-4 flex flex-col items-center gap-2.5 sm:gap-3 w-full max-w-xs md:flex-row md:justify-center md:max-w-none"
                >
                    <button
                        onClick={() => router.push(`/${lang}/onboarding`)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 [@media(max-height:820px)]:py-3 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-black italic text-sm sm:text-base md:text-lg [@media(max-height:950px)]:md:text-base rounded-2xl shadow-lg transition-all"
                    >
                        {isFr ? 'Essayer en 30 sec' : 'Try in 30 sec'}
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {hasSession ? (
                        <button
                            onClick={() => router.push(`/${lang}/dashboard`)}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white/70 hover:bg-white active:scale-95 text-violet-700 font-black italic text-sm sm:text-base md:text-lg rounded-2xl border border-violet-200 shadow transition-all backdrop-blur-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {isFr ? 'Reprendre ma session' : 'Resume my session'}
                        </button>
                    ) : (
                        <button
                            onClick={handleDemo}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white/70 hover:bg-white active:scale-95 text-violet-700 font-black italic text-sm sm:text-base md:text-lg rounded-2xl border border-violet-200 shadow transition-all backdrop-blur-sm"
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
                    className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-violet-500 font-medium tracking-wide text-center leading-relaxed"
                >
                    {isFr ? 'sans inscription · gratuit · données non enregistrées' : 'no signup · free · data not saved'}
                </motion.p>
            </div>
        </div>
    );
}
