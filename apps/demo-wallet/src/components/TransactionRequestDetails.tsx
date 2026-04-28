/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import type { StructuredItem, TransactionRequest, TransactionRequestMessage } from '@ton/walletkit';
import { getAddressExplorerUrls } from '@demo/wallet-core';

import { useActiveWalletNetwork, useJettonInfo } from '../hooks/useJettonInfo';
import { normalizeAddress, shortenAddress } from '../utils/formatters';
import { decodeTextCommentPayload } from '../utils/payload';
import { formatNanoTonAmount, formatTokenAmount } from '../utils/units';

interface TransactionRequestDetailsProps {
    request: TransactionRequest;
    title?: string;
}

function AddressLink({ address, label }: { address?: string; label?: string }) {
    const network = useActiveWalletNetwork();
    if (!address) return null;

    const normalized = normalizeAddress(address) ?? address;

    return (
        <a
            href={getAddressExplorerUrls(normalized, network).tonViewer}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            title={normalized}
        >
            {label ?? shortenAddress(address, 8)}
        </a>
    );
}

function DetailPill({ children }: { children: React.ReactNode }) {
    return <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded">{children}</span>;
}

function PayloadDetails({ label, payload }: { label: string; payload?: string }) {
    if (!payload) return null;
    const decoded = decodeTextCommentPayload(payload);

    return (
        <div className="text-xs text-gray-600 break-words">
            <span className="font-medium text-gray-700">{label}: </span>
            {decoded ? (
                <span>Comment “{decoded}”</span>
            ) : (
                <span className="font-mono">{payload.length > 48 ? `${payload.slice(0, 48)}...` : payload}</span>
            )}
        </div>
    );
}

function renderDetails(details: Array<string | undefined>) {
    const filtered = details.filter((detail): detail is string => Boolean(detail));
    if (filtered.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5">
            {filtered.map((detail) => (
                <DetailPill key={detail}>{detail}</DetailPill>
            ))}
        </div>
    );
}

function RawMessageAction({ message, index }: { message: TransactionRequestMessage; index: number }) {
    return (
        <div className="p-3 border border-gray-200 rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">Message #{index + 1}</div>
                    <div className="text-xs text-gray-500 truncate">
                        To <AddressLink address={message.address} />
                    </div>
                </div>
                <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {formatNanoTonAmount(message.amount)}
                </div>
            </div>
            {renderDetails([
                message.stateInit ? 'State init' : undefined,
                message.mode !== undefined ? `Mode ${message.mode}` : undefined,
                message.extraCurrency && Object.keys(message.extraCurrency).length > 0 ? 'Extra currencies' : undefined,
            ])}
            <PayloadDetails label="Payload" payload={message.payload} />
        </div>
    );
}

function TonItemAction({ item, index }: { item: Extract<StructuredItem, { type: 'ton' }>; index: number }) {
    return (
        <div className="p-3 border border-gray-200 rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">Send TON #{index + 1}</div>
                    <div className="text-xs text-gray-500 truncate">
                        To <AddressLink address={item.address} />
                    </div>
                </div>
                <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {formatNanoTonAmount(item.amount)}
                </div>
            </div>
            {renderDetails([
                item.stateInit ? 'State init' : undefined,
                item.extraCurrency && Object.keys(item.extraCurrency).length > 0 ? 'Extra currencies' : undefined,
            ])}
            <PayloadDetails label="Payload" payload={item.payload} />
        </div>
    );
}

function JettonItemAction({ item, index }: { item: Extract<StructuredItem, { type: 'jetton' }>; index: number }) {
    const jettonInfo = useJettonInfo(item.master);

    return (
        <div className="p-3 border border-gray-200 rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">Send jetton #{index + 1}</div>
                    <div className="text-xs text-gray-500 truncate">
                        To <AddressLink address={item.destination} />
                    </div>
                    <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                        {jettonInfo?.image && <img src={jettonInfo.image} alt="" className="w-4 h-4 rounded-full" />}
                        <span>{jettonInfo?.name ?? 'Jetton'}</span>
                        <AddressLink
                            address={item.master}
                            label={jettonInfo?.symbol ?? shortenAddress(item.master, 8)}
                        />
                    </div>
                </div>
                <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {formatTokenAmount(item.amount, jettonInfo?.decimals ?? 9, jettonInfo?.symbol)}
                </div>
            </div>
            {renderDetails([
                item.attachAmount ? `Attach ${formatNanoTonAmount(item.attachAmount)}` : undefined,
                item.forwardAmount ? `Forward ${formatNanoTonAmount(item.forwardAmount)}` : undefined,
                item.responseDestination ? `Response ${shortenAddress(item.responseDestination, 8)}` : undefined,
            ])}
            <PayloadDetails label="Custom payload" payload={item.customPayload} />
            <PayloadDetails label="Forward payload" payload={item.forwardPayload} />
        </div>
    );
}

function NftItemAction({ item, index }: { item: Extract<StructuredItem, { type: 'nft' }>; index: number }) {
    return (
        <div className="p-3 border border-gray-200 rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">Transfer NFT #{index + 1}</div>
                    <div className="text-xs text-gray-500 truncate">
                        To <AddressLink address={item.newOwner} />
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                        NFT <AddressLink address={item.nftAddress} />
                    </div>
                </div>
            </div>
            {renderDetails([
                item.attachAmount ? `Attach ${formatNanoTonAmount(item.attachAmount)}` : undefined,
                item.forwardAmount ? `Forward ${formatNanoTonAmount(item.forwardAmount)}` : undefined,
                item.responseDestination ? `Response ${shortenAddress(item.responseDestination, 8)}` : undefined,
            ])}
            <PayloadDetails label="Custom payload" payload={item.customPayload} />
            <PayloadDetails label="Forward payload" payload={item.forwardPayload} />
        </div>
    );
}

function StructuredItemAction({ item, index }: { item: StructuredItem; index: number }) {
    if (item.type === 'ton') return <TonItemAction item={item} index={index} />;
    if (item.type === 'jetton') return <JettonItemAction item={item} index={index} />;
    return <NftItemAction item={item} index={index} />;
}

export function TransactionRequestDetails({ request, title = 'You will sign:' }: TransactionRequestDetailsProps) {
    const items = request.items ?? [];
    const messages = request.messages ?? [];
    const hasItems = items.length > 0;
    const count = hasItems ? items.length : messages.length;

    return (
        <div>
            <div className="font-semibold mb-1">{title}</div>
            <div className="space-y-2">
                {count === 0 ? (
                    <div className="border rounded-lg p-3 bg-gray-50">
                        <p className="text-sm text-gray-600 text-center">No outgoing messages in this request</p>
                    </div>
                ) : hasItems ? (
                    items.map((item, index) => (
                        <StructuredItemAction key={`${item.type}-${index}`} item={item} index={index} />
                    ))
                ) : (
                    messages.map((message, index) => (
                        <RawMessageAction key={`${message.address}-${index}`} message={message} index={index} />
                    ))
                )}
            </div>
        </div>
    );
}
