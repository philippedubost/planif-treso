import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface InfoBubbleProps {
    id: string; // Used for animation key
    icon?: ReactNode;
    content: ReactNode;
    colorClasses?: string;
    onDismiss?: () => void;
    onNext?: () => void;
}

export function InfoBubble({
    id,
    icon = <span className="text-sm">💡</span>,
    content,
    colorClasses = "bg-amber-50 text-amber-800 border-amber-200",
    onDismiss,
    onNext
}: InfoBubbleProps) {
    return (
        <div className="max-w-sm mx-auto mt-3">
            <AnimatePresence mode="wait">
                <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className={clsx("rounded-xl p-2.5 border-2 flex items-center space-x-3 transition-colors", colorClasses)}
                >
                    <div className="shrink-0 flex items-center justify-center">
                        {icon}
                    </div>
                    <div className="text-[11px] font-bold leading-tight flex-1">
                        {content}
                    </div>
                    <div className="flex space-x-1 shrink-0">
                        {onNext && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNext();
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 active:scale-95 transition-all"
                                title="Astuce suivante"
                            >
                                <ChevronRight className="w-4 h-4 opacity-70" />
                            </button>
                        )}
                        {onDismiss && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDismiss();
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 active:scale-95 transition-all"
                                title="Fermer"
                            >
                                <X className="w-4 h-4 opacity-70" />
                            </button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
