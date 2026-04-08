/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Structured item types for sendTransaction/signMessage with items instead of raw messages

export type StructuredItemType = 'ton' | 'jetton' | 'nft';

export type StructuredItem = TonTransferItem | JettonTransferItem | NftTransferItem;

/** Snake_case wire-format items as received in JSON-RPC payload */
export type RawStructuredItem = RawTonTransferItem | RawJettonTransferItem | RawNftTransferItem;

// --- Raw (wire format, snake_case) ---

export interface RawTonTransferItem {
    type: 'ton';
    address: string;
    amount: string;
    payload?: string;
    state_init?: string;
    extra_currency?: { [k: number]: string };
}

export interface RawJettonTransferItem {
    type: 'jetton';
    master: string;
    destination: string;
    amount: string;
    attach_amount?: string;
    response_destination?: string;
    custom_payload?: string;
    forward_amount?: string;
    forward_payload?: string;
}

export interface RawNftTransferItem {
    type: 'nft';
    nft_address: string;
    new_owner: string;
    attach_amount?: string;
    response_destination?: string;
    custom_payload?: string;
    forward_amount?: string;
    forward_payload?: string;
}

// --- Parsed (internal format, camelCase) ---

export interface TonTransferItem {
    type: 'ton';
    address: string;
    amount: string;
    payload?: string;
    stateInit?: string;
    extraCurrency?: { [k: number]: string };
}

export interface JettonTransferItem {
    type: 'jetton';
    master: string;
    destination: string;
    amount: string;
    attachAmount?: string;
    responseDestination?: string;
    customPayload?: string;
    forwardAmount?: string;
    forwardPayload?: string;
}

export interface NftTransferItem {
    type: 'nft';
    nftAddress: string;
    newOwner: string;
    attachAmount?: string;
    responseDestination?: string;
    customPayload?: string;
    forwardAmount?: string;
    forwardPayload?: string;
}

// --- Conversion helpers ---

export function parseRawStructuredItem(raw: RawStructuredItem): StructuredItem {
    switch (raw.type) {
        case 'ton':
            return {
                type: 'ton',
                address: raw.address,
                amount: raw.amount,
                payload: raw.payload,
                stateInit: raw.state_init,
                extraCurrency: raw.extra_currency,
            };
        case 'jetton':
            return {
                type: 'jetton',
                master: raw.master,
                destination: raw.destination,
                amount: raw.amount,
                attachAmount: raw.attach_amount,
                responseDestination: raw.response_destination,
                customPayload: raw.custom_payload,
                forwardAmount: raw.forward_amount,
                forwardPayload: raw.forward_payload,
            };
        case 'nft':
            return {
                type: 'nft',
                nftAddress: raw.nft_address,
                newOwner: raw.new_owner,
                attachAmount: raw.attach_amount,
                responseDestination: raw.response_destination,
                customPayload: raw.custom_payload,
                forwardAmount: raw.forward_amount,
                forwardPayload: raw.forward_payload,
            };
    }
}

export function toRawStructuredItem(item: StructuredItem): RawStructuredItem {
    switch (item.type) {
        case 'ton':
            return {
                type: 'ton',
                address: item.address,
                amount: item.amount,
                payload: item.payload,
                state_init: item.stateInit,
                extra_currency: item.extraCurrency,
            };
        case 'jetton':
            return {
                type: 'jetton',
                master: item.master,
                destination: item.destination,
                amount: item.amount,
                attach_amount: item.attachAmount,
                response_destination: item.responseDestination,
                custom_payload: item.customPayload,
                forward_amount: item.forwardAmount,
                forward_payload: item.forwardPayload,
            };
        case 'nft':
            return {
                type: 'nft',
                nft_address: item.nftAddress,
                new_owner: item.newOwner,
                attach_amount: item.attachAmount,
                response_destination: item.responseDestination,
                custom_payload: item.customPayload,
                forward_amount: item.forwardAmount,
                forward_payload: item.forwardPayload,
            };
    }
}
