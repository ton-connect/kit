/**
 * Logger module for TonWalletKit with hierarchical prefix support
 *
 * Features:
 * - Configurable log levels (DEBUG, INFO, WARN, ERROR, NONE)
 * - Hierarchical logger creation with prefix inheritance
 * - Parent-child logger relationships
 * - Structured logging with context support
 * - Timestamp and stack trace options
 *
 * Example usage:
 * ```typescript
 * import { createLogger, LogLevel } from './Logger';
 *
 * // Create root logger
 * const appLogger = createLogger({
 *   level: LogLevel.DEBUG,
 *   prefix: 'WalletKit'
 * });
 *
 * // Create child loggers with inherited prefixes
 * const connectionLogger = appLogger.createChild('Connection');
 * const httpLogger = connectionLogger.createChild('HTTP');
 *
 * // Logs will show as: [WalletKit:Connection:HTTP] INFO: Request sent
 * httpLogger.info('Request sent');
 * ```
 */

/**
 * Log levels enum for controlling logger verbosity
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4,
}

/**
 * Logger configuration interface
 */
export interface LoggerConfig {
    level: LogLevel;
    prefix?: string;
    enableTimestamp?: boolean;
    enableStackTrace?: boolean;
    parent?: Logger;
}

/**
 * Context object for structured logging
 */
export interface LogContext {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

/**
 * Logger class for TonWalletKit
 * Provides structured logging with configurable levels and context support
 */
export class Logger {
    private config: LoggerConfig;
    private parent?: Logger;
    private static defaultConfig: LoggerConfig = {
        level: LogLevel.INFO,
        prefix: 'TonWalletKit',
        enableTimestamp: true,
        enableStackTrace: false,
    };

    constructor(config?: Partial<LoggerConfig>) {
        this.parent = config?.parent;
        this.config = { ...Logger.defaultConfig, ...config };

        // If we have a parent, inherit its configuration and build hierarchical prefix
        if (this.parent) {
            // Inherit parent's config but allow overrides
            this.config = {
                ...this.parent.config,
                ...config,
                // Build hierarchical prefix
                prefix: this.buildHierarchicalPrefix(config?.prefix),
            };
        }
    }

    /**
     * Update logger configuration
     */
    configure(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Create a child logger with a prefix that inherits from this logger
     */
    createChild(prefix: string, config?: Partial<LoggerConfig>): Logger {
        return new Logger({
            ...config,
            parent: this,
            prefix,
        });
    }

    /**
     * Build hierarchical prefix by combining parent prefix with current prefix
     */
    private buildHierarchicalPrefix(currentPrefix?: string): string {
        if (!this.parent || !currentPrefix) {
            return currentPrefix || this.parent?.config.prefix || '';
        }

        const parentPrefix = this.parent.config.prefix;
        if (!parentPrefix) {
            return currentPrefix;
        }

        return `${parentPrefix}:${currentPrefix}`;
    }

    /**
     * Get the full hierarchical prefix for this logger
     */
    getPrefix(): string {
        return this.config.prefix || '';
    }

    /**
     * Get the parent logger if it exists
     */
    getParent(): Logger | undefined {
        return this.parent;
    }

    /**
     * Log debug messages
     */
    debug(message: string, context?: LogContext): void {
        if (this.config.level <= LogLevel.DEBUG) {
            this.log('DEBUG', message, context);
        }
    }

    /**
     * Log info messages
     */
    info(message: string, context?: LogContext): void {
        if (this.config.level <= LogLevel.INFO) {
            this.log('INFO', message, context);
        }
    }

    /**
     * Log warning messages
     */
    warn(message: string, context?: LogContext): void {
        if (this.config.level <= LogLevel.WARN) {
            this.log('WARN', message, context);
        }
    }

    /**
     * Log error messages
     */
    error(message: string, context?: LogContext): void {
        if (this.config.level <= LogLevel.ERROR) {
            this.log('ERROR', message, context);
        }
    }

    /**
     * Internal logging method
     */
    private log(level: string, message: string, context?: LogContext): void {
        const timestamp = this.config.enableTimestamp ? new Date().toISOString() : '';
        const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';

        let logMessage = '';

        if (timestamp) {
            logMessage += `${timestamp} `;
        }

        if (prefix) {
            logMessage += `${prefix} `;
        }

        logMessage += `${level}: ${message}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const logArgs: any[] = [logMessage];

        if (context && Object.keys(context).length > 0) {
            logArgs.push(context);
        }

        // Use appropriate console method based on level
        switch (level) {
            case 'DEBUG':
                // eslint-disable-next-line no-console
                console.debug(...logArgs);
                break;
            case 'INFO':
                // eslint-disable-next-line no-console
                console.info(...logArgs);
                break;
            case 'WARN':
                // eslint-disable-next-line no-console
                console.warn(...logArgs);
                break;
            case 'ERROR':
                // eslint-disable-next-line no-console
                console.error(...logArgs);
                if (this.config.enableStackTrace) {
                    // eslint-disable-next-line no-console
                    console.trace();
                }
                break;
        }
    }
}

/**
 * Default logger instance
 */
export const globalLogger = new Logger({
    level: LogLevel.DEBUG,
    enableStackTrace: true,
});

/**
 * Create a logger with custom configuration
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
    return new Logger(config);
}
