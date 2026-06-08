'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { BilanSeverity, OnboardingBilan } from '@/lib/onboardingBilan';
import { stampVariants, stampRingVariants, SPRING_SNAPPY } from './onboardingMotion';

const EMOJI_MOTION: Record<BilanSeverity, object> = {
    success: { scale: [1, 1.18, 1], rotate: [0, 8, -6, 0] },
    warning: { rotate: [0, -10, 10, -5, 0] },
    danger: { x: [0, -4, 4, -3, 3, 0] },
    neutral: { y: [0, -5, 0] },
};

const EMOJI_TRANSITION: Record<BilanSeverity, object> = {
    success: { duration: 0.7, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' },
    warning: { duration: 0.55, repeat: Infinity, repeatDelay: 2.8, ease: 'easeInOut' },
    danger: { duration: 0.45, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' },
    neutral: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
};

const STAMP_BORDER: Record<BilanSeverity, string> = {
    success: 'border-emerald-300/70',
    warning: 'border-amber-300/70',
    danger: 'border-rose-400/80',
    neutral: 'border-zinc-300/70',
};

interface BilanScenarioCardProps {
    bilan: OnboardingBilan;
    showMessage?: boolean;
    hideHeadline?: boolean;
    stamp?: boolean;
    className?: string;
}

export function BilanScenarioEmoji({ severity, emoji, size = 'md' }: { severity: BilanSeverity; emoji: string; size?: 'sm' | 'md' | 'lg' }) {
    return (
        <motion.span
            className={clsx(
                'shrink-0 leading-none select-none',
                size === 'sm' && 'text-xl',
                size === 'md' && 'text-2xl',
                size === 'lg' && 'text-3xl'
            )}
            animate={EMOJI_MOTION[severity]}
            transition={EMOJI_TRANSITION[severity]}
        >
            {emoji}
        </motion.span>
    );
}

function BilanContentInner({
    bilan,
    showMessage,
    hideHeadline,
    stamp,
}: {
    bilan: OnboardingBilan;
    showMessage: boolean;
    hideHeadline: boolean;
    stamp: boolean;
}) {
    return (
        <>
            <BilanScenarioEmoji severity={bilan.severity} emoji={bilan.emoji} size="lg" />
            <div className="space-y-1 min-w-0 text-left">
                {!hideHeadline && (
                    <motion.p
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: stamp ? 0.62 : 0.1, ...SPRING_SNAPPY }}
                        className={clsx('text-sm font-black leading-snug uppercase tracking-tight', bilan.colorClass)}
                    >
                        {bilan.headline}
                    </motion.p>
                )}
                {showMessage && (
                    <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: hideHeadline ? 0.58 : 0.7, duration: 0.25 }}
                        className={clsx('text-[13px] font-bold leading-snug', bilan.textClass)}
                    >
                        {bilan.message}
                    </motion.p>
                )}
            </div>
        </>
    );
}

export function BilanScenarioCard({
    bilan,
    showMessage = true,
    hideHeadline = false,
    stamp = true,
    className,
}: BilanScenarioCardProps) {
    if (stamp) {
        return (
            <div className={clsx('relative pt-1', className)}>
                <motion.div
                    variants={stampRingVariants}
                    initial="initial"
                    animate="animate"
                    className={clsx(
                        'absolute inset-0 rounded-2xl border-2 pointer-events-none',
                        STAMP_BORDER[bilan.severity]
                    )}
                />
                <motion.div
                    key={`stamp-${bilan.headline}`}
                    variants={stampVariants}
                    initial="initial"
                    animate="animate"
                    className={clsx(
                        'p-3.5 rounded-2xl flex gap-3 items-start border-2 border-dashed shadow-sm relative',
                        bilan.bgClass,
                        STAMP_BORDER[bilan.severity]
                    )}
                >
                    <BilanContentInner
                        bilan={bilan}
                        showMessage={showMessage}
                        hideHeadline={hideHeadline}
                        stamp={stamp}
                    />
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            key={`${bilan.severity}-${bilan.headline}`}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={SPRING_SNAPPY}
            className={clsx('p-3 rounded-2xl flex gap-3 items-start', bilan.bgClass, className)}
        >
            <BilanContentInner
                bilan={bilan}
                showMessage={showMessage}
                hideHeadline={hideHeadline}
                stamp={false}
            />
        </motion.div>
    );
}

export function BilanScenarioBadge({ bilan }: { bilan: OnboardingBilan }) {
    return (
        <div className="relative inline-block">
            <motion.div
                variants={stampRingVariants}
                initial="initial"
                animate="animate"
                className={clsx(
                    'absolute inset-0 rounded-2xl border-2 pointer-events-none',
                    STAMP_BORDER[bilan.severity]
                )}
            />
            <motion.div
                key={`badge-${bilan.headline}`}
                variants={stampVariants}
                initial="initial"
                animate="animate"
                className={clsx(
                    'inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed shadow-sm',
                    bilan.bgClass,
                    STAMP_BORDER[bilan.severity]
                )}
            >
                <BilanScenarioEmoji severity={bilan.severity} emoji={bilan.emoji} size="sm" />
                <h2 className={clsx('text-[17px] font-black italic tracking-tight uppercase', bilan.colorClass)}>
                    {bilan.headline}
                </h2>
            </motion.div>
        </div>
    );
}
