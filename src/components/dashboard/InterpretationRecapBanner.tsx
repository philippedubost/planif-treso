'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import type { BilanSeverity, OnboardingBilan } from '@/lib/onboardingBilan';
import { BilanScenarioEmoji } from '@/components/onboarding/BilanScenarioCard';

const DISMISS_PREFIX = 'planif-interpretation-recap';

const LIGHT_SURFACE: Record<BilanSeverity, string> = {
    success: 'bg-emerald-50/50',
    warning: 'bg-amber-50/50',
    danger: 'bg-rose-50/50',
    neutral: 'bg-zinc-50/70',
};

const LIGHT_BORDER: Record<BilanSeverity, string> = {
    success: 'border-emerald-200/35',
    warning: 'border-amber-200/35',
    danger: 'border-rose-200/35',
    neutral: 'border-zinc-200/45',
};

const LIGHT_DISMISS_HOVER: Record<BilanSeverity, string> = {
    success: 'hover:bg-emerald-500/8 hover:text-emerald-600',
    warning: 'hover:bg-amber-500/8 hover:text-amber-600',
    danger: 'hover:bg-rose-500/8 hover:text-rose-500',
    neutral: 'hover:bg-zinc-500/8 hover:text-zinc-600',
};

interface InterpretationRecapBannerProps {
    bilan: OnboardingBilan;
    className?: string;
}

export function InterpretationRecapBanner({ bilan, className }: InterpretationRecapBannerProps) {
    const dismissKey = `${DISMISS_PREFIX}-${bilan.headline}`;
    const [dismissed, setDismissed] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setDismissed(sessionStorage.getItem(dismissKey) === '1');
        setReady(true);
    }, [dismissKey]);

    const dismiss = () => {
        sessionStorage.setItem(dismissKey, '1');
        setDismissed(true);
    };

    if (!ready || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className={clsx(
                    'flex items-start gap-2 pl-2.5 pr-1.5 py-2 rounded-xl border border-dashed backdrop-blur-sm',
                    LIGHT_SURFACE[bilan.severity],
                    LIGHT_BORDER[bilan.severity],
                    className
                )}
            >
                <BilanScenarioEmoji severity={bilan.severity} emoji={bilan.emoji} size="sm" />
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className={clsx('text-[11px] font-black uppercase leading-snug tracking-tight', bilan.colorClass)}>
                        {bilan.headline}
                    </p>
                    {bilan.message && (
                        <p className={clsx('text-[10px] font-bold leading-snug mt-0.5 line-clamp-2', bilan.textClass)}>
                            {bilan.message}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Fermer"
                    className={clsx(
                        'shrink-0 p-1 rounded-lg text-zinc-300 active:scale-90 transition-all',
                        LIGHT_DISMISS_HOVER[bilan.severity]
                    )}
                >
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
