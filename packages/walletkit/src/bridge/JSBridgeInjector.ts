import type { JSBridgeInjectOptions } from '../types/jsBridge';
import { injectBridge } from './injection/BridgeInjector';
import { Transport } from './transport/Transport';

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
