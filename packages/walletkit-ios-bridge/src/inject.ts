/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    injectBridgeCode,
    TONCONNECT_BRIDGE_EVENT,
    RESTORE_CONNECTION_TIMEOUT,
    DEFAULT_REQUEST_TIMEOUT,
} from '@ton/walletkit/bridge';
import type { InjectedToExtensionBridgeRequestPayload, Transport, JSBridgeInjectOptions } from '@ton/walletkit';

declare global {
    interface Window {
        id: string;
        injectWalletKit: (options: JSBridgeInjectOptions) => void;
        webkit: {
            messageHandlers: {
                walletKitInjectionBridge: {
                    postMessage: (message: unknown) => Promise<unknown>;
                };
            };
        };
    }
}

window.injectWalletKit = (options) => {
    try {
        injectBridgeCode(window, options, new SwiftTransport(window));

        // console.log('TonConnect bridge injected - forwarding to extension');
    } catch (_error) {
        // console.error('Failed to inject TonConnect bridge:', error);
    }
};

window.id = crypto.randomUUID();

class SwiftTransport implements Transport {
    private readonly window: Window;
    private eventCallback: ((event: unknown) => void) | null = null;
    private messageListener: ((event: MessageEvent) => void) | null = null;

    constructor(window: Window) {
        this.window = window;
        this.setupMessageListener();
    }

    private setupMessageListener(): void {
        this.messageListener = (event: MessageEvent) => {
            if (event.source !== this.window) return;

            const data = event.data;
            if (!data || typeof data !== 'object') return;

            if (data.type === TONCONNECT_BRIDGE_EVENT) {
                this.handleEvent(data.event);
                return;
            }
        };

        this.window.addEventListener('message', this.messageListener);
    }

    private handleEvent(event: unknown): void {
        if (this.eventCallback) {
            try {
                this.eventCallback(event);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('TonConnect event callback error:', error);
            }
        }
    }

    async send(request: Omit<InjectedToExtensionBridgeRequestPayload, 'id'>): Promise<unknown> {
        let timeout = request.method === 'restoreConnection' ? RESTORE_CONNECTION_TIMEOUT : DEFAULT_REQUEST_TIMEOUT;
        let response = await window.webkit.messageHandlers.walletKitInjectionBridge.postMessage({
            ...request,
            frameID: window.id,
            timeout: timeout,
        });

        if (!response || typeof response !== 'object') {
            return Promise.reject(new Error('Invalid response'));
        }

        if ((response as { success: boolean }).success) {
            return Promise.resolve((response as { payload: unknown }).payload);
        } else {
            return Promise.reject((response as { error: unknown }).error);
        }
    }

    onEvent(callback: (event: unknown) => void): void {
        this.eventCallback = callback;
    }

    isAvailable(): boolean {
        return true;
    }

    requestContentScriptInjection(): void {}

    destroy(): void {}
}
