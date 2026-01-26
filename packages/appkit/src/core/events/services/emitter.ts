/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventListener, AppKitEvent, EventPayload, AppKitEvents } from '../types/events';

export class Emitter<Events extends { [K in keyof Events]: EventPayload } = AppKitEvents> {
    private listeners = new Map<keyof Events, Set<unknown>>();

    emit<K extends keyof Events>(type: K, payload: Events[K], source: string): void {
        const event: AppKitEvent<Events[K]> = {
            type: type as string,
            payload,
            source,
            timestamp: Date.now(),
        };

        const listeners = this.listeners.get(type);

        if (listeners) {
            listeners.forEach((listener) => {
                (listener as EventListener<Events[K]>)(event);
            });
        }
    }

    on<K extends keyof Events>(type: K, listener: EventListener<Events[K]>): () => void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }

        this.listeners.get(type)!.add(listener as unknown);

        return () => this.off(type, listener);
    }

    off<K extends keyof Events>(type: K, listener: EventListener<Events[K]>): void {
        this.listeners.get(type)?.delete(listener as unknown);
    }

    once<K extends keyof Events>(type: K, listener: EventListener<Events[K]>): () => void {
        const wrapper = (event: AppKitEvent<Events[K]>) => {
            this.off(type, wrapper);
            listener(event);
        };

        return this.on(type, wrapper);
    }
}
