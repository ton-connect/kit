/**
 * Enhanced Logger module for TonWalletKit with React Native support and detailed debugging
 *
 * Features:
 * - Configurable log levels (DEBUG, INFO, WARN, ERROR, NONE)
 * - Hierarchical logger creation with prefix inheritance
 * - Parent-child logger relationships
 * - Structured logging with context support
 * - Timestamp and stack trace options
 * - React Native specific logging enhancements
 * - Detailed error tracking and context preservation
 * - Performance timing for critical operations
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
    enablePerformance?: boolean;
    enableReactNativeLogs?: boolean;
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
 * Performance timing data
 */
export interface PerformanceData {
    operation: string;
    duration: number;
    timestamp: number;
    context?: LogContext;
}

/**
 * Enhanced Logger class for TonWalletKit with React Native support
 * Provides structured logging with configurable levels and context support
 */
export class Logger {
    private config: LoggerConfig;
    private parent?: Logger;
    private performanceTimers = new Map<string, number>();
    private static defaultConfig: LoggerConfig = {
        level: LogLevel.INFO,
        prefix: 'TonWalletKit',
        enableTimestamp: true,
        enableStackTrace: false,
        enablePerformance: true,
        enableReactNativeLogs: true,
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

        // Log logger creation for debugging
        if (this.config.level <= LogLevel.DEBUG) {
            this.log('DEBUG', 'Logger created', {
                prefix: this.config.prefix,
                level: LogLevel[this.config.level],
                enableTimestamp: this.config.enableTimestamp,
                enableStackTrace: this.config.enableStackTrace,
                enablePerformance: this.config.enablePerformance,
                enableReactNativeLogs: this.config.enableReactNativeLogs,
            });
        }
    }

    /**
     * Update logger configuration
     */
    configure(config: Partial<LoggerConfig>): void {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...config };

        this.debug('Logger configuration updated', {
            old: oldConfig,
            new: this.config,
            changes: Object.keys(config),
        });
    }

    /**
     * Create a child logger with a prefix that inherits from this logger
     */
    createChild(prefix: string, config?: Partial<LoggerConfig>): Logger {
        const childLogger = new Logger({
            ...config,
            parent: this,
            prefix,
        });

        this.debug('Child logger created', {
            childPrefix: prefix,
            childConfig: config,
            parentPrefix: this.config.prefix,
        });

        return childLogger;
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
     * Start performance timer for an operation
     */
    startTimer(operation: string): void {
        if (this.config.enablePerformance) {
            this.performanceTimers.set(operation, performance.now());
            this.debug('Performance timer started', { operation });
        }
    }

    /**
     * End performance timer and log duration
     */
    endTimer(operation: string, context?: LogContext): void {
        if (this.config.enablePerformance) {
            const startTime = this.performanceTimers.get(operation);
            if (startTime) {
                const duration = performance.now() - startTime;
                this.performanceTimers.delete(operation);

                this.info('Performance measurement', {
                    operation,
                    duration: `${duration.toFixed(2)}ms`,
                    ...context,
                });
            }
        }
    }

    /**
     * Log debug messages with enhanced context
     */
    debug(message: string, context?: LogContext): void {
        if (this.config.level <= LogLevel.DEBUG) {
            this.log('DEBUG', message, context);
        }
    }

    /**
     * Log info messages with enhanced context
     */
    info(message: string, context?: LogContext): void {
        if (this.config.level <= LogLevel.INFO) {
            this.log('INFO', message, context);
        }
    }

    /**
     * Log warning messages with enhanced context
     */
    warn(message: string, context?: LogContext): void {
        if (this.config.level <= LogLevel.WARN) {
            this.log('WARN', message, context);
        }
    }

    /**
     * Log error messages with enhanced context and error details
     */
    error(message: string, context?: LogContext, error?: Error): void {
        if (this.config.level <= LogLevel.ERROR) {
            const enhancedContext = {
                ...context,
                errorName: error?.name,
                errorMessage: error?.message,
                errorStack: error?.stack,
                errorCause: error?.cause,
            };
            this.log('ERROR', message, enhancedContext);
        }
    }

    /**
     * Log critical errors with maximum detail
     */
    critical(message: string, context?: LogContext, error?: Error): void {
        // Critical errors are always logged regardless of level
        const enhancedContext = {
            ...context,
            errorName: error?.name,
            errorMessage: error?.message,
            errorStack: error?.stack,
            errorCause: error?.cause,
            timestamp: new Date().toISOString(),
            loggerPrefix: this.config.prefix,
            parentPrefix: this.parent?.config.prefix,
        };
        this.log('CRITICAL', message, enhancedContext);
    }

    /**
     * Internal logging method with enhanced formatting
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
            // Enhanced context formatting for React Native
            const formattedContext = this.formatContextForReactNative(context);
            logArgs.push(formattedContext);
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
            case 'CRITICAL':
                // eslint-disable-next-line no-console
                console.error(...logArgs);
                if (this.config.enableStackTrace) {
                    // eslint-disable-next-line no-console
                    console.trace();
                }
                break;
        }

        // Additional React Native specific logging
        if (this.config.enableReactNativeLogs && this.isReactNativeEnvironment()) {
            this.logToReactNative(level, message, context);
        }
    }

    /**
     * Format context for better readability in React Native
     */
    private formatContextForReactNative(context: LogContext): LogContext {
        const formatted: LogContext = {};

        for (const [key, value] of Object.entries(context)) {
            if (value instanceof Error) {
                formatted[key] = {
                    name: value.name,
                    message: value.message,
                    stack: value.stack,
                    cause: value.cause,
                };
            } else if (typeof value === 'object' && value !== null) {
                try {
                    // Try to stringify objects for better React Native compatibility
                    formatted[key] = JSON.parse(JSON.stringify(value));
                } catch {
                    formatted[key] = String(value);
                }
            } else {
                formatted[key] = value;
            }
        }

        return formatted;
    }

    /**
     * Check if running in React Native environment
     */
    private isReactNativeEnvironment(): boolean {
        return (
            (typeof global !== 'undefined' && global.navigator && global.navigator.product === 'ReactNative') ||
            (typeof window !== 'undefined' && window.navigator && window.navigator.product === 'ReactNative')
        );
    }

    /**
     * Additional logging for React Native environment
     */
    private logToReactNative(level: string, message: string, context?: LogContext): void {
        try {
            // React Native specific logging can go here
            // For example, using React Native's LogBox or other native logging
            if (typeof global !== 'undefined' && (global as Record<string, unknown>).__DEV__) {
                // Development mode logging
                // eslint-disable-next-line no-console
                console.log(`[RN-${level}] ${message}`, context);
            }
        } catch (error) {
            // Fallback to regular console if React Native logging fails
            // eslint-disable-next-line no-console
            console.warn('Failed to log to React Native', error);
        }
    }

    /**
     * Get current logger configuration
     */
    getConfig(): LoggerConfig {
        return { ...this.config };
    }

    /**
     * Check if a specific log level is enabled
     */
    isLevelEnabled(level: LogLevel): boolean {
        return this.config.level <= level;
    }
}

/**
 * Default logger instance with enhanced debugging
 */
export const globalLogger = new Logger({
    level: LogLevel.DEBUG,
    enableStackTrace: true,
    enablePerformance: true,
    enableReactNativeLogs: true,
});

/**
 * Create a logger with custom configuration
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
    return new Logger(config);
}

/**
 * Create a logger specifically for React Native with optimal settings
 */
export function createReactNativeLogger(prefix?: string): Logger {
    return new Logger({
        level: LogLevel.DEBUG,
        prefix,
        enableTimestamp: true,
        enableStackTrace: true,
        enablePerformance: true,
        enableReactNativeLogs: true,
    });
}
