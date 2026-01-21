/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TonConnectUIError } from 'src/errors';

export async function copyToClipboard(text: string): Promise<void> {
    try {
        if (!navigator?.clipboard) {
            throw new TonConnectUIError('Clipboard API not available');
        }

        return await navigator.clipboard.writeText(text);
    } catch (_e) {
        //
    }

    fallbackCopyTextToClipboard(text);
}

function fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
    } finally {
        document.body.removeChild(textArea);
    }
}
