/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventPayload, EventListener, AppKitEvent } from '../types/event-bus';

/**
 * Centralized EventBus for appkit plugin communication
 */
export class EventBus {
    private listeners = new Map<string, Set<EventListener>>();

    emit<T extends EventPayload>(type: string, payload: T, source: string): void {
        const event: AppKitEvent<T> = {
            type,
            payload,
            source,
            timestamp: Date.now(),
        };

        // Notify specific listeners
        this.listeners.get(type)?.forEach((listener) => listener(event));

        // Notify wildcard listeners
        this.listeners.get('*')?.forEach((listener) => listener(event));
    }

    on<T extends EventPayload>(type: string, listener: EventListener<T>): () => void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(listener as EventListener);
        return () => this.off(type, listener as EventListener);
    }

    off(type: string, listener: EventListener): void {
        this.listeners.get(type)?.delete(listener);
    }

    once<T extends EventPayload>(type: string, listener: EventListener<T>): () => void {
        const wrapper: EventListener<T> = (event) => {
            this.off(type, wrapper as EventListener);
            listener(event);
        };
        return this.on(type, wrapper);
    }
}
