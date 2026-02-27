'use client';

import { useEffect } from 'react';

/**
 * Custom hook to force the viewport zoom to 100% when a modal or special UI is opened.
 * This is particularly useful on mobile to prevent layout issues if the user was 
 * manually zoomed in.
 */
export function useResetZoom(isOpen: boolean) {
    useEffect(() => {
        if (isOpen) {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                const originalContent = viewport.getAttribute('content');

                // Setting maximum-scale=1 temporarily forces the browser to reset zoom to 100%
                viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');

                return () => {
                    if (originalContent) {
                        viewport.setAttribute('content', originalContent);
                    }
                };
            }
        }
    }, [isOpen]);
}
