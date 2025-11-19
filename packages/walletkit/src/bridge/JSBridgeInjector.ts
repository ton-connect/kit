/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSBridgeInjectOptions } from '../types/jsBridge';
import { injectBridge } from './injection/BridgeInjector';
import { Transport } from './transport/Transport';
import {
    INJECT_CONTENT_SCRIPT,
    TONCONNECT_BRIDGE_EVENT,
    TONCONNECT_BRIDGE_REQUEST,
    TONCONNECT_BRIDGE_RESPONSE,
} from './utils/messageTypes';
import { DEFAULT_REQUEST_TIMEOUT, RESTORE_CONNECTION_TIMEOUT } from './utils/timeouts';
import { ExtensionTransport, type MessageSender, type MessageListener } from './transport/ExtensionTransport';

export {
    type JSBridgeInjectOptions,
    Transport,
    TONCONNECT_BRIDGE_EVENT,
    RESTORE_CONNECTION_TIMEOUT,
    DEFAULT_REQUEST_TIMEOUT,
    TONCONNECT_BRIDGE_REQUEST,
    TONCONNECT_BRIDGE_RESPONSE,
    INJECT_CONTENT_SCRIPT,
    type MessageSender,
    type MessageListener,
    ExtensionTransport,
};

/**
 * Injects a simplified TonConnect JS Bridge that forwards all requests to the parent extension
 * The extension handles all logic through WalletKit
 *
 * @param window - Window object to inject bridge into
 * @param options - Configuration options for the bridge
 */
export function injectBridgeCode(window: Window, options: JSBridgeInjectOptions, transport?: Transport): void {
    injectBridge(window, options, transport);
}
