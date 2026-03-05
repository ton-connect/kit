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
}

export abstract class BaseApiClient {
    protected readonly endpoint: string;
    protected readonly apiKey?: string;
    protected readonly timeout: number;
    protected readonly fetchApi: typeof fetch;
    protected readonly network?: Network;
    protected readonly disableNetworkSend?: boolean;

    constructor(config: BaseApiClientConfig, defaultEndpoint: string) {
        this.network = config.network;
        this.endpoint = config.endpoint ?? defaultEndpoint;
        this.apiKey = config.apiKey;
        this.timeout = config.timeout ?? 30000;
        this.fetchApi = config.fetchApi ?? fetch;
        this.disableNetworkSend = config.disableNetworkSend ?? false;
    }

    protected abstract appendAuthHeaders(headers: Headers): void;

    private async doRequest(url: URL, init: globalThis.RequestInit = {}): Promise<globalThis.Response> {
        const fetchFn = this.fetchApi;

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
