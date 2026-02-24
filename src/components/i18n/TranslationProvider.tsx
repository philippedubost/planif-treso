'use client';

import React, { createContext, useContext } from 'react';

type Dictionary = Record<string, any>; // Adjust this to match your actual dictionary structure or use a recursive type if needed

interface TranslationContextType {
    dictionary: Dictionary;
    locale: string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({
    children,
    dictionary,
    locale,
}: {
    children: React.ReactNode;
    dictionary: Dictionary;
    locale: string;
}) {
    return (
        <TranslationContext.Provider value={{ dictionary, locale }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
}
