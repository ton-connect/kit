/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AnalyticsManager } from './AnalyticsManager';
import type { AnalyticsEvent, ConnectionCompletedEvent } from './swagger';

const endpoint = 'https://analytics.test.org';
const maxQueueSize = 50;
const maxBatchSize = 10;
const batchTimeoutMs = 100;

describe('AnalyticsManager', () => {
    let manager: AnalyticsManager;
    let mockEventsCreate: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Mock the API
        mockEventsCreate = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

        manager = new AnalyticsManager({
            endpoint,
            maxQueueSize,
            maxBatchSize,
            batchTimeoutMs,
        });

        // Replace the API with a mock
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (manager as any).api = {
            events: {
                eventsCreate: mockEventsCreate,
            },
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.clearAllTimers();
    });

    describe('Batching', () => {
        it('should batch events and send when maxBatchSize is reached', async () => {
            const analytics = manager.scoped();

            // Emit maxBatchSize events
            for (let i = 0; i < maxBatchSize; i++) {
                analytics.emitTestEvent({ client_id: `value-${i}` });
            }

            expect(mockEventsCreate).toHaveBeenCalledTimes(1);
            expect(mockEventsCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        event_name: 'test-event',
                        client_id: 'value-0',
                    }),
                ]),
            );

            const sentEvents = mockEventsCreate.mock.calls[0][0] as AnalyticsEvent[];
            expect(sentEvents).toHaveLength(maxBatchSize);
        });

        it('should batch events and send after timeout', async () => {
            const analytics = manager.scoped();

            // Emit 3 events (less than maxBatchSize)
            analytics.emitTestEvent({ client_id: 'value-1' });
            analytics.emitTestEvent({ client_id: 'value-2' });
            analytics.emitTestEvent({ client_id: 'value-3' });

            await new Promise((resolve) => setTimeout(resolve, batchTimeoutMs + 50));

            expect(mockEventsCreate).toHaveBeenCalledTimes(1);

            const sentEvents = mockEventsCreate.mock.calls[0][0] as AnalyticsEvent[];
            expect(sentEvents).toHaveLength(3);
        });

        it('should send multiple batches when events exceed maxBatchSize', async () => {
            const analytics = manager.scoped();

            // Emit 2.5 batches worth of events
            const totalEvents = maxBatchSize * 2 + 1;
            for (let i = 0; i < totalEvents; i++) {
                analytics.emitTestEvent({ client_id: `value-${i}` });
            }

            // Wait for first auto-flush (triggered at maxBatchSize events)
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Manually flush remaining events
            await manager.flush();
            await manager.flush();

            expect(mockEventsCreate).toHaveBeenCalledTimes(3);

            // First batch: maxBatchSize events
            const firstBatch = mockEventsCreate.mock.calls[0][0] as AnalyticsEvent[];
            expect(firstBatch).toHaveLength(maxBatchSize);

            // Second batch: maxBatchSize events
            const secondBatch = mockEventsCreate.mock.calls[1][0] as AnalyticsEvent[];
            expect(secondBatch).toHaveLength(maxBatchSize);

            // Third batch: remaining event
            const thirdBatch = mockEventsCreate.mock.calls[2][0] as AnalyticsEvent[];
            expect(thirdBatch).toHaveLength(1);
        });
    });

    describe('maxQueueSize limit', () => {
        it('should drop oldest events when queue exceeds maxQueueSize', async () => {
            const analytics = manager.scoped();

            // Mock API to never resolve to prevent flushing
            mockEventsCreate.mockImplementation(
                () => new Promise(() => {}), // Never resolves
            );

            // Emit more than maxQueueSize events
            const totalEvents = maxQueueSize + 10;
            for (let i = 0; i < totalEvents; i++) {
                analytics.emitTestEvent({ client_id: `value-${i}` });
            }

            // Access internal events array
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const events = (manager as any).events as AnalyticsEvent[];

            // Should have exactly maxQueueSize events
            expect(events.length).toBe(maxQueueSize);

            // Oldest 10 events should be dropped, newest should remain
            expect(events[0].client_id).toBe('value-10');
            expect(events[events.length - 1].client_id).toBe(`value-${totalEvents - 1}`);
        });

        it('should enforce maxQueueSize after restoring failed events', async () => {
            const analytics = manager.scoped();

            // Make API fail to trigger restore
            mockEventsCreate.mockRejectedValueOnce(new Error('Network error'));

            // Emit events exceeding maxQueueSize
            const totalEvents = maxQueueSize + maxBatchSize;
            for (let i = 0; i < totalEvents; i++) {
                analytics.emitTestEvent({ client_id: `value-${i}` });
            }

            // Trigger flush which will fail and restore events
            await manager.flush();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const events = (manager as any).events as AnalyticsEvent[];

            // Should be limited to maxQueueSize, oldest events dropped
            expect(events.length).toBe(maxQueueSize);
            expect(events[0].client_id).toBe(`value-${maxBatchSize}`);
            expect(events[maxQueueSize - 1].client_id).toBe(`value-${totalEvents - 1}`);
        });
    });

    describe('Error handling and retry', () => {
        it('should handle 429 Too Many Requests error', async () => {
            const analytics = manager.scoped();

            // Make API return 429
            mockEventsCreate.mockResolvedValueOnce(
                new Response(null, { status: 429, statusText: 'Too Many Requests' }),
            );

            // Emit events
            for (let i = 0; i < 5; i++) {
                analytics.emitTestEvent({ client_id: `value-${i}` });
            }

            // Wait for flush
            await new Promise((resolve) => setTimeout(resolve, batchTimeoutMs + 50));

            // Events should be restored
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const events = (manager as any).events as AnalyticsEvent[];
            expect(events.length).toBeGreaterThan(0);
        });

        it('should drop events on 4xx client errors', async () => {
            const analytics = manager.scoped();

            // Make API return 400
            mockEventsCreate.mockResolvedValueOnce(new Response(null, { status: 400, statusText: 'Bad Request' }));

            // Emit events
            for (let i = 0; i < 5; i++) {
                analytics.emitTestEvent({ client_id: `value-${i}` });
            }

            // Wait for flush
            await new Promise((resolve) => setTimeout(resolve, batchTimeoutMs + 50));

            // Events should be dropped (not restored)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const events = (manager as any).events as AnalyticsEvent[];
            expect(events.length).toBe(0);
        });
    });

    describe('Event enrichment', () => {
        it('should add event_id and trace_id to events', async () => {
            const analytics = manager.scoped();

            analytics.emitTestEvent({ client_id: 'value' });

            await manager.flush();

            const sentEvents = mockEventsCreate.mock.calls[0][0] as AnalyticsEvent[];
            expect(sentEvents[0].event_id).toBeDefined();
            expect(sentEvents[0].trace_id).toBeDefined();
            expect(sentEvents[0].client_timestamp).toBeDefined();
        });

        it('should preserve provided trace_id', async () => {
            const analytics = manager.scoped();

            const customTraceId = 'custom-trace-id';
            analytics.emitTestEvent({ client_id: 'value', trace_id: customTraceId });

            await manager.flush();

            const sentEvents = mockEventsCreate.mock.calls[0][0] as AnalyticsEvent[];
            expect(sentEvents[0].trace_id).toBe(customTraceId);
        });

        it('should add appInfo data to events', async () => {
            const managerWithAppInfo = new AnalyticsManager({
                endpoint,
                appInfo: {
                    env: 'bridge',
                    platform: 'ios',
                    browser: 'safari',
                    appName: 'TestApp',
                    appVersion: '1.0.0',
                    getLocale: () => 'en-US',
                    getCurrentUserId: () => 'user-123',
                },
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (managerWithAppInfo as any).api = {
                events: {
                    eventsCreate: mockEventsCreate,
                },
            };

            const analytics = managerWithAppInfo.scoped();
            analytics.emitTestEvent({ client_id: 'value' });

            await managerWithAppInfo.flush();

            const sentEvents = mockEventsCreate.mock.calls[0][0] as ConnectionCompletedEvent[];
            const firstEvent = sentEvents[0];

            expect(firstEvent.client_environment).toBe('bridge');
            expect(firstEvent.browser).toBe('safari');
            expect(firstEvent.platform).toBe('ios');
            expect(firstEvent.wallet_app_name).toBe('TestApp');
            expect(firstEvent.wallet_app_version).toBe('1.0.0');
            expect(firstEvent.locale).toBe('en-US');
            expect(firstEvent.user_id).toBe('user-123');
        });
    });
});
