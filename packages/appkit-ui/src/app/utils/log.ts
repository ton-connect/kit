/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function logDebug(...args: Parameters<typeof console.debug>): void {
    if (typeof console !== 'undefined') {
        try {
            // eslint-disable-next-line no-console
            console.debug('[TON_CONNECT_UI]', ...args);
        } catch {
            //
        }
    }
}

export function logError(...args: Parameters<typeof console.error>): void {
    if (typeof console !== 'undefined') {
        try {
            // eslint-disable-next-line no-console
            console.error('[TON_CONNECT_UI]', ...args);
        } catch {
            //
        }
    }
}

export function logWarning(...args: Parameters<typeof console.warn>): void {
    if (typeof console !== 'undefined') {
        try {
            // eslint-disable-next-line no-console
            console.warn('[TON_CONNECT_UI]', ...args);
        } catch {
            //
        }
    }
}
