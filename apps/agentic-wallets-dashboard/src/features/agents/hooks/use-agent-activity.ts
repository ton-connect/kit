/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from '@tanstack/react-query';
import { useAppKit, useNetwork } from '@ton/appkit-react';

import { ENV_AGENTIC_ACTIVITY_POLL_MS } from '@/core/configs/env';
import { isSameTonAddress } from '@/features/agents/lib/address';
import { mapWithConcurrency } from '@/features/agents/lib/async';

type ActivityDirection = 'incoming' | 'outgoing' | 'neutral';
type SwapProtocol = 'stonfi' | 'dedust' | 'other';
type ActivityCategory = 'ton' | 'jetton' | 'nft' | 'swap' | 'contract' | 'agent_ops' | 'system';
type ActivityRisk = 'normal' | 'unexpected';

interface AgentActivityAmount {
    signed: string;
    raw: string;
    symbol: string;
    isPositive: boolean;
    iconUrl?: string;
}

interface AgentActivityCounterparty {
    address?: string;
    shortLabel: string;
}

export interface AgentActivityItem {
    id: string;
    timestamp: number;
    type: string;
    summary: string;
    actionLabel: string;
    actor: 'agent' | 'user' | 'unknown';
    direction: ActivityDirection;
    category: ActivityCategory;
    amount?: AgentActivityAmount;
    thumbnailUrl?: string;
    counterparty?: AgentActivityCounterparty;
    risk: ActivityRisk;
    protocol?: SwapProtocol;
    swap?: {
        sent?: { amount: string; symbol: string; iconUrl?: string };
        received?: { amount: string; symbol: string; iconUrl?: string };
    };
    canMarkUnexpected: boolean;
    hash?: string;
}

const OP_CHANGE_OPERATOR = '0xea4e36cf';
const OP_CHANGE_NFT_CONTENT = '0x1a0b9d51';
const OP_WALLET_EXTENSION_ACTION = '0x6578746e';
const OP_DEPLOY_SUB_WALLET = '0x0609e47b';
const TON_ICON_URL = '/icons/ton.svg';
const NFT_PREFETCH_CONCURRENCY = 6;
const NFT_PLACEHOLDER_URL =
    'https://cache.tonapi.io/imgproxy/ungelhcbfJKsnhEzUP8QCI7Rd4BkE0RSN6yvBn27NT8/rs:fill:500:500:1/g:no/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3RvbmtlZXBlci9vcGVudG9uYXBpL21hc3Rlci9wa2cvcmVmZXJlbmNlcy9tZWRpYS90b2tlbl9wbGFjZWhvbGRlci5wbmc.webp';
const SHOW_EXECUTE_OWNER_OPERATION = false;

function formatJettonAmount(amount: unknown, decimals: unknown): string {
    try {
        const raw = typeof amount === 'bigint' ? amount : BigInt(String(amount));
        const dec = Number(decimals ?? 0);
        if (!Number.isFinite(dec) || dec <= 0) {
            return raw.toString();
        }

        const base = 10n ** BigInt(dec);
        const whole = raw / base;
        const fraction = raw % base;
        if (fraction === 0n) {
            return whole.toString();
        }

        const fractionStr = fraction.toString().padStart(dec, '0').replace(/0+$/, '');
        return `${whole.toString()}.${fractionStr}`;
    } catch {
        return String(amount ?? '?');
    }
}

function shortAddress(value: unknown): string {
    const str = typeof value === 'string' ? value : '';
    if (str.length < 10) return str || 'unknown';
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

function extractImageUrlFromNftEntity(nft: any): string | undefined {
    const infoImage = nft?.info?.image;
    if (typeof infoImage === 'string' && infoImage) {
        return infoImage;
    }
    if (infoImage && typeof infoImage === 'object') {
        const bySize =
            infoImage.smallUrl ?? infoImage.mediumUrl ?? infoImage.url ?? infoImage.largeUrl ?? infoImage.data;
        if (typeof bySize === 'string' && bySize) {
            return bySize;
        }
    }

    const collectionImage = nft?.collection?.image;
    if (collectionImage && typeof collectionImage === 'object') {
        const bySize =
            collectionImage.smallUrl ??
            collectionImage.mediumUrl ??
            collectionImage.url ??
            collectionImage.largeUrl ??
            collectionImage.data;
        if (typeof bySize === 'string' && bySize) {
            return bySize;
        }
    }

    const previews = nft?.extra?.previews;
    if (Array.isArray(previews)) {
        const preferred =
            previews.find((preview) => preview?.resolution === '100x100' && typeof preview?.url === 'string') ??
            previews.find((preview) => preview?.resolution === '500x500' && typeof preview?.url === 'string') ??
            previews.find((preview) => typeof preview?.url === 'string');
        if (preferred?.url) {
            return preferred.url;
        }
    }

    const metadataImage = nft?.extra?.metadata?.image;
    if (typeof metadataImage === 'string' && metadataImage) {
        return metadataImage;
    }

    return undefined;
}

function normalizeAction(action: any): { type: string; actor: 'agent' | 'user' | 'unknown' } {
    switch (action?.type) {
        case 'TonTransfer':
            return { type: 'TonTransfer', actor: 'unknown' };
        case 'JettonTransfer':
            return { type: 'JettonTransfer', actor: 'unknown' };
        case 'JettonSwap':
            return { type: 'JettonSwap', actor: 'unknown' };
        case 'NftItemTransfer':
            return { type: 'NftItemTransfer', actor: 'unknown' };
        case 'ContractDeploy':
            return { type: 'ContractDeploy', actor: 'unknown' };
        case 'SmartContractExec':
            return { type: 'SmartContractExec', actor: 'unknown' };
        default:
            return { type: action?.type ?? 'Unknown', actor: 'unknown' };
    }
}

function sameAddress(a: unknown, b: unknown): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    return isSameTonAddress(a, b);
}

function extractAddress(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && typeof (value as { address?: unknown }).address === 'string') {
        return (value as { address: string }).address;
    }
    return undefined;
}

function toCounterpartyLabel(value: unknown): string | null {
    if (value && typeof value === 'object') {
        const maybeName = (value as { name?: unknown }).name;
        if (typeof maybeName === 'string' && maybeName.trim()) {
            return maybeName;
        }
    }

    const address = extractAddress(value);
    if (!address) return null;
    return shortAddress(address);
}

function toCounterparty(value: unknown): AgentActivityCounterparty | undefined {
    const shortLabel = toCounterpartyLabel(value);
    if (!shortLabel) return undefined;

    const address = extractAddress(value);
    return {
        address,
        shortLabel,
    };
}

function parseBigIntUnknown(value: unknown): bigint | null {
    try {
        if (typeof value === 'bigint') return value;
        if (typeof value === 'number') return BigInt(value);
        if (typeof value === 'string') return value.startsWith('0x') ? BigInt(value) : BigInt(value);
        return null;
    } catch {
        return null;
    }
}

function normalizeOpcode(value: unknown): string {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return '';
    if (trimmed.startsWith('0x')) {
        return trimmed;
    }
    if (/^[0-9a-f]+$/.test(trimmed)) {
        return `0x${trimmed}`;
    }
    return '';
}

function detectSwapProtocol(action: any): SwapProtocol {
    const dex = String(action?.JettonSwap?.dex ?? '').toLowerCase();
    if (dex === 'stonfi') return 'stonfi';
    if (dex === 'dedust') return 'dedust';

    return 'other';
}

function formatTonUi(amount: unknown): string {
    try {
        const nano = typeof amount === 'bigint' ? amount : BigInt(String(amount));
        const abs = nano < 0n ? -nano : nano;
        const whole = abs / 1_000_000_000n;
        const fraction = abs % 1_000_000_000n;
        const fractionStr = fraction.toString().padStart(9, '0').replace(/0+$/, '').slice(0, 6);
        return fractionStr ? `${whole.toString()}.${fractionStr}` : whole.toString();
    } catch {
        return '0';
    }
}

function buildAmountImpact(
    rawAmount: unknown,
    symbol: string,
    decimals: number,
    isPositive: boolean,
    iconUrl?: string,
): AgentActivityAmount | undefined {
    const parsed = parseBigIntUnknown(rawAmount);
    if (parsed == null) {
        return undefined;
    }

    const abs = parsed < 0n ? -parsed : parsed;
    const formatted = symbol === 'TON' ? formatTonUi(abs) : formatJettonAmount(abs, decimals);

    const resolvedIconUrl = iconUrl ?? (symbol === 'TON' ? TON_ICON_URL : undefined);

    return {
        signed: `${isPositive ? '+' : '-'}${formatted}`,
        raw: parsed.toString(),
        symbol,
        isPositive,
        iconUrl: resolvedIconUrl,
    };
}

function parsePositiveBigInt(value: unknown): bigint | null {
    const parsed = parseBigIntUnknown(value);
    if (parsed == null || parsed <= 0n) return null;
    return parsed;
}

function extractSwapLegsFromJettonSwapPayload(jettonSwap: any): {
    sent?: { amount: string; symbol: string; iconUrl?: string };
    received?: { amount: string; symbol: string; iconUrl?: string };
} {
    const amountIn = parsePositiveBigInt(jettonSwap?.amount_in ?? jettonSwap?.amountIn);
    const amountOut = parsePositiveBigInt(jettonSwap?.amount_out ?? jettonSwap?.amountOut);
    const tonIn = parsePositiveBigInt(jettonSwap?.ton_in ?? jettonSwap?.tonIn);
    const tonOut = parsePositiveBigInt(jettonSwap?.ton_out ?? jettonSwap?.tonOut);

    const jettonIn = jettonSwap?.jetton_master_in ?? jettonSwap?.jettonMasterIn;
    const jettonOut = jettonSwap?.jetton_master_out ?? jettonSwap?.jettonMasterOut;

    const sent =
        amountIn != null
            ? {
                  amount: formatJettonAmount(amountIn, jettonIn?.decimals),
                  symbol: String(jettonIn?.symbol ?? 'JETTON'),
                  iconUrl: typeof jettonIn?.image === 'string' ? jettonIn.image : undefined,
              }
            : tonIn != null
              ? {
                    amount: formatTonUi(tonIn),
                    symbol: 'TON',
                    iconUrl: TON_ICON_URL,
                }
              : undefined;

    const received =
        amountOut != null
            ? {
                  amount: formatJettonAmount(amountOut, jettonOut?.decimals),
                  symbol: String(jettonOut?.symbol ?? 'JETTON'),
                  iconUrl: typeof jettonOut?.image === 'string' ? jettonOut.image : undefined,
              }
            : tonOut != null
              ? {
                    amount: formatTonUi(tonOut),
                    symbol: 'TON',
                    iconUrl: TON_ICON_URL,
                }
              : undefined;

    return { sent, received };
}

function buildSwapLabel(protocol: SwapProtocol): string {
    if (protocol === 'stonfi') return 'Swap on STON.fi';
    if (protocol === 'dedust') return 'Swap on DeDust';
    return 'Jetton swap';
}

function detectDirectionFromSwapLegs(swap: {
    sent?: { amount: string; symbol: string; iconUrl?: string };
    received?: { amount: string; symbol: string; iconUrl?: string };
}): ActivityDirection {
    if (swap.received && !swap.sent) return 'incoming';
    if (swap.sent && !swap.received) return 'outgoing';
    return 'neutral';
}

function classifyCategory(type: string, isAgentOperation: boolean): ActivityCategory {
    if (type === 'TonTransfer') return 'ton';
    if (type === 'JettonTransfer') return 'jetton';
    if (type === 'NftItemTransfer') return 'nft';
    if (type === 'JettonSwap') return 'swap';
    if (type === 'ContractDeploy') return isAgentOperation ? 'agent_ops' : 'contract';
    if (type === 'SmartContractExec') {
        return isAgentOperation ? 'agent_ops' : 'contract';
    }
    return 'system';
}

function detectActorFromSender(
    sender: unknown,
    agentAddress: string | null,
    ownerAddress: string | null,
): 'agent' | 'user' | 'unknown' {
    if (typeof sender !== 'string') return 'unknown';
    if (ownerAddress && sameAddress(sender, ownerAddress)) return 'user';
    if (agentAddress && sameAddress(sender, agentAddress)) return 'agent';
    return 'unknown';
}

function isWalletExtensionActionOperation(action: any): boolean {
    if (action?.type !== 'SmartContractExec') {
        return false;
    }

    const operation = String(action?.SmartContractExec?.operation ?? '').toLowerCase();
    if (operation.includes('walletextensionaction') || operation.includes('wallet_extension_action')) {
        return true;
    }

    const payload = String(action?.SmartContractExec?.payload ?? '').toLowerCase();
    return payload.includes('walletextensionaction') || payload.includes('wallet_extension_action');
}

function isOwnerInitiatedWalletExtension(action: any, ownerAddress: string | null): boolean {
    if (!isWalletExtensionActionOperation(action)) {
        return false;
    }

    const executor = action?.SmartContractExec?.executor?.address;
    if (ownerAddress && typeof executor === 'string' && sameAddress(executor, ownerAddress)) {
        return true;
    }

    return !ownerAddress;
}

function chooseCounterparty(
    sender: unknown,
    recipient: unknown,
    direction: ActivityDirection,
    agentAddress: string | null,
): AgentActivityCounterparty | undefined {
    if (direction === 'incoming') {
        return toCounterparty(sender) ?? toCounterparty(recipient);
    }
    if (direction === 'outgoing') {
        return toCounterparty(recipient) ?? toCounterparty(sender);
    }

    const normalizedAgent = agentAddress ?? null;
    const senderAddr = extractAddress(sender);
    const recipientAddr = extractAddress(recipient);

    if (senderAddr && (!normalizedAgent || !isSameTonAddress(senderAddr, normalizedAgent))) {
        return toCounterparty(sender);
    }
    if (recipientAddr && (!normalizedAgent || !isSameTonAddress(recipientAddr, normalizedAgent))) {
        return toCounterparty(recipient);
    }

    return toCounterparty(sender) ?? toCounterparty(recipient);
}

function getItemDedupPriority(item: AgentActivityItem): number {
    if (item.type === 'ContractDeploy') return 500;
    if (item.type === 'SmartContractExec' && item.category === 'agent_ops') return 460;
    if (item.type === 'SmartContractExec') return 420;
    if (item.type === 'JettonSwap') return 360;
    if (item.type === 'NftItemTransfer') return 340;
    if (item.type === 'JettonTransfer') return 320;
    if (item.type === 'TonTransfer') return 300;
    return 100;
}

function shouldReplaceByPriority(current: AgentActivityItem, candidate: AgentActivityItem): boolean {
    const currentPriority = getItemDedupPriority(current);
    const candidatePriority = getItemDedupPriority(candidate);
    if (candidatePriority !== currentPriority) {
        return candidatePriority > currentPriority;
    }

    if (candidate.canMarkUnexpected !== current.canMarkUnexpected) {
        return candidate.canMarkUnexpected;
    }

    if (Boolean(candidate.amount) !== Boolean(current.amount)) {
        return Boolean(candidate.amount);
    }

    return candidate.timestamp >= current.timestamp;
}

function dedupeByHash(items: AgentActivityItem[]): AgentActivityItem[] {
    const withoutHash: AgentActivityItem[] = [];
    const byHash = new Map<string, AgentActivityItem>();

    for (const item of items) {
        if (!item.hash) {
            withoutHash.push(item);
            continue;
        }

        const existing = byHash.get(item.hash);
        if (!existing || shouldReplaceByPriority(existing, item)) {
            byHash.set(item.hash, item);
        }
    }

    return [...withoutHash, ...byHash.values()];
}

function secondarySortWeight(item: AgentActivityItem): number {
    if (item.actionLabel === 'Execute Owner Operation') {
        return 0;
    }
    return 1;
}

export function useAgentActivity(agentAddress: string | null, ownerAddress: string | null = null) {
    const appKit = useAppKit();
    const network = useNetwork();

    return useQuery({
        queryKey: ['agentic-wallet-activity', network?.chainId, agentAddress, ownerAddress],
        enabled: !!network && !!agentAddress,
        refetchInterval: ENV_AGENTIC_ACTIVITY_POLL_MS,
        queryFn: async (): Promise<AgentActivityItem[]> => {
            if (!network || !agentAddress) {
                return [];
            }

            const client = appKit.networkManager.getClient(network);
            if (!client.getEvents) {
                return [];
            }

            const response = await client.getEvents({ account: agentAddress, limit: 20, offset: 0 });
            const events = response.events ?? [];
            const items: AgentActivityItem[] = [];

            const nftImageCache = new Map<string, string | null>();

            const loadNftThumbnail = async (nftAddress: string): Promise<string | undefined> => {
                if (!client.nftItemsByAddress || !nftAddress) {
                    return undefined;
                }

                try {
                    const response = await client.nftItemsByAddress({ address: nftAddress });
                    return extractImageUrlFromNftEntity(response?.nfts?.[0]);
                } catch {
                    return undefined;
                }
            };

            const nftAddressesToPrefetch = new Map<string, string>();

            for (const event of events as any[]) {
                const actions = Array.isArray(event?.actions) ? event.actions : [];
                for (const action of actions) {
                    if (action?.type === 'NftItemTransfer') {
                        const nftAddress =
                            typeof action?.NftItemTransfer?.nft === 'string' ? action.NftItemTransfer.nft : undefined;
                        const hasThumbnail = Boolean(
                            action?.simplePreview?.valueImage ??
                                action?.simple_preview?.value_image ??
                                action?.NftItemTransfer?.nft?.preview ??
                                action?.NftItemTransfer?.nft?.image ??
                                action?.NftItemTransfer?.nft?.metadata?.image,
                        );

                        if (!hasThumbnail && nftAddress) {
                            const cacheKey = nftAddress.toLowerCase();
                            if (!nftAddressesToPrefetch.has(cacheKey)) {
                                nftAddressesToPrefetch.set(cacheKey, nftAddress);
                            }
                        }
                    }
                }
            }

            await mapWithConcurrency(
                [...nftAddressesToPrefetch.values()],
                NFT_PREFETCH_CONCURRENCY,
                async (nftAddress) => {
                    const image = await loadNftThumbnail(nftAddress);
                    nftImageCache.set(nftAddress.toLowerCase(), image ?? null);
                    return image;
                },
            );

            const getNftThumbnail = (nftAddress: unknown): string | undefined => {
                if (typeof nftAddress !== 'string' || !nftAddress) {
                    return undefined;
                }

                const cached = nftImageCache.get(nftAddress.toLowerCase());
                return cached ?? undefined;
            };

            for (const event of events as any[]) {
                const actions = Array.isArray(event?.actions) ? event.actions : [];
                const eventHasOwnerWalletExtensionAction = actions.some((eventAction: any) =>
                    isOwnerInitiatedWalletExtension(eventAction, ownerAddress),
                );
                for (const action of actions) {
                    const normalized = normalizeAction(action);
                    let actor: 'agent' | 'user' | 'unknown' = normalized.actor;
                    let direction: ActivityDirection = 'neutral';
                    let category: ActivityCategory = classifyCategory(normalized.type, false);
                    let actionLabel = 'System activity';
                    let summary = 'System activity';
                    let amount: AgentActivityAmount | undefined;
                    let thumbnailUrl: string | undefined;
                    let counterparty: AgentActivityCounterparty | undefined;
                    let risk: ActivityRisk = 'normal';
                    let protocol: SwapProtocol | undefined;
                    let swap: AgentActivityItem['swap'];
                    const baseTxHash =
                        Array.isArray(action?.baseTransactions) && action.baseTransactions.length > 0
                            ? String(action.baseTransactions[0])
                            : undefined;
                    const dedupeHash = baseTxHash ?? event?.eventId;
                    let isAgentOperation = false;

                    if (action?.type === 'TonTransfer') {
                        const sender = action?.TonTransfer?.sender?.address;
                        const recipient = action?.TonTransfer?.recipient?.address;
                        actor = detectActorFromSender(action?.TonTransfer?.sender?.address, agentAddress, ownerAddress);
                        if (sameAddress(sender, agentAddress)) {
                            direction = 'outgoing';
                        } else if (sameAddress(recipient, agentAddress)) {
                            direction = 'incoming';
                        }
                        actionLabel =
                            direction === 'incoming'
                                ? 'Received TON'
                                : direction === 'outgoing'
                                  ? 'Sent TON'
                                  : 'TON transfer';
                        summary = actionLabel;
                        amount = buildAmountImpact(action?.TonTransfer?.amount, 'TON', 9, direction === 'incoming');
                        counterparty = chooseCounterparty(
                            action?.TonTransfer?.sender,
                            action?.TonTransfer?.recipient,
                            direction,
                            agentAddress,
                        );
                    } else if (action?.type === 'JettonTransfer') {
                        const sender = action?.JettonTransfer?.sender?.address;
                        const recipient = action?.JettonTransfer?.recipient?.address;
                        const symbol = String(action?.JettonTransfer?.jetton?.symbol ?? 'JETTON');
                        const decimals = Number(action?.JettonTransfer?.jetton?.decimals ?? 0);
                        actor = detectActorFromSender(
                            action?.JettonTransfer?.sender?.address,
                            agentAddress,
                            ownerAddress,
                        );
                        if (sameAddress(sender, agentAddress)) {
                            direction = 'outgoing';
                        } else if (sameAddress(recipient, agentAddress)) {
                            direction = 'incoming';
                        }
                        actionLabel =
                            direction === 'incoming'
                                ? `Received ${symbol}`
                                : direction === 'outgoing'
                                  ? `Sent ${symbol}`
                                  : 'Jetton transfer';
                        summary = actionLabel;
                        amount = buildAmountImpact(
                            action?.JettonTransfer?.amount,
                            symbol,
                            Number.isFinite(decimals) ? decimals : 0,
                            direction === 'incoming',
                            action?.JettonTransfer?.jetton?.image ??
                                action?.simplePreview?.valueImage ??
                                action?.simple_preview?.value_image,
                        );
                        counterparty = chooseCounterparty(
                            action?.JettonTransfer?.sender,
                            action?.JettonTransfer?.recipient,
                            direction,
                            agentAddress,
                        );
                    } else if (action?.type === 'NftItemTransfer') {
                        const sender = action?.NftItemTransfer?.sender?.address;
                        const recipient = action?.NftItemTransfer?.recipient?.address;
                        const nftAddress =
                            typeof action?.NftItemTransfer?.nft === 'string' ? action.NftItemTransfer.nft : undefined;
                        actor = detectActorFromSender(
                            action?.NftItemTransfer?.sender?.address,
                            agentAddress,
                            ownerAddress,
                        );
                        if (sameAddress(sender, agentAddress)) {
                            direction = 'outgoing';
                        } else if (sameAddress(recipient, agentAddress)) {
                            direction = 'incoming';
                        }
                        actionLabel =
                            direction === 'incoming'
                                ? 'Received NFT'
                                : direction === 'outgoing'
                                  ? 'Sent NFT'
                                  : 'NFT transfer';
                        summary = actionLabel;
                        thumbnailUrl =
                            action?.simplePreview?.valueImage ??
                            action?.simple_preview?.value_image ??
                            action?.NftItemTransfer?.nft?.preview ??
                            action?.NftItemTransfer?.nft?.image ??
                            action?.NftItemTransfer?.nft?.metadata?.image;
                        if (!thumbnailUrl && nftAddress) {
                            thumbnailUrl = getNftThumbnail(nftAddress);
                        }
                        thumbnailUrl = thumbnailUrl ?? NFT_PLACEHOLDER_URL;
                        counterparty = chooseCounterparty(
                            action?.NftItemTransfer?.sender,
                            action?.NftItemTransfer?.recipient,
                            direction,
                            agentAddress,
                        );
                    } else if (action?.type === 'JettonSwap') {
                        protocol = detectSwapProtocol(action);

                        swap = extractSwapLegsFromJettonSwapPayload(action?.JettonSwap);
                        actionLabel = buildSwapLabel(protocol);
                        summary = actionLabel;
                        direction = detectDirectionFromSwapLegs(swap);
                        counterparty = toCounterparty(
                            action?.JettonSwap?.router ??
                                action?.JettonSwap?.user_wallet ??
                                action?.JettonSwap?.userWallet,
                        );

                        actor = detectActorFromSender(
                            action?.JettonSwap?.user_wallet?.address ?? action?.JettonSwap?.userWallet?.address,
                            agentAddress,
                            ownerAddress,
                        );

                        if (direction === 'outgoing' && swap?.sent) {
                            amount = {
                                signed: `-${swap.sent.amount}`,
                                raw: swap.sent.amount,
                                symbol: swap.sent.symbol,
                                isPositive: false,
                                iconUrl: swap.sent.iconUrl,
                            };
                        } else if (direction === 'incoming' && swap?.received) {
                            amount = {
                                signed: `+${swap.received.amount}`,
                                raw: swap.received.amount,
                                symbol: swap.received.symbol,
                                isPositive: true,
                                iconUrl: swap.received.iconUrl,
                            };
                        }
                    }

                    if (action?.type === 'SmartContractExec' || action?.type === 'ContractDeploy') {
                        const opcode =
                            normalizeOpcode(action?.SmartContractExec?.operation) ||
                            normalizeOpcode(action?.ContractDeploy?.operation);
                        const ownerWalletExtensionOperation =
                            isOwnerInitiatedWalletExtension(action, ownerAddress) ||
                            opcode === OP_WALLET_EXTENSION_ACTION;

                        if (ownerWalletExtensionOperation) {
                            actionLabel = 'Execute Owner Operation';
                            summary = actionLabel;
                            actor = 'user';
                            isAgentOperation = true;
                        } else if (opcode === OP_DEPLOY_SUB_WALLET) {
                            actionLabel = 'Deployed sub-wallet';
                            summary = actionLabel;
                            actor = 'agent';
                            isAgentOperation = true;
                        } else if (opcode === OP_CHANGE_OPERATOR) {
                            const nextKey =
                                parseBigIntUnknown((action?.SmartContractExec as any)?.newOperatorPublicKey) ??
                                parseBigIntUnknown((action?.SmartContractExec as any)?.new_operator_public_key);
                            if (nextKey === 0n) {
                                actionLabel = 'Revoke agent access';
                                summary = actionLabel;
                                actor = 'user';
                            } else {
                                actionLabel = 'Change operator public key';
                                summary = actionLabel;
                                actor = 'user';
                            }
                            isAgentOperation = true;
                        } else if (opcode === OP_CHANGE_NFT_CONTENT) {
                            actionLabel = 'Rename agent';
                            summary = actionLabel;
                            actor = 'user';
                            isAgentOperation = true;
                        } else {
                            actionLabel =
                                action?.type === 'ContractDeploy' ? 'Contract deployment' : 'Smart contract execution';
                            summary = actionLabel;
                        }

                        if (action?.type === 'SmartContractExec') {
                            counterparty =
                                toCounterparty(action?.SmartContractExec?.contract) ??
                                toCounterparty(action?.SmartContractExec?.executor);
                        } else {
                            counterparty = toCounterparty(action?.ContractDeploy?.address);
                        }
                    }

                    if (
                        eventHasOwnerWalletExtensionAction &&
                        actor === 'agent' &&
                        direction === 'outgoing' &&
                        actionLabel !== 'Execute Owner Operation'
                    ) {
                        actor = 'user';
                    }

                    if (!SHOW_EXECUTE_OWNER_OPERATION && actionLabel === 'Execute Owner Operation') {
                        continue;
                    }

                    if (!summary) {
                        summary = actionLabel || 'System activity';
                    }

                    if (!actionLabel) {
                        actionLabel = summary || 'System activity';
                    }

                    if (normalized.type === 'Unknown') {
                        actionLabel = 'System activity';
                        summary = actionLabel;
                    }

                    category = classifyCategory(normalized.type, isAgentOperation);
                    risk = 'normal';
                    const canMarkUnexpected = actor === 'agent' && (direction === 'outgoing' || category === 'swap');

                    items.push({
                        id: `${event?.eventId ?? 'event'}:${action?.id ?? normalized.type}`,
                        timestamp: Number(event?.timestamp ?? 0),
                        type: normalized.type,
                        summary,
                        actionLabel,
                        actor,
                        direction,
                        category,
                        amount,
                        thumbnailUrl,
                        counterparty,
                        risk,
                        protocol,
                        swap,
                        canMarkUnexpected,
                        hash: dedupeHash,
                    });
                }
            }

            return dedupeByHash(items).sort((a, b) => {
                if (a.timestamp !== b.timestamp) {
                    return b.timestamp - a.timestamp;
                }

                const aWeight = secondarySortWeight(a);
                const bWeight = secondarySortWeight(b);
                if (aWeight !== bWeight) {
                    return bWeight - aWeight;
                }

                return 0;
            });
        },
    });
}
