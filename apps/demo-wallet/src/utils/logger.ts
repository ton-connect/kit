/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createConsola } from 'consola';

// Get log level from localStorage or fallback to environment-based level
const getInitialLogLevel = (): number => {
    try {
        const storedLevel = typeof localStorage !== 'undefined' ? localStorage.getItem('wallet-log-level') : null;
        if (storedLevel !== null) {
            const level = parseInt(storedLevel, 10);
            // Validate level is within consola's range (0-5)
            if (level >= 0 && level <= 5) {
                return level;
            }
        }
    } catch (error) {
        // localStorage might not be available (SSR, etc.)
        // Can't use our logger here since it's not created yet, fallback to console
        // eslint-disable-next-line no-console
        console.warn('Failed to read log level from localStorage:', error);
    }
    // Fallback to environment-based level
    return import.meta?.env?.DEV ? 4 : 2; // Debug level in dev, Info level in prod
};

// Create a custom logger instance with wallet-specific configuration
const logger = createConsola({
    level: getInitialLogLevel(),
    formatOptions: {
        colors: true,
        compact: false,
        date: true,
    },
});

// Add wallet-specific context to all logs
const walletLogger = logger.withTag('wallet');

// Export different log levels for convenience
export const log = {
    // Debug level - only in development
    debug: (message: string, ...args: any[]) => {
        walletLogger.debug(message, ...args);
    },

    // Info level - general information
    info: (message: string, ...args: any[]) => {
        walletLogger.info(message, ...args);
    },

    // Success level - for successful operations
    success: (message: string, ...args: any[]) => {
        walletLogger.success(message, ...args);
    },

    // Warning level - for warnings
    warn: (message: string, ...args: any[]) => {
        walletLogger.warn(message, ...args);
    },

    // Error level - for errors
    error: (message: string, error?: Error | any, ...args: any[]) => {
        if (error instanceof Error) {
            walletLogger.error(message, error.message, error.stack, ...args);
        } else if (error) {
            walletLogger.error(message, error, ...args);
        } else {
            walletLogger.error(message, ...args);
        }
    },

    // Fatal level - for critical errors
    fatal: (message: string, error?: Error | any, ...args: any[]) => {
        if (error instanceof Error) {
            walletLogger.fatal(message, error.message, error.stack, ...args);
        } else if (error) {
            walletLogger.fatal(message, error, ...args);
        } else {
            walletLogger.fatal(message, ...args);
        }
    },
};

// Export specialized loggers for different components
export const createComponentLogger = (component: string) => {
    const componentLogger = walletLogger.withTag(component);

    return {
        debug: (message: string, ...args: any[]) => componentLogger.debug(message, ...args),
        info: (message: string, ...args: any[]) => componentLogger.info(message, ...args),
        success: (message: string, ...args: any[]) => componentLogger.success(message, ...args),
        warn: (message: string, ...args: any[]) => componentLogger.warn(message, ...args),
        error: (message: string, error?: Error | any, ...args: any[]) => {
            if (error instanceof Error) {
                componentLogger.error(message, error.message, error.stack, ...args);
            } else if (error) {
                componentLogger.error(message, error, ...args);
            } else {
                componentLogger.error(message, ...args);
            }
        },
        fatal: (message: string, error?: Error | any, ...args: any[]) => {
            if (error instanceof Error) {
                componentLogger.fatal(message, error.message, error.stack, ...args);
            } else if (error) {
                componentLogger.fatal(message, error, ...args);
            } else {
                componentLogger.fatal(message, ...args);
            }
        },
    };
};

// Export the main logger instance for advanced usage
export { walletLogger as logger };

// Utility function to change log level at runtime
export const setLogLevel = (level: number): void => {
    if (level >= 0 && level <= 5) {
        try {
            localStorage.setItem('wallet-log-level', level.toString());
            logger.level = level;
            log.info(`Log level changed to ${level}`);
        } catch (error) {
            log.error('Failed to save log level to localStorage:', error);
        }
    } else {
        log.error('Invalid log level. Must be between 0-5 (0=silent, 1=fatal, 2=error, 3=warn, 4=info, 5=debug)');
    }
};

// Utility function to get current log level
export const getLogLevel = (): number => {
    return logger.level;
};

// Export default logger
export default log;

/*
Usage examples:

// Basic logging
import log from './utils/logger';
log.info('User connected wallet');
log.error('Transaction failed', error);

// Component-specific logging
import { createComponentLogger } from './utils/logger';
const componentLog = createComponentLogger('WalletDashboard');
componentLog.debug('Component mounted');

// Runtime log level control (useful for debugging)
import { setLogLevel, getLogLevel } from './utils/logger';
setLogLevel(5); // Enable debug logging

// Log levels:
// 0 = silent
// 1 = fatal
// 2 = error  
// 3 = warn
// 4 = info (default in dev)
// 5 = debug
*/
