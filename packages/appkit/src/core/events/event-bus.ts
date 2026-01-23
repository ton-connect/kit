/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Centralized EventBus for appkit plugin communication
 */

export type EventPayload = Record<string, unknown>;

export interface AppKitEvent<T extends EventPayload = EventPayload> {
    type: string;
    payload: T;
    source: string;
    timestamp: number;
}

export type EventListener<T extends EventPayload = EventPayload> = (event: AppKitEvent<T>) => void;

export interface EventBus {
    emit<T extends EventPayload>(type: string, payload: T, source: string): void;
    on<T extends EventPayload>(type: string, listener: EventListener<T>): () => void;
    off(type: string, listener: EventListener): void;
    once<T extends EventPayload>(type: string, listener: EventListener<T>): () => void;
}

class EventBusImpl implements EventBus {
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

export const createEventBus = (): EventBus => new EventBusImpl();
