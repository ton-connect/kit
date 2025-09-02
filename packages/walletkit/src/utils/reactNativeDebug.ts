/**
 * React Native specific debugging utilities for TonWalletKit
 * Provides enhanced logging, performance monitoring, and debugging helpers
 */

import { createReactNativeLogger } from '../core/Logger';

const log = createReactNativeLogger('ReactNativeDebug');

/**
 * React Native environment detection
 */
export const isReactNative = (): boolean => {
    return (
        (typeof global !== 'undefined' && global.navigator && global.navigator.product === 'ReactNative') ||
        (typeof window !== 'undefined' && window.navigator && window.navigator.product === 'ReactNative')
    );
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
    return (
        (typeof global !== 'undefined' && (global as Record<string, unknown>).__DEV__ === true) ||
        (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__DEV__ === true)
    );
};

/**
 * Enhanced error logging for React Native
 */
export const logReactNativeError = (
    context: string,
    error: unknown,
    additionalInfo?: Record<string, unknown>,
): void => {
    const errorInfo = {
        context,
        timestamp: new Date().toISOString(),
        isReactNative: isReactNative(),
        isDevelopment: isDevelopment(),
        error:
            error instanceof Error
                ? {
                      name: error.name,
                      message: error.message,
                      stack: error.stack,
                      cause: error.cause,
                  }
                : String(error),
        ...additionalInfo,
    };

    log.critical('React Native Error', errorInfo, error instanceof Error ? error : new Error(String(error)));

    // Additional React Native specific error reporting
    if (isReactNative() && isDevelopment()) {
        // In development mode, we can use more detailed logging
        // eslint-disable-next-line no-console
        console.group(`🚨 React Native Error: ${context}`);
        // eslint-disable-next-line no-console
        console.error('Error details:', errorInfo);
        // eslint-disable-next-line no-console
        console.error('Original error:', error);
        // eslint-disable-next-line no-console
        console.groupEnd();
    }
};

/**
 * Performance monitoring for React Native
 */
export class ReactNativePerformanceMonitor {
    private timers = new Map<string, number>();
    private measurements: Array<{
        operation: string;
        duration: number;
        timestamp: string;
        context?: Record<string, unknown>;
    }> = [];

    /**
     * Start timing an operation
     */
    startTimer(operation: string): void {
        this.timers.set(operation, performance.now());
        log.debug('Performance timer started', { operation });
    }

    /**
     * End timing an operation and record the measurement
     */
    endTimer(operation: string, context?: Record<string, unknown>): void {
        const startTime = this.timers.get(operation);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.timers.delete(operation);

            const measurement = {
                operation,
                duration,
                timestamp: new Date().toISOString(),
                context,
            };

            this.measurements.push(measurement);

            log.info('Performance measurement recorded', measurement);

            // Log slow operations
            if (duration > 1000) {
                log.warn('Slow operation detected', {
                    operation,
                    duration: `${duration.toFixed(2)}ms`,
                    context,
                });
            }
        }
    }

    /**
     * Get all performance measurements
     */
    getMeasurements(): Array<{
        operation: string;
        duration: number;
        timestamp: string;
        context?: Record<string, unknown>;
    }> {
        return [...this.measurements];
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary(): {
        totalOperations: number;
        averageDuration: number;
        slowestOperation: string | null;
        slowestDuration: number | null;
        fastestOperation: string | null;
        fastestDuration: number | null;
    } {
        if (this.measurements.length === 0) {
            return {
                totalOperations: 0,
                averageDuration: 0,
                slowestOperation: null,
                slowestDuration: null,
                fastestOperation: null,
                fastestDuration: null,
            };
        }

        const totalDuration = this.measurements.reduce((sum, m) => sum + m.duration, 0);
        const averageDuration = totalDuration / this.measurements.length;

        const slowest = this.measurements.reduce((max, m) => (m.duration > max.duration ? m : max));
        const fastest = this.measurements.reduce((min, m) => (m.duration < min.duration ? m : min));

        return {
            totalOperations: this.measurements.length,
            averageDuration,
            slowestOperation: slowest.operation,
            slowestDuration: slowest.duration,
            fastestOperation: fastest.operation,
            fastestDuration: fastest.duration,
        };
    }

    /**
     * Clear all measurements
     */
    clearMeasurements(): void {
        this.measurements = [];
        this.timers.clear();
        log.debug('Performance measurements cleared');
    }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new ReactNativePerformanceMonitor();

/**
 * Debug information collector for React Native
 */
export class ReactNativeDebugInfo {
    private static instance: ReactNativeDebugInfo;
    private info: Map<string, unknown> = new Map();

    private constructor() {
        this.collectSystemInfo();
    }

    static getInstance(): ReactNativeDebugInfo {
        if (!ReactNativeDebugInfo.instance) {
            ReactNativeDebugInfo.instance = new ReactNativeDebugInfo();
        }
        return ReactNativeDebugInfo.instance;
    }

    /**
     * Collect system information
     */
    private collectSystemInfo(): void {
        try {
            this.info.set('environment', {
                isReactNative: isReactNative(),
                isDevelopment: isDevelopment(),
                timestamp: new Date().toISOString(),
            });

            this.info.set('platform', {
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
                platform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
                language: typeof navigator !== 'undefined' ? navigator.language : 'N/A',
            });

            if (isReactNative()) {
                this.info.set('reactNative', {
                    product: 'ReactNative',
                    version: 'Detected',
                });
            }

            log.debug('System information collected', {
                environment: this.info.get('environment'),
                platform: this.info.get('platform'),
                reactNative: this.info.get('reactNative'),
            });
        } catch (error) {
            log.error('Failed to collect system information', { error });
        }
    }

    /**
     * Add custom debug information
     */
    setInfo(key: string, value: unknown): void {
        this.info.set(key, value);
        log.debug('Debug info updated', { key, value });
    }

    /**
     * Get debug information
     */
    getInfo(key: string): unknown {
        return this.info.get(key);
    }

    /**
     * Get all debug information
     */
    getAllInfo(): Record<string, unknown> {
        const result: Record<string, unknown> = {};
        for (const [key, value] of this.info.entries()) {
            result[key] = value;
        }
        return result;
    }

    /**
     * Export debug information for troubleshooting
     */
    exportDebugInfo(): string {
        try {
            const debugInfo = {
                timestamp: new Date().toISOString(),
                systemInfo: this.getAllInfo(),
                performance: globalPerformanceMonitor.getPerformanceSummary(),
            };

            return JSON.stringify(debugInfo, null, 2);
        } catch (error) {
            log.error('Failed to export debug info', { error });
            return 'Failed to export debug info';
        }
    }
}

/**
 * Global debug info instance
 */
export const globalDebugInfo = ReactNativeDebugInfo.getInstance();

/**
 * React Native specific logging wrapper
 */
export const reactNativeLog = {
    debug: (message: string, context?: Record<string, unknown>): void => {
        log.debug(message, {
            ...context,
            reactNative: true,
            timestamp: new Date().toISOString(),
        });
    },

    info: (message: string, context?: Record<string, unknown>): void => {
        log.info(message, {
            ...context,
            reactNative: true,
            timestamp: new Date().toISOString(),
        });
    },

    warn: (message: string, context?: Record<string, unknown>): void => {
        log.warn(message, {
            ...context,
            reactNative: true,
            timestamp: new Date().toISOString(),
        });
    },

    error: (message: string, context?: Record<string, unknown>, error?: Error): void => {
        log.error(
            message,
            {
                ...context,
                reactNative: true,
                timestamp: new Date().toISOString(),
            },
            error,
        );
    },

    critical: (message: string, context?: Record<string, unknown>, error?: Error): void => {
        log.critical(
            message,
            {
                ...context,
                reactNative: true,
                timestamp: new Date().toISOString(),
            },
            error,
        );
    },
};

/**
 * Initialize React Native debugging
 */
export const initializeReactNativeDebugging = (): void => {
    if (isReactNative()) {
        log.info('React Native debugging initialized', {
            isDevelopment: isDevelopment(),
            timestamp: new Date().toISOString(),
        });

        // Log system information
        const debugInfo = globalDebugInfo.getAllInfo();
        log.debug('System debug information', debugInfo);

        // Set up global error handler for React Native
        // Note: ErrorUtils setup is complex and may cause TypeScript issues
        // Consider implementing this in a separate utility if needed
        log.debug('Global error handler setup skipped for TypeScript compatibility');
    } else {
        log.debug('Not running in React Native environment, skipping React Native specific setup');
    }
};

/**
 * Export debug information for troubleshooting
 */
export const exportDebugReport = (): string => {
    const report = {
        timestamp: new Date().toISOString(),
        environment: {
            isReactNative: isReactNative(),
            isDevelopment: isDevelopment(),
        },
        debugInfo: globalDebugInfo.getAllInfo(),
        performance: globalPerformanceMonitor.getPerformanceSummary(),
        measurements: globalPerformanceMonitor.getMeasurements(),
    };

    return JSON.stringify(report, null, 2);
};

// Auto-initialize when module is imported
initializeReactNativeDebugging();
