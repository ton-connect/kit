/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { globalLogger } from '../core/Logger';
import { Api } from './swagger';
import type { Analytics } from './analytics';
import type { AnalyticsEvent } from './swagger';
import { pascalToKebab } from './utils';

const log = globalLogger.createChild('AnalyticsManager');

export type AnalyticsManagerOptions = {
    batchTimeoutMs?: number;
    maxBatchSize?: number;
    analyticsUrl?: string;
    enabled?: boolean;
    version?: string;
    subsystem?: 'dapp' | 'dapp-sdk' | 'bridge' | 'wallet' | 'wallet-sdk';
};

export class AnalyticsManager {
    private api: Api<unknown>;
    private readonly baseEvent: Partial<AnalyticsEvent>;

    private events: AnalyticsEvent[] = [];
    private timeoutId: ReturnType<typeof setTimeout> | null = null;
    private isProcessing = false;

    private backoff = 1;
    private currentBatchTimeoutMs: number;

    private readonly batchTimeoutMs: number;
    private readonly maxBatchSize: number;
    private readonly analyticsUrl: string;
    private enabled: boolean;

    private static readonly HTTP_STATUS = {
        TOO_MANY_REQUESTS: 429,
        CLIENT_ERROR_START: 400,
        SERVER_ERROR_START: 500,
    } as const;

    private static readonly MAX_BACKOFF_ATTEMPTS = 5;
    private static readonly BACKOFF_MULTIPLIER = 2;

    constructor(options: AnalyticsManagerOptions = {}) {
        this.batchTimeoutMs = options.batchTimeoutMs ?? 5000;
        this.currentBatchTimeoutMs = this.batchTimeoutMs;
        this.maxBatchSize = options.maxBatchSize ?? 100;
        this.analyticsUrl = options.analyticsUrl ?? 'https://analytics.ton.org/events';
        this.enabled = options.enabled ?? true;

        this.api = new Api({
            baseUrl: options.analyticsUrl ?? 'https://analytics.ton.org',
        });

        this.baseEvent = {
            subsystem: options.subsystem ?? 'wallet-sdk',
            version: options.version,
        };
    }

    scoped<TEvent extends AnalyticsEvent = AnalyticsEvent, TOptional extends keyof TEvent = 'event_name'>(
        sharedData?: Partial<AnalyticsEvent>,
    ): Analytics<TEvent, TOptional> {
        return new Proxy(this, {
            get(target, prop) {
                const propName = prop.toString();
                if (propName.startsWith('emit')) {
                    const eventNamePascal = propName.replace('emit', '');
                    const eventNameKebab = pascalToKebab(eventNamePascal);
                    return function (event: Omit<AnalyticsEvent, 'event_name'>) {
                        const executedData = Object.fromEntries(
                            Object.entries(sharedData ?? {}).map(([key, value]) => [
                                key,
                                typeof value === 'function' ? (value as () => unknown)() : value,
                            ]),
                        );

                        return target.emit({
                            event_name: eventNameKebab,
                            ...executedData,
                            ...event,
                        } as AnalyticsEvent);
                    };
                }

                return Reflect.get(target, prop);
            },
        }) as unknown as Analytics<TEvent, TOptional>;
    }

    private emit(event: AnalyticsEvent): void {
        if (!this.enabled) {
            return;
        }

        const enhancedEvent = {
            ...this.baseEvent,
            ...event,
            event_id: this.generateUUID(),
            client_timestamp: Math.floor(Date.now() / 1000),
            trace_id: event.trace_id ?? this.generateUUID(),
        };

        log.debug('Analytics event emitted', { event: enhancedEvent });

        this.events.push(enhancedEvent);

        if (this.events.length >= this.maxBatchSize) {
            void this.flush();
            return;
        }

        this.startTimeout();
    }

    private startTimeout(): void {
        if (this.timeoutId || this.isProcessing) {
            return;
        }

        this.timeoutId = setTimeout(() => {
            void this.flush();
        }, this.currentBatchTimeoutMs);
    }

    async flush(): Promise<void> {
        if (this.isProcessing || this.events.length === 0) {
            return;
        }

        this.clearTimeout();
        this.isProcessing = true;

        const eventsToSend = this.extractEventsToSend();

        try {
            await this.processEventsBatch(eventsToSend);
            log.debug('Analytics events sent successfully');
        } catch (error) {
            this.restoreEvents(eventsToSend);
            log.error('Failed to send analytics events', { error });
        } finally {
            this.isProcessing = false;
            this.scheduleNextFlushIfNeeded();
        }
    }

    private clearTimeout(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    private extractEventsToSend(): AnalyticsEvent[] {
        const eventsToSend = this.events.slice(0, this.maxBatchSize);
        this.events = this.events.slice(this.maxBatchSize);
        return eventsToSend;
    }

    private async processEventsBatch(eventsToSend: AnalyticsEvent[]): Promise<void> {
        if (!this.enabled) {
            return;
        }

        log.debug('Sending analytics events', { count: eventsToSend.length });

        try {
            const response = await this.sendEvents(eventsToSend);
            this.handleResponse(response);
        } catch (err) {
            this.handleUnknownError(err);
        }
    }

    private handleResponse(response: Response): void {
        const { status, statusText } = response;

        if (this.isTooManyRequests(status)) {
            this.handleTooManyRequests(status, statusText);
        } else if (this.isClientError(status)) {
            this.handleClientError(status, statusText);
        } else if (this.isServerError(status)) {
            this.handleUnknownError({ status, statusText });
        }
    }

    private restoreEvents(eventsToSend: AnalyticsEvent[]): void {
        this.events.unshift(...eventsToSend);
    }

    private scheduleNextFlushIfNeeded(): void {
        if (this.events.length > 0) {
            this.startTimeout();
        }
    }

    private async sendEvents(events: AnalyticsEvent[]): Promise<Response> {
        return await this.api.events.eventsCreate(events);
    }

    private isClientError(status: number): boolean {
        return (
            status >= AnalyticsManager.HTTP_STATUS.CLIENT_ERROR_START &&
            status < AnalyticsManager.HTTP_STATUS.SERVER_ERROR_START
        );
    }

    private isServerError(status: number): boolean {
        return status >= AnalyticsManager.HTTP_STATUS.SERVER_ERROR_START;
    }

    private isTooManyRequests(status: number): boolean {
        return status === AnalyticsManager.HTTP_STATUS.TOO_MANY_REQUESTS;
    }

    private handleClientError(status: number, statusText: string): void {
        log.error('Analytics API client error', { status, statusText });
    }

    private handleUnknownError(error: unknown): void {
        if (this.backoff < AnalyticsManager.MAX_BACKOFF_ATTEMPTS) {
            this.backoff++;
            this.currentBatchTimeoutMs *= AnalyticsManager.BACKOFF_MULTIPLIER;
            throw new Error(`Unknown analytics API error: ${error}`);
        } else {
            this.currentBatchTimeoutMs = this.batchTimeoutMs;
            this.backoff = 1;
            return;
        }
    }

    private handleTooManyRequests(status: number, statusText: string): void {
        throw new Error(`Analytics API error: ${status} ${statusText}`);
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}
