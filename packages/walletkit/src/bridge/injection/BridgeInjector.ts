import type { JSBridgeInjectOptions } from '../../types/jsBridge';
import { getDeviceInfoWithDefaults, getWalletInfoWithDefaults } from '../../utils/getDefaultWalletConfig';
import type { BridgeConfig } from '../core/BridgeConfig';
import { validateBridgeConfig } from '../core/BridgeConfig';
import { TonConnectBridge } from '../core/TonConnectBridge';
import { ExtensionTransport } from '../transport/ExtensionTransport';
import { Transport } from '../transport/Transport';
import { SUPPORTED_PROTOCOL_VERSION } from '../utils/timeouts';
import { IframeWatcher } from './IframeWatcher';
import { WindowAccessor } from './WindowAccessor';

/**
 * Cleanup function to remove bridge and stop watching
 */
// export interface BridgeCleanup {
//     cleanup: () => void;
// }

/**
 * Resolve jsBridgeKey from options
 */
function resolveJsBridgeKey(options: JSBridgeInjectOptions): string {
    // Direct jsBridgeKey takes precedence
    if (options.jsBridgeKey) {
        return options.jsBridgeKey;
    }

    // Try to extract from walletInfo
    if (options.walletInfo) {
        if ('jsBridgeKey' in options.walletInfo) {
            return (options.walletInfo as { jsBridgeKey: string }).jsBridgeKey;
        }
        if ('name' in options.walletInfo) {
            return options.walletInfo.name;
        }
    }

    // Fallback
    return 'unknown-wallet';
}

/**
 * Create bridge configuration from options
 */
function createBridgeConfig(options: JSBridgeInjectOptions): BridgeConfig {
    const deviceInfo = getDeviceInfoWithDefaults(options.deviceInfo);
    const walletInfo = getWalletInfoWithDefaults(options.walletInfo);
    const jsBridgeKey = resolveJsBridgeKey(options);

    return {
        deviceInfo,
        walletInfo,
        jsBridgeKey,
        isWalletBrowser: false,
        protocolVersion: SUPPORTED_PROTOCOL_VERSION,
    };
}

/**
 * Injects TonConnect JS Bridge into the window object
 * This is the main facade that orchestrates all components
 *
 * @param window - Window object to inject into
 * @param options - Configuration options
 * @returns Cleanup function to remove bridge and stop watching
 */
export function injectBridge(window: Window, options: JSBridgeInjectOptions, argsTransport?: Transport): void {
    // 1. Create and validate configuration
    const config = createBridgeConfig(options);
    validateBridgeConfig(config);

    let shouldInjectTonKey = undefined;
    if (options.injectTonKey !== undefined) {
        shouldInjectTonKey = options.injectTonKey;
        // Redundant check, but keeping for clarity
    } else if (options.isWalletBrowser === true) {
        shouldInjectTonKey = true;
    } else {
        shouldInjectTonKey = true;
    }

    // 2. Create window accessor
    const windowAccessor = new WindowAccessor(window, {
        bridgeKey: config.jsBridgeKey,
        injectTonKey: shouldInjectTonKey,
    });

    // 3. Check if bridge already exists
    if (windowAccessor.exists()) {
        // eslint-disable-next-line no-console
        console.log(`${config.jsBridgeKey}.tonconnect already exists, skipping injection`);
        return;
    }

    let transport: Transport;
    if (argsTransport) {
        transport = argsTransport;
    } else {
        // const randomId = Math.random().toString(36).substring(2, 15);
        const source = `${config.jsBridgeKey}-tonconnect`;
        transport = new ExtensionTransport(window, source);
    }

    // 5. Create bridge instance
    const bridge = new TonConnectBridge(config, transport);

    // 6. Inject bridge into window
    windowAccessor.injectBridge(bridge);

    // eslint-disable-next-line no-console
    console.log(`TonConnect JS Bridge injected for ${config.jsBridgeKey} - forwarding to extension`);

    // 7. Setup iframe watcher
    const iframeWatcher = new IframeWatcher(() => {
        transport.requestContentScriptInjection();
    });
    iframeWatcher.start();

    // 8. Return cleanup function
    return;
}
