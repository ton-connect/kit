/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Global event emitter for the entire kit

import { globalLogger } from './Logger';

const log = globalLogger.createChild('EventEmitter');

export type EventPayload = object;

export interface KitEvent<T> {
    type: string;
    payload: T;
    source?: string;
    timestamp: number;
}

export type EventListener<T> = (event: KitEvent<T>) => void | Promise<void>;

/**
 * Global event emitter for the TonWalletKit
 * Allows components to send and receive events throughout the kit.
 */
export class EventEmitter<Events> {
    private listeners: { [K in keyof Events]?: Set<EventListener<Events[K]>> } = {};

    /**
     * Subscribe to an event.
     * Returns an unsubscribe function.
     */
    on<K extends keyof Events>(eventName: K, listener: EventListener<Events[K]>): () => void {
        const eventListeners = this.listeners[eventName];
        if (!eventListeners) {
            this.listeners[eventName] = new Set([listener]);
        } else {
            eventListeners.add(listener);
        }

        log.debug('Event listener added', {
            eventName: String(eventName),
            totalListeners: this.listeners[eventName]?.size,
        });

        return () => this.off(eventName, listener);
    }

    /**
     * Subscribe to an event once (automatically removes after first emission).
     * Returns an unsubscribe function.
     */
    once<K extends keyof Events>(eventName: K, listener: EventListener<Events[K]>): () => void {
        const wrapper = (event: KitEvent<Events[K]>) => {
            this.off(eventName, wrapper);
            listener(event);
        };

        return this.on(eventName, wrapper);
    }

    /**
     * Unsubscribe from an event
     */
    off<K extends keyof Events>(eventName: K, listener: EventListener<Events[K]>): void {
        this.listeners[eventName]?.delete(listener);
    }

    /**
     * Emit an event to all subscribers.
     */
    emit<K extends keyof Events>(eventName: K, payload: Events[K], source: string): void {
        const event: KitEvent<Events[K]> = {
            type: eventName as string,
            timestamp: Date.now(),
            source,
            payload,
        };

        const eventListeners = this.listeners[eventName];

        if (eventListeners) {
            eventListeners.forEach((listener) => {
                listener(event);
            });
        }
    }

    /**
     * Remove all listeners for a specific event or all events
     */
    removeAllListeners(eventName?: keyof Events): void {
        if (eventName) {
            delete this.listeners[eventName];
            log.debug('All listeners removed for event', { eventName: String(eventName) });
        } else {
            this.listeners = {};
            log.debug('All event listeners cleared');
        }
    }

    /**
     * Get the number of listeners for an event
     */
    listenerCount(eventName: keyof Events): number {
        return this.listeners[eventName]?.size || 0;
    }

    /**
     * Get all event names that have listeners
     */
    eventNames(): string[] {
        return Object.keys(this.listeners) as string[];
    }
}

// EventEmitter class - each kit instance will create its own instance
