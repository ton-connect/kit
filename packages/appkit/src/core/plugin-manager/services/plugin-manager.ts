/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PLUGIN_EVENTS } from '../../app-kit/constants/events';
import type { AppKitEmitter } from '../../app-kit/types/events';

/**
 * Manages plugins registered in AppKit.
 * Stores plugin instances by id so typed wrappers can retrieve them.
 */
export class PluginManager {
    private readonly plugins = new Map<string, unknown>();
    private readonly emitter: AppKitEmitter;

    constructor(emitter: AppKitEmitter) {
        this.emitter = emitter;
    }

    register<T>(key: string, plugin: T): void {
        this.plugins.set(key, plugin);
        this.emitter.emit(PLUGIN_EVENTS.REGISTERED, { pluginId: key, pluginType: key }, 'appkit');
    }

    get<T>(key: string): T | undefined {
        return this.plugins.get(key) as T | undefined;
    }

    has(key: string): boolean {
        return this.plugins.has(key);
    }

    remove(key: string): boolean {
        return this.plugins.delete(key);
    }
}
