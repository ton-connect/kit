/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Logging utility controlled via window.__WALLETKIT_LOG_LEVEL__.
 * Defaults to OFF in production.
 */

export enum LogLevel {
    OFF = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
}

type LogLevelString = 'OFF' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

type LogWindow = Window & { __WALLETKIT_LOG_LEVEL__?: LogLevelString };

type ConsoleLike = {
    log?: (...args: unknown[]) => void;
    warn?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
};

const logWindow = window as LogWindow;
const consoleRef = (globalThis as { console?: ConsoleLike }).console;

/**
 * Get the current log level from window
 */
function getCurrentLogLevel(): LogLevel {
    const levelStr = logWindow.__WALLETKIT_LOG_LEVEL__ || 'OFF';
    return LogLevel[levelStr] ?? LogLevel.OFF;
}

export const log = (...args: unknown[]): void => {
    if (getCurrentLogLevel() >= LogLevel.DEBUG) {
        consoleRef?.log?.('[WalletKit]', ...args);
    }
};

export const info = (...args: unknown[]): void => {
    if (getCurrentLogLevel() >= LogLevel.INFO) {
        consoleRef?.log?.('[WalletKit]', ...args);
    }
};

export const warn = (...args: unknown[]): void => {
    if (getCurrentLogLevel() >= LogLevel.WARN) {
        consoleRef?.warn?.('[WalletKit]', ...args);
    }
};

export const error = (...args: unknown[]): void => {
    if (getCurrentLogLevel() >= LogLevel.ERROR) {
        consoleRef?.error?.('[WalletKit]', ...args);
    }
};
