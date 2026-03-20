/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    ConnectionRequestEvent,
    SendTransactionRequestEvent,
    SignDataRequestEvent,
    TONConnectSession,
} from '@ton/walletkit';

import type {
    TonConnectConnectSummary,
    TonConnectDappSummary,
    TonConnectRequestSummary,
    TonConnectSessionSummary,
    TonConnectSignDataSummary,
    TonConnectTransactionSummary,
} from '../types/tonconnect.js';

function truncateText(value: string, maxLength: number = 160): string {
    if (value.length <= maxLength) {
        return value;
    }
    return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

function mapDappSummary(input: {
    name?: string;
    url?: string;
    iconUrl?: string;
    manifestUrl?: string;
    domain?: string;
}): TonConnectDappSummary | undefined {
    const summary: TonConnectDappSummary = {
        ...(input.name ? { name: input.name } : {}),
        ...(input.url ? { url: input.url } : {}),
        ...(input.iconUrl ? { iconUrl: input.iconUrl } : {}),
        ...(input.manifestUrl ? { manifestUrl: input.manifestUrl } : {}),
        ...(input.domain ? { domain: input.domain } : {}),
    };

    return Object.keys(summary).length > 0 ? summary : undefined;
}

function stringifyNetwork(network: unknown): string | undefined {
    if (!network || typeof network !== 'object') {
        return undefined;
    }

    const candidate = network as { chainId?: string | number };
    return candidate.chainId !== undefined ? String(candidate.chainId) : undefined;
}

function formatNanoToTon(amount: string): string {
    try {
        const value = BigInt(amount);
        const sign = value < 0n ? '-' : '';
        const absolute = value < 0n ? -value : value;
        const whole = absolute / 1000000000n;
        const fraction = (absolute % 1000000000n).toString().padStart(9, '0').replace(/0+$/, '');
        return fraction ? `${sign}${whole.toString()}.${fraction}` : `${sign}${whole.toString()}`;
    } catch {
        return amount;
    }
}

export function mapConnectEventToSummary(event: ConnectionRequestEvent): TonConnectConnectSummary {
    return {
        requestId: event.id,
        type: 'connect',
        sessionId: event.sessionId ?? event.from,
        walletId: event.walletId,
        walletAddress: event.walletAddress,
        dapp: mapDappSummary({
            name: event.preview.dAppInfo?.name ?? event.dAppInfo?.name,
            url: event.preview.dAppInfo?.url ?? event.dAppInfo?.url,
            iconUrl: event.preview.dAppInfo?.iconUrl ?? event.dAppInfo?.iconUrl,
            manifestUrl: event.preview.dAppInfo?.manifestUrl ?? event.dAppInfo?.manifestUrl,
            domain: event.domain,
        }),
        requestedItems: event.requestedItems.map((item) => item.type),
        permissions: event.preview.permissions.map((permission) => ({
            ...(permission.name ? { name: permission.name } : {}),
            ...(permission.title ? { title: permission.title } : {}),
            ...(permission.description ? { description: permission.description } : {}),
        })),
        ...(event.preview.manifestFetchErrorCode !== undefined
            ? { manifestFetchErrorCode: event.preview.manifestFetchErrorCode }
            : {}),
    };
}

export function mapTransactionEventToSummary(event: SendTransactionRequestEvent): TonConnectTransactionSummary {
    return {
        requestId: event.id,
        type: 'sendTransaction',
        sessionId: event.sessionId ?? event.from,
        walletId: event.walletId,
        walletAddress: event.walletAddress,
        dapp: mapDappSummary({
            name: event.dAppInfo?.name,
            url: event.dAppInfo?.url,
            iconUrl: event.dAppInfo?.iconUrl,
            manifestUrl: event.dAppInfo?.manifestUrl,
            domain: event.domain,
        }),
        ...(event.request.validUntil !== undefined ? { validUntil: event.request.validUntil } : {}),
        ...(event.request.fromAddress ? { fromAddress: event.request.fromAddress } : {}),
        ...(stringifyNetwork(event.request.network) ? { network: stringifyNetwork(event.request.network) } : {}),
        messages: event.request.messages.map((message) => ({
            address: message.address,
            amountNano: String(message.amount),
            amountTon: formatNanoToTon(String(message.amount)),
            hasPayload: Boolean(message.payload),
            hasStateInit: Boolean(message.stateInit),
            ...(message.mode !== undefined ? { mode: String(message.mode) } : {}),
        })),
        ...(event.preview.data
            ? {
                  preview: {
                      result: event.preview.data.result,
                      ...(event.preview.data.error ? { error: event.preview.data.error } : {}),
                      hasTrace: Boolean(event.preview.data.trace),
                      ...(event.preview.data.moneyFlow ? { moneyFlow: event.preview.data.moneyFlow } : {}),
                  },
              }
            : {}),
    };
}

export function mapSignDataEventToSummary(event: SignDataRequestEvent): TonConnectSignDataSummary {
    const preview = event.preview.data;

    return {
        requestId: event.id,
        type: 'signData',
        sessionId: event.sessionId ?? event.from,
        walletId: event.walletId,
        walletAddress: event.walletAddress,
        dapp: mapDappSummary({
            name: event.preview.dAppInfo?.name ?? event.dAppInfo?.name,
            url: event.preview.dAppInfo?.url ?? event.dAppInfo?.url,
            iconUrl: event.preview.dAppInfo?.iconUrl ?? event.dAppInfo?.iconUrl,
            manifestUrl: event.preview.dAppInfo?.manifestUrl ?? event.dAppInfo?.manifestUrl,
            domain: event.domain,
        }),
        signDataType: preview.type,
        ...(event.domain ? { domain: event.domain } : {}),
        ...(preview.type === 'text'
            ? {
                  previewText: truncateText(preview.value.content),
                  contentLength: preview.value.content.length,
              }
            : preview.type === 'binary'
              ? {
                    contentLength: preview.value.content.length,
                }
              : {
                    contentLength: preview.value.content.length,
                    schema: preview.value.schema,
                    hasParsedData: Boolean(preview.value.parsed),
                }),
    };
}

export function mapRequestSummary(
    event: ConnectionRequestEvent | SendTransactionRequestEvent | SignDataRequestEvent,
): TonConnectRequestSummary {
    if ('requestedItems' in event) {
        return mapConnectEventToSummary(event);
    }
    if ('request' in event) {
        return mapTransactionEventToSummary(event);
    }
    return mapSignDataEventToSummary(event);
}

export function sanitizeTonConnectSession(session: TONConnectSession): TonConnectSessionSummary {
    return {
        sessionId: session.sessionId,
        walletId: session.walletId,
        walletAddress: session.walletAddress,
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        domain: session.domain,
        ...(session.dAppName ? { dAppName: session.dAppName } : {}),
        ...(session.dAppDescription ? { dAppDescription: session.dAppDescription } : {}),
        ...(session.dAppUrl ? { dAppUrl: session.dAppUrl } : {}),
        ...(session.dAppIconUrl ? { dAppIconUrl: session.dAppIconUrl } : {}),
        ...(session.isJsBridge !== undefined ? { isJsBridge: session.isJsBridge } : {}),
        schemaVersion: session.schemaVersion,
    };
}
