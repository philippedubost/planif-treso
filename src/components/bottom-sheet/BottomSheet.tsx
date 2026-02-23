'use client';

import { Drawer } from 'vaul';
import { ReactNode } from 'react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
                <Drawer.Content className="bg-white dark:bg-zinc-900 flex flex-col rounded-t-[32px] h-[92%] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-t-[32px] flex-1 overflow-y-auto">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700 mb-8" />
                        <div className="max-w-md mx-auto">
                            {title && (
                                <Drawer.Title className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
                                    {title}
                                </Drawer.Title>
                            )}
                            {children}
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
