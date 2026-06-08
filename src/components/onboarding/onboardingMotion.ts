import type { Transition, Variants } from 'framer-motion';

export const SPRING_BOUNCY: Transition = { type: 'spring', stiffness: 480, damping: 22, mass: 0.85 };
export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 620, damping: 26, mass: 0.75 };
export const STAMP_SPRING: Transition = { type: 'spring', stiffness: 720, damping: 15, mass: 0.65 };

export const mascotVariants: Variants = {
    initial: { opacity: 0, scale: 0.4, y: 28, rotate: -8 },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        rotate: 0,
        transition: { ...SPRING_BOUNCY, delay: 0.05 },
    },
};

export const mascotIdleVariants: Variants = {
    animate: {
        y: [0, -6, 0],
        rotate: [0, 2, -2, 0],
        transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
    },
};

export const titleVariants: Variants = {
    initial: { opacity: 0, y: 18, scale: 0.92 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { ...SPRING_BOUNCY, delay: 0.12 },
    },
};

export const subtitleVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { ...SPRING_SNAPPY, delay: 0.2 },
    },
};

export const staggerContainerVariants: Variants = {
    initial: {},
    animate: {
        transition: { staggerChildren: 0.09, delayChildren: 0.22 },
    },
};

export const staggerItemVariants: Variants = {
    initial: { opacity: 0, y: 14, scale: 0.94 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: SPRING_SNAPPY,
    },
};

export const fieldCardVariants: Variants = {
    initial: { opacity: 0, x: -20, scale: 0.96 },
    animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: SPRING_BOUNCY,
    },
};

export const fieldCardRightVariants: Variants = {
    initial: { opacity: 0, x: 20, scale: 0.96 },
    animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: SPRING_BOUNCY,
    },
};

export const ctaVariants: Variants = {
    initial: { opacity: 0, y: 20, scale: 0.9 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { ...SPRING_BOUNCY, delay: 0.32 },
    },
};

export const stampVariants: Variants = {
    initial: { scale: 2.6, opacity: 0, rotate: -16, y: -48 },
    animate: {
        scale: [2.6, 0.92, 1.04, 1],
        opacity: 1,
        rotate: [-16, -3, -1.5, -2.5],
        y: [-48, 4, -2, 0],
        transition: {
            delay: 0.42,
            duration: 0.55,
            times: [0, 0.55, 0.78, 1],
            ease: [0.22, 1.2, 0.36, 1],
        },
    },
};

export const stampRingVariants: Variants = {
    initial: { scale: 0.6, opacity: 0 },
    animate: {
        scale: [0.6, 1.6, 2],
        opacity: [0, 0.45, 0],
        transition: { delay: 0.5, duration: 0.45, ease: 'easeOut' },
    },
};

export const chipPopVariants: Variants = {
    initial: { opacity: 0, scale: 0.6 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: SPRING_BOUNCY,
    },
};
