/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectorFactoryContext } from './connector';

/**
 * Plugin that extends AppKit with custom functionality.
 * After init, the plugin instance is stored in PluginManager by its id.
 */
export interface AppKitPlugin {
    readonly id: string;
    init(context: ConnectorFactoryContext): void | Promise<void>;
    destroy?(): void;
}

/** A plugin instance or a factory that creates one */
export type PluginInput = AppKitPlugin | ((ctx: ConnectorFactoryContext) => AppKitPlugin);
