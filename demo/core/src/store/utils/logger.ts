/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface StoreLogger {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
}

export const createLogger = (customLogger?: StoreLogger) => {
    if (customLogger) return customLogger;

    return {
        // eslint-disable-next-line no-console
        info: (...args: unknown[]) => console.log('[WalletStore]', ...args),
        // eslint-disable-next-line no-console
        warn: (...args: unknown[]) => console.warn('[WalletStore]', ...args),
        // eslint-disable-next-line no-console
        error: (...args: unknown[]) => console.error('[WalletStore]', ...args),
    };
};
