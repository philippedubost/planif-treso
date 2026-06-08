'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
    mascotVariants,
    mascotIdleVariants,
    titleVariants,
    subtitleVariants,
    staggerContainerVariants,
    staggerItemVariants,
    fieldCardVariants,
    fieldCardRightVariants,
    ctaVariants,
    chipPopVariants,
    SPRING_BOUNCY,
} from './onboardingMotion';

export function OnboardingMascot({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={mascotVariants}
            initial="initial"
            animate="animate"
            className={className}
        >
            <motion.div variants={mascotIdleVariants} animate="animate" className="h-full w-full relative">
                {children}
            </motion.div>
        </motion.div>
    );
}

export function OnboardingTitle({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.h2
            variants={titleVariants}
            initial="initial"
            animate="animate"
            className={className}
        >
            {children}
        </motion.h2>
    );
}

export function OnboardingSubtitle({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.p
            variants={subtitleVariants}
            initial="initial"
            animate="animate"
            className={className}
        >
            {children}
        </motion.p>
    );
}

export function OnboardingStagger({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function OnboardingStaggerItem({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div variants={staggerItemVariants} className={className}>
            {children}
        </motion.div>
    );
}

export function OnboardingFieldCard({
    children,
    className,
    fromRight = false,
}: {
    children: ReactNode;
    className?: string;
    fromRight?: boolean;
}) {
    return (
        <motion.div
            variants={fromRight ? fieldCardRightVariants : fieldCardVariants}
            initial="initial"
            animate="animate"
            whileTap={{ scale: 0.98 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function OnboardingChip({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.span
            variants={chipPopVariants}
            initial="initial"
            animate="animate"
            transition={{ ...SPRING_BOUNCY, delay }}
            className={className}
        >
            {children}
        </motion.span>
    );
}

export function OnboardingCTAButton({
    children,
    onClick,
    disabled = false,
    variant = 'primary',
    className,
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    className?: string;
}) {
    return (
        <motion.button
            variants={ctaVariants}
            initial="initial"
            animate="animate"
            whileTap={disabled ? undefined : { scale: 0.94 }}
            whileHover={disabled ? undefined : { scale: 1.02 }}
            disabled={disabled}
            onClick={onClick}
            className={clsx(
                'w-full py-[18px] rounded-[24px] font-black italic text-[15px] transition-colors flex items-center justify-center space-x-2',
                variant === 'primary' && !disabled && 'bg-zinc-900 text-white shadow-premium',
                variant === 'primary' && disabled && 'bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-70',
                variant === 'secondary' && 'bg-zinc-100 text-zinc-500',
                className
            )}
        >
            {children}
        </motion.button>
    );
}

export function OnboardingPopButton({
    children,
    onClick,
    className,
    selected = false,
}: {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    selected?: boolean;
}) {
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.9 }}
            animate={selected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={SPRING_BOUNCY}
            className={className}
        >
            {children}
        </motion.button>
    );
}
