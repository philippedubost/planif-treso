'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useTranslation } from './TranslationProvider';

export function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const { locale } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const switchLanguage = (newLocale: string) => {
        if (newLocale === locale) return;

        // Create new path by replacing the first segment (/fr or /en)
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);

        // Close the dropdown immediately
        setIsOpen(false);

        // Push the new route
        router.push(newPath);
    };

    const currentFlag = locale === 'fr' ? '🇫🇷' : '🇬🇧';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 md:w-12 md:h-12 bg-white border border-zinc-100 rounded-full flex items-center justify-center shadow-soft hover:shadow-premium transition-all active:scale-95 text-xl"
                title="Changer de langue"
            >
                {currentFlag}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-16 bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-50 p-2 z-[60] flex flex-col gap-2"
                    >
                        <button
                            onClick={() => switchLanguage('fr')}
                            className={clsx(
                                "w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all",
                                locale === 'fr' ? "bg-zinc-100 scale-110 shadow-sm" : "hover:bg-zinc-50 hover:scale-105 opacity-50 hover:opacity-100"
                            )}
                        >
                            🇫🇷
                        </button>
                        <button
                            onClick={() => switchLanguage('en')}
                            className={clsx(
                                "w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all",
                                locale === 'en' ? "bg-zinc-100 scale-110 shadow-sm" : "hover:bg-zinc-50 hover:scale-105 opacity-50 hover:opacity-100"
                            )}
                        >
                            🇬🇧
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
