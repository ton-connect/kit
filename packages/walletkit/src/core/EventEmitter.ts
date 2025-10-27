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

export type EventListener<T = unknown> = (data: T) => void;

/**
 * Global event emitter for the TonWalletKit
 * Allows components to send and receive events throughout the kit
 */
export class EventEmitter {
    private listeners: Map<string, Set<EventListener>> = new Map();

    /**
     * Subscribe to an event
     */
    on<T = unknown>(eventName: string, listener: EventListener<T>): void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }

        this.listeners.get(eventName)!.add(listener as EventListener);
        log.debug('Event listener added', { eventName, totalListeners: this.listeners.get(eventName)!.size });
    }

    /**
     * Subscribe to an event once (automatically removes after first emission)
     */
    once<T = unknown>(eventName: string, listener: EventListener<T>): void {
        const onceListener = (data: T) => {
            this.off(eventName, onceListener);
            listener(data);
        };
        this.on(eventName, onceListener);
    }

    /**
     * Unsubscribe from an event
     */
    off<T = unknown>(eventName: string, listener: EventListener<T>): void {
        const eventListeners = this.listeners.get(eventName);
        if (eventListeners) {
            eventListeners.delete(listener as EventListener);
            log.debug('Event listener removed', { eventName, totalListeners: eventListeners.size });

            // Clean up empty event sets
            if (eventListeners.size === 0) {
                this.listeners.delete(eventName);
            }
        }
    }

    /**
     * Emit an event to all subscribers
     */
    emit<T = unknown>(eventName: string, data?: T): void {
        const eventListeners = this.listeners.get(eventName);
        if (eventListeners) {
            log.debug('Emitting event', { eventName, listenerCount: eventListeners.size });

            eventListeners.forEach((listener) => {
                try {
                    listener(data);
                } catch (error) {
                    log.error('Error in event listener', { eventName, error });
                }
            });
        }
    }

    /**
     * Remove all listeners for a specific event
     */
    removeAllListeners(eventName?: string): void {
        if (eventName) {
            this.listeners.delete(eventName);
            log.debug('All listeners removed for event', { eventName });
        } else {
            this.listeners.clear();
            log.debug('All event listeners cleared');
        }
    }

    /**
     * Get the number of listeners for an event
     */
    listenerCount(eventName: string): number {
        return this.listeners.get(eventName)?.size || 0;
    }

    /**
     * Get all event names that have listeners
     */
    eventNames(): string[] {
        return Array.from(this.listeners.keys());
    }
}

// EventEmitter class - each kit instance will create its own instance
