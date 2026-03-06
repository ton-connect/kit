/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative mx-3 max-h-[calc(100vh-24px)] w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-4 shadow-2xl animate-slide-up sm:mx-4 sm:max-h-[calc(100vh-32px)] sm:p-6">
                <div className="mb-4 flex items-center justify-between sm:mb-5">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose} className="text-neutral-600 transition-colors hover:text-white">
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
