/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface GetGemsEnvelope<T> {
    success: boolean;
    response: T;
}

export interface GetGemsFixPriceSale {
    type?: string;
    fullPrice: string;
    marketplaceFee?: string;
    currency?: string;
    version: string;
    contractAddress?: string;
}

export type GetGemsSale = GetGemsFixPriceSale | { type?: string; [key: string]: unknown };

export interface GetGemsNftOnSale {
    address: string;
    name?: string | null;
    image?: string | null;
    sale?: GetGemsSale | null;
}

export interface GetGemsNftsOnSaleResponse {
    items: GetGemsNftOnSale[];
    cursor?: string | null;
}

export interface GetGemsNftFull {
    address: string;
    name?: string | null;
    description?: string | null;
    image?: string | null;
    ownerAddress?: string | null;
    sale?: GetGemsSale | null;
}

export interface GetGemsCollection {
    address: string;
    name?: string | null;
    description?: string | null;
    image?: string | null;
    ownerAddress?: string | null;
}

export interface GetGemsBuyMessage {
    to: string;
    amount: string;
    payload?: string | null;
    stateInit?: string | null;
}

export interface GetGemsBuyResponse {
    uuid: string;
    from?: string | null;
    timeout: string;
    list: GetGemsBuyMessage[];
}

export function isFixPriceSale(sale: GetGemsSale | null | undefined): sale is GetGemsFixPriceSale {
    if (!sale) return false;
    const candidate = sale as GetGemsFixPriceSale;
    return typeof candidate.version === 'string' && typeof candidate.fullPrice === 'string';
}
