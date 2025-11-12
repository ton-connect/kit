/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Conditional logging utility for the Android WalletKit bridge.
 *
 * Logs are disabled by default in production and can be enabled by setting:
 * window.__WALLETKIT_DEBUG__ = true;
 *
 * This allows for debugging in production when needed without flooding logs.
 */

type DebugWindow = Window & { __WALLETKIT_DEBUG__?: boolean };

type ConsoleLike = {
    log?: (...args: unknown[]) => void;
    warn?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
};

const debugWindow = window as DebugWindow;
const DEBUG_ENABLED = Boolean(debugWindow.__WALLETKIT_DEBUG__);

const consoleRef = (globalThis as { console?: ConsoleLike }).console;

/**
 * Debug logger - only logs when DEBUG_ENABLED is true
 */
export const debugLog = (...args: unknown[]): void => {
    if (DEBUG_ENABLED) {
        consoleRef?.log?.(...args);
    }
};

/**
 * Warning logger - only logs when DEBUG_ENABLED is true
 */
export const debugWarn = (...args: unknown[]): void => {
    if (DEBUG_ENABLED) {
        consoleRef?.warn?.(...args);
    }
};

/**
 * Error logger - only logs when DEBUG_ENABLED is true
 */
export const debugError = (...args: unknown[]): void => {
    if (DEBUG_ENABLED) {
        consoleRef?.error?.(...args);
    }
};

/**
 * Always log errors (for critical failures that should always be visible)
 */
export const logError = (...args: unknown[]): void => {
    consoleRef?.error?.(...args);
};

/**
 * Always log warnings (for important warnings that should always be visible)
 */
export const logWarn = (...args: unknown[]): void => {
    consoleRef?.warn?.(...args);
};
