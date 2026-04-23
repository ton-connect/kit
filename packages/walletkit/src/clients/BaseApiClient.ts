/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../api/models';
import { TonClientError } from './TonClientError';

export interface BaseApiClientConfig {
    endpoint?: string;
    apiKey?: string;
    timeout?: number;
    fetchApi?: typeof fetch;
    network?: Network;
    disableNetworkSend?: boolean;
    minRequestIntervalMs?: number;
}

export abstract class BaseApiClient {
    private static readonly endpointLocks = new Map<string, Promise<void>>();
    private static readonly endpointNextAllowedAt = new Map<string, number>();

    protected readonly endpoint: string;
    protected readonly apiKey?: string;
    protected readonly timeout: number;
    protected readonly fetchApi: typeof fetch;
    protected readonly network?: Network;
    protected readonly disableNetworkSend?: boolean;
    protected readonly minRequestIntervalMs: number;

    constructor(config: BaseApiClientConfig, defaultEndpoint: string) {
        this.network = config.network;
        this.endpoint = config.endpoint ?? defaultEndpoint;
        this.apiKey = config.apiKey;
        this.timeout = config.timeout ?? 30000;
        this.fetchApi = config.fetchApi ?? fetch;
        this.disableNetworkSend = config.disableNetworkSend ?? false;
        this.minRequestIntervalMs = config.minRequestIntervalMs ?? 1000;
    }

    protected abstract appendAuthHeaders(headers: Headers): void;

    private async doRequest(url: URL, init: globalThis.RequestInit = {}): Promise<globalThis.Response> {
        const fetchFn = this.fetchApi;
        await this.waitForRateLimit();

        if (!this.timeout || this.timeout <= 0) {
            return fetchFn(url, init);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            return await fetchFn(url, { ...init, signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private async waitForRateLimit(): Promise<void> {
        if (this.minRequestIntervalMs <= 0) {
            return;
        }

        const endpointKey = new URL(this.endpoint).origin;
        const prevLock = BaseApiClient.endpointLocks.get(endpointKey) ?? Promise.resolve();
        let releaseLock: () => void = () => undefined;
        const currentLock = new Promise<void>((resolve) => {
            releaseLock = resolve;
        });

        BaseApiClient.endpointLocks.set(
            endpointKey,
            prevLock.then(() => currentLock),
        );
        await prevLock;

        try {
            const now = Date.now();
            const nextAllowedAt = BaseApiClient.endpointNextAllowedAt.get(endpointKey) ?? now;
            const waitMs = Math.max(0, nextAllowedAt - now);

            if (waitMs > 0) {
                await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
            }

            BaseApiClient.endpointNextAllowedAt.set(endpointKey, Date.now() + this.minRequestIntervalMs);
        } finally {
            releaseLock();
        }
    }

    protected async fetch<T>(url: URL, props: globalThis.RequestInit = {}): Promise<T> {
        const headers = new Headers(props.headers);
        headers.set('accept', 'application/json');
        this.appendAuthHeaders(headers);
        props = { ...props, headers };
        const response = await this.doRequest(url, props);
        if (!response.ok) {
            throw await this.buildError(response);
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await (response as globalThis.Response).text();
            throw new TonClientError('Unexpected non-JSON response', response.status, text.slice(0, 200));
        }
        const json = await response.json();
        return json as Promise<T>;
    }

    protected async getJson<T>(path: string, query?: Record<string, unknown>): Promise<T> {
        return this.fetch(this.buildUrl(path, query), { method: 'GET' });
    }

    protected async postJson<T>(path: string, props: unknown): Promise<T> {
        return this.fetch(this.buildUrl(path), {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(props),
        });
    }

    protected buildUrl(path: string, query: Record<string, unknown> = {}): URL {
        const url = new URL(path.replace(/^\/*/, '/'), this.endpoint);
        for (const [key, value] of Object.entries(query)) {
            if (typeof value === 'string') url.searchParams.set(key, value);
            else if (Array.isArray(value)) {
                for (const item of value) {
                    if (typeof item === 'string') url.searchParams.set(key, item);
                    else if (item != null && typeof item.toString === 'function') {
                        url.searchParams.set(key, item.toString());
                    }
                }
            } else if (value != null && typeof value.toString === 'function') {
                url.searchParams.set(key, value.toString());
            }
        }
        return url;
    }

    protected async buildError(response: globalThis.Response): Promise<Error> {
        const message = response.statusText || 'HTTP Error';
        const code = response.status ?? 500;
        let detail: unknown;
        try {
            detail = await response.json();
        } catch {
            /* empty */
        }
        return new TonClientError(`HTTP ${response.status}: ${message}`, code, detail);
    }
}
