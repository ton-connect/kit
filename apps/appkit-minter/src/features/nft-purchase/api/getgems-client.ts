/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    GetGemsBuyResponse,
    GetGemsCollection,
    GetGemsEnvelope,
    GetGemsNftFull,
    GetGemsNftsOnSaleResponse,
} from './types';

import { ENV_GETGEMS_API_KEY } from '@/core/configs/env';

// The real GetGems API (https://api.getgems.io/public-api) does not send
// CORS headers for browser origins, so we route requests through the Vite
// dev-server proxy configured in vite.config.ts.
const BASE_URL = '/getgems-api';

async function request<T>(path: string, init?: Parameters<typeof fetch>[1]): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
            Accept: 'application/json',
            Authorization: ENV_GETGEMS_API_KEY,
            ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
            ...init?.headers,
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`GetGems ${res.status} ${res.statusText}: ${text || path}`);
    }

    const body = (await res.json()) as GetGemsEnvelope<T> | T;

    if (typeof body === 'object' && body !== null && 'success' in body) {
        const envelope = body as GetGemsEnvelope<T>;
        if (!envelope.success) {
            throw new Error(`GetGems request failed: ${path}`);
        }
        return envelope.response;
    }

    return body as T;
}

export function fetchCollection(collectionAddress: string): Promise<GetGemsCollection> {
    return request<GetGemsCollection>(`/v1/collection/${encodeURIComponent(collectionAddress)}`);
}

export interface FetchNftsOnSaleParams {
    limit?: number;
    after?: string | null;
}

export function fetchNftsOnSale(
    collectionAddress: string,
    params: FetchNftsOnSaleParams = {},
): Promise<GetGemsNftsOnSaleResponse> {
    const { limit = 30, after } = params;
    const query = new URLSearchParams();
    query.set('limit', String(limit));
    if (after) query.set('after', after);
    return request<GetGemsNftsOnSaleResponse>(
        `/v1/nfts/on-sale/${encodeURIComponent(collectionAddress)}?${query.toString()}`,
    );
}

export function fetchNft(nftAddress: string): Promise<GetGemsNftFull> {
    return request<GetGemsNftFull>(`/v1/nft/${encodeURIComponent(nftAddress)}`);
}

export function buildBuyTransaction(nftAddress: string, version: string): Promise<GetGemsBuyResponse> {
    return request<GetGemsBuyResponse>(`/v1/nfts/buy-fix-price/${encodeURIComponent(nftAddress)}`, {
        method: 'POST',
        body: JSON.stringify({ version }),
    });
}
