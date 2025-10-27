/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';

import { log } from '../utils/logger';

// Hook to listen for paste events and handle TON Connect URLs
export function usePasteHandler(handleTonConnectUrl: (url: string) => Promise<void>) {
    useEffect(() => {
        const handlePaste = async (event: ClipboardEvent) => {
            try {
                const pastedText = event.clipboardData?.getData('text');
                if (pastedText && pastedText.trim()) {
                    // Check if the pasted text looks like a TON Connect URL
                    const trimmedText = pastedText.trim();
                    if (
                        trimmedText.startsWith('tc://') ||
                        trimmedText.startsWith('ton://') ||
                        trimmedText.startsWith('https://') ||
                        trimmedText.startsWith('http://')
                    ) {
                        log.info('Detected potential TON Connect URL in paste:', trimmedText);
                        await handleTonConnectUrl(trimmedText);
                    }
                }
            } catch (err) {
                log.error('Error handling paste event:', err);
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [handleTonConnectUrl]);
}
