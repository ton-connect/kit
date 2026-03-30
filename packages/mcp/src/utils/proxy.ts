/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { WebSocketTransport } from '@ston-fi/omniston-sdk';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import WebSocket from 'ws';

let proxySetupDone = false;

function getProxyUrl(): string | undefined {
    return (
        process.env.HTTPS_PROXY?.trim() ||
        process.env.https_proxy?.trim() ||
        process.env.HTTP_PROXY?.trim() ||
        process.env.http_proxy?.trim() ||
        undefined
    );
}

export function setupProxySupport(): void {
    if (proxySetupDone) {
        return;
    }
    proxySetupDone = true;

    const proxyUrl = getProxyUrl();
    if (!proxyUrl) {
        return;
    }

    setGlobalDispatcher(new ProxyAgent(proxyUrl));

    const transport = WebSocketTransport.prototype as unknown as {
        url: string | URL;
        webSocket?: WebSocket;
        isClosing: boolean;
        connectionStatusEvents: { next: (event: { status: string; errorMessage?: string }) => void };
        messages: { next: (message: string) => void };
        connect: () => Promise<void>;
    };

    transport.connect = function (): Promise<void> {
        return new Promise((resolve, reject) => {
            this.webSocket?.close();
            this.isClosing = false;

            const ws = new WebSocket(this.url, { agent: new HttpsProxyAgent(proxyUrl) });
            this.webSocket = ws;
            this.connectionStatusEvents.next({ status: 'connecting' });

            ws.addEventListener('open', () => {
                resolve();
                this.connectionStatusEvents.next({ status: 'connected' });
            });
            ws.addEventListener('message', (event) => {
                this.messages.next(event.data.toString());
            });
            ws.addEventListener('close', (event) => {
                if (this.isClosing) {
                    this.isClosing = false;
                    reject(new Error('Closed by client'));
                    this.connectionStatusEvents.next({ status: 'closed' });
                    return;
                }
                const error = new Error(event.reason.toString());
                reject(error);
                this.connectionStatusEvents.next({ status: 'error', errorMessage: error.message });
            });
        });
    };
}
