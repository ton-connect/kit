/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Address, toNano } from '@ton/core';
import { createTransferJettonTransaction, createTransferNftTransaction } from '@ton/appkit';
import {
    useAddress,
    useAppKit,
    useBalanceByAddress,
    useJettonsByAddress,
    useNetwork,
    useNfts,
    useSelectedWallet,
    useSendTransaction,
} from '@ton/appkit-react';
import { getMaxOutgoingMessages } from '@ton/walletkit';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
    ENV_AGENTIC_COLLECTION_MAINNET,
    ENV_AGENTIC_COLLECTION_TESTNET,
    ENV_AGENTIC_WALLET_CODE_BOC,
} from '@/core/configs/env';
import {
    buildWalletStateInit,
    calculateWalletIndex,
    cellToBase64,
    createDeployWalletBody,
    createQueryId,
    getAgentWalletState,
    getCollectionAddressByIndex,
} from '@/features/agents/lib/agentic-wallet';
import { buildOnchainMetadataCell } from '@/features/agents/lib/metadata';
import { isAllowedNftTrust } from '@/features/agents/lib/nft-trust';
import { parseUint256PublicKey } from '@/features/agents/lib/public-key';
import { formatUnitsTrimmed, parseUiAmountToUnits, tryParseUiAmountToUnits } from '@/features/agents/lib/amount';
import { isSameTonAddress } from '@/features/agents/lib/address';

const DEPLOY_BASE_NANO = toNano('0.05');
const PER_ASSET_RESERVE_NANO = toNano('0.06');

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function collectionAddressByChain(chainId: string | undefined): string {
    if (chainId === '-239') {
        return ENV_AGENTIC_COLLECTION_MAINNET;
    }
    if (chainId === '-3') {
        return ENV_AGENTIC_COLLECTION_TESTNET;
    }
    return '';
}

type DepositAssetKind = 'jetton' | 'nft';

interface DepositAssetItem {
    id: string;
    kind: DepositAssetKind;
    address: string;
    label: string;
    sublabel?: string;
    imageUrl?: string;
    decimals?: number;
    balance?: string;
    usdEquivalent?: number;
}

interface DepositAssetDraft {
    id: string;
    assetId: string;
    amount: string;
}

interface CreateDeepLinkAssetInput {
    kind: DepositAssetKind;
    address?: string;
    amount?: string;
    symbol?: string;
    label?: string;
}

interface CreateDeepLinkPayload {
    operatorPublicKey?: string;
    agentName?: string;
    source?: string;
    tonDeposit?: string;
    assets: CreateDeepLinkAssetInput[];
}

function getFirstQueryParam(searchParams: URLSearchParams, keys: string[]): string | undefined {
    for (const key of keys) {
        const value = searchParams.get(key);
        if (value && value.trim()) {
            return value.trim();
        }
    }
    return undefined;
}

function parseAssetToken(value: string): CreateDeepLinkAssetInput | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const parts = trimmed.split(':');
    if (parts.length < 2) {
        return null;
    }

    const kind = parts[0]?.toLowerCase();
    const address = parts[1]?.trim();
    const amount = parts.slice(2).join(':').trim();
    if (!address) {
        return null;
    }

    if (kind === 'jetton') {
        return { kind: 'jetton', address, amount: amount || undefined };
    }
    if (kind === 'nft') {
        return { kind: 'nft', address };
    }

    return null;
}

function parseCreateDeepLink(searchParams: URLSearchParams): CreateDeepLinkPayload {
    const assets: CreateDeepLinkAssetInput[] = [];

    const jsonAssetsRaw = searchParams.get('assets');
    if (jsonAssetsRaw) {
        try {
            const parsed = JSON.parse(jsonAssetsRaw);
            if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    const kind = item?.kind === 'nft' ? 'nft' : item?.kind === 'jetton' ? 'jetton' : null;
                    if (!kind) {
                        continue;
                    }
                    const address = typeof item?.address === 'string' ? item.address.trim() : undefined;
                    const amount = typeof item?.amount === 'string' ? item.amount.trim() : undefined;
                    const symbol = typeof item?.symbol === 'string' ? item.symbol.trim() : undefined;
                    const label = typeof item?.label === 'string' ? item.label.trim() : undefined;
                    assets.push({ kind, address, amount, symbol, label });
                }
            }
        } catch {
            // ignore malformed JSON
        }
    }

    for (const value of searchParams.getAll('asset')) {
        const parsed = parseAssetToken(value);
        if (parsed) {
            assets.push(parsed);
        }
    }

    for (const value of searchParams.getAll('jetton')) {
        const [addressPart, amountPart] = value.split(':');
        const address = addressPart?.trim();
        if (!address) {
            continue;
        }
        assets.push({
            kind: 'jetton',
            address,
            amount: amountPart?.trim() || undefined,
        });
    }

    for (const value of searchParams.getAll('nft')) {
        const address = value.trim();
        if (!address) {
            continue;
        }
        assets.push({
            kind: 'nft',
            address,
        });
    }

    return {
        operatorPublicKey: getFirstQueryParam(searchParams, [
            'originOperatorPublicKey',
            'operatorPublicKey',
            'operatorPubkey',
            'operator',
            'pubkey',
        ]),
        agentName: getFirstQueryParam(searchParams, ['agentName', 'name']),
        source: getFirstQueryParam(searchParams, ['source']),
        tonDeposit: getFirstQueryParam(searchParams, ['tonDeposit', 'ton', 'tonAmount']),
        assets,
    };
}

export function CreateAgentPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const appKit = useAppKit();
    const [wallet] = useSelectedWallet();
    const network = useNetwork();
    const ownerAddress = useAddress();
    const { data: ownerTonBalance } = useBalanceByAddress({ address: ownerAddress ?? '', network });
    const { mutateAsync: sendTransaction, isPending } = useSendTransaction();
    const { data: jettonsResponse } = useJettonsByAddress({ address: ownerAddress, network });
    const { data: nftsResponse } = useNfts({ network });

    const [originOperatorPublicKey, setOriginOperatorPublicKey] = useState('');
    const [agentName, setAgentName] = useState('');
    const [source, setSource] = useState('');
    const [tonDeposit, setTonDeposit] = useState('0.2');
    const [assetDeposits, setAssetDeposits] = useState<DepositAssetDraft[]>([]);
    const [openSelectorId, setOpenSelectorId] = useState<string | null>(null);
    const [jettonsOpenById, setJettonsOpenById] = useState<Record<string, boolean>>({});
    const [nftsOpenById, setNftsOpenById] = useState<Record<string, boolean>>({});
    const [isAwaitingIndexing, setIsAwaitingIndexing] = useState(false);
    const isDeepLinkScalarsAppliedRef = useRef(false);
    const isDeepLinkAssetsAppliedRef = useRef(false);
    const deepLinkPayload = useMemo(() => parseCreateDeepLink(searchParams), [searchParams]);

    const collectionAddress = useMemo(() => collectionAddressByChain(network?.chainId), [network?.chainId]);
    const walletFeatures = (
        wallet as unknown as { tonConnectWallet?: { device?: { features?: unknown[] } } } | null
    )?.tonConnectWallet?.device?.features;
    const maxOutgoingMessages = Math.max(
        1,
        getMaxOutgoingMessages((Array.isArray(walletFeatures) ? walletFeatures : []) as never[]) ?? 1,
    );
    const maxAssetMessages = Math.max(0, maxOutgoingMessages - 1);

    const depositAssets = useMemo<DepositAssetItem[]>(() => {
        const jettons: DepositAssetItem[] = (jettonsResponse?.jettons ?? [])
            .map((j) => {
                const balance = j.balance;
                const usdPrice = Number(j.prices?.find((p) => p.currency === 'USD')?.value ?? '0');
                const usdEquivalent = Number.isFinite(usdPrice) ? Number(balance) * usdPrice : 0;
                return {
                    id: `jetton:${j.address}`,
                    kind: 'jetton' as const,
                    address: j.address,
                    label: j.info.symbol ?? '???',
                    sublabel: j.info.name ?? 'Unknown',
                    imageUrl: j.info.image?.url,
                    decimals: j.decimalsNumber ?? 9,
                    balance,
                    usdEquivalent,
                };
            })
            .sort((a, b) => (b.usdEquivalent ?? 0) - (a.usdEquivalent ?? 0));

        const nfts: DepositAssetItem[] = (nftsResponse?.nfts ?? [])
            .filter(isAllowedNftTrust)
            .slice(0, 30)
            .map((nft) => ({
                id: `nft:${nft.address}`,
                kind: 'nft' as const,
                address: nft.address,
                label: nft.info?.name ?? 'NFT',
                sublabel: nft.collection?.name,
                imageUrl: nft.info?.image?.url,
            }));

        return [...jettons, ...nfts];
    }, [jettonsResponse?.jettons, nftsResponse?.nfts]);

    const maxDepositsAllowed = Math.min(depositAssets.length, maxAssetMessages);
    const canAddMoreAssets = assetDeposits.length < maxDepositsAllowed;
    const tonBalanceDisplay = ownerTonBalance ?? '0';
    const ownerTonBalanceNano = tryParseUiAmountToUnits(ownerTonBalance ?? '0', 9) ?? 0n;
    const initialTonDepositMaxNano = (() => {
        const reserveNano = DEPLOY_BASE_NANO + PER_ASSET_RESERVE_NANO * BigInt(assetDeposits.length);
        return ownerTonBalanceNano > reserveNano ? ownerTonBalanceNano - reserveNano : 0n;
    })();
    const initialTonDepositMaxString = formatUnitsTrimmed(initialTonDepositMaxNano, 9);

    useEffect(() => {
        if (isDeepLinkScalarsAppliedRef.current) {
            return;
        }

        if (deepLinkPayload.operatorPublicKey) {
            setOriginOperatorPublicKey(deepLinkPayload.operatorPublicKey);
        }
        if (deepLinkPayload.agentName) {
            setAgentName(deepLinkPayload.agentName);
        }
        if (deepLinkPayload.source) {
            setSource(deepLinkPayload.source);
        }
        if (deepLinkPayload.tonDeposit) {
            setTonDeposit(deepLinkPayload.tonDeposit);
        }

        isDeepLinkScalarsAppliedRef.current = true;
    }, [deepLinkPayload]);

    useEffect(() => {
        if (isDeepLinkAssetsAppliedRef.current) {
            return;
        }

        if (deepLinkPayload.assets.length === 0) {
            isDeepLinkAssetsAppliedRef.current = true;
            return;
        }

        if (depositAssets.length === 0) {
            return;
        }
        if (maxDepositsAllowed <= 0) {
            return;
        }

        const usedAssetIds = new Set<string>();
        const linkedDeposits: DepositAssetDraft[] = [];

        const findAsset = (assetInput: CreateDeepLinkAssetInput): DepositAssetItem | undefined => {
            const normalizedAddress = assetInput.address?.trim();
            if (normalizedAddress) {
                return depositAssets.find(
                    (asset) =>
                        asset.kind === assetInput.kind &&
                        isSameTonAddress(asset.address, normalizedAddress) &&
                        !usedAssetIds.has(asset.id),
                );
            }

            const normalizedSymbol = assetInput.symbol?.trim().toLowerCase();
            const normalizedLabel = assetInput.label?.trim().toLowerCase();
            if (!normalizedSymbol && !normalizedLabel) {
                return undefined;
            }

            return depositAssets.find((asset) => {
                if (asset.kind !== assetInput.kind || usedAssetIds.has(asset.id)) {
                    return false;
                }
                const bySymbol = normalizedSymbol ? asset.label.toLowerCase() === normalizedSymbol : false;
                const byLabel = normalizedLabel
                    ? asset.label.toLowerCase() === normalizedLabel || asset.sublabel?.toLowerCase() === normalizedLabel
                    : false;
                return bySymbol || byLabel;
            });
        };

        for (const [index, assetInput] of deepLinkPayload.assets.entries()) {
            const asset = findAsset(assetInput);
            if (!asset) {
                continue;
            }

            usedAssetIds.add(asset.id);
            linkedDeposits.push({
                id: `deeplink-${index}-${asset.id}`,
                assetId: asset.id,
                amount: asset.kind === 'jetton' ? (assetInput.amount ?? '').trim() : '',
            });
        }

        if (linkedDeposits.length > 0) {
            setAssetDeposits(linkedDeposits.slice(0, maxDepositsAllowed));
        }

        isDeepLinkAssetsAppliedRef.current = true;
    }, [deepLinkPayload.assets, depositAssets, maxDepositsAllowed]);

    const getAssetById = (assetId: string): DepositAssetItem | undefined => depositAssets.find((asset) => asset.id === assetId);
    const isSelectedInOtherDraft = (assetId: string, draftId: string): boolean =>
        assetDeposits.some((draft) => draft.id !== draftId && draft.assetId === assetId);
    const findNextUnselectedAssetId = (): string | null => {
        for (const asset of depositAssets) {
            if (!assetDeposits.some((draft) => draft.assetId === asset.id)) {
                return asset.id;
            }
        }
        return null;
    };

    const addAssetDeposit = () => {
        const nextAssetId = findNextUnselectedAssetId();
        if (!nextAssetId) return;
        setAssetDeposits((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, assetId: nextAssetId, amount: '' }]);
    };

    const updateAssetDeposit = (id: string, patch: Partial<DepositAssetDraft>) => {
        setAssetDeposits((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    const removeAssetDeposit = (id: string) => {
        setAssetDeposits((prev) => prev.filter((item) => item.id !== id));
        setOpenSelectorId((current) => (current === id ? null : current));
        setJettonsOpenById((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setNftsOpenById((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const handleCreate = async () => {
        try {
            setIsAwaitingIndexing(true);
            if (!network || !ownerAddress) {
                throw new Error('Connect wallet first');
            }
            if (!collectionAddress) {
                throw new Error('Collection address is not configured for current network');
            }

            const owner = Address.parse(ownerAddress);
            const collection = Address.parse(collectionAddress);
            const originKey = parseUint256PublicKey(originOperatorPublicKey);
            const name = agentName.trim();
            const sourceValue = source.trim();
            if (!name || name.length > 64) {
                throw new Error('agentName length must be 1..64');
            }

            const tonDepositValue = tonDeposit.trim() || '0';
            const tonDepositNano = parseUiAmountToUnits(tonDepositValue, 9, 'TON deposit');
            if (tonDepositNano < 0n) {
                throw new Error('TON deposit must be zero or positive');
            }
            if (tonDepositNano > initialTonDepositMaxNano) {
                throw new Error(`Maximum initial TON deposit is ${initialTonDepositMaxString}`);
            }

            const nftItemIndex = calculateWalletIndex(owner, originKey, true);

            const metadata = buildOnchainMetadataCell({
                name,
                description: sourceValue,
            });

            const runtimeData = {
                ownerAddress: owner,
                nftItemContent: metadata,
                originOperatorPublicKey: originKey,
                operatorPublicKey: originKey,
                deployedByUser: true,
            };

            const { stateInit, address: localAddress } = buildWalletStateInit(
                ENV_AGENTIC_WALLET_CODE_BOC,
                nftItemIndex,
                collection,
            );

            const client = appKit.networkManager.getClient(network);
            const expectedAddress = await getCollectionAddressByIndex(client, collection.toString(), nftItemIndex);
            if (!expectedAddress.equals(localAddress)) {
                throw new Error('Computed wallet address does not match collection.get_nft_address_by_index');
            }

            try {
                const existingState = await getAgentWalletState(client, localAddress.toString());
                if (existingState.isInitialized) {
                    throw new Error(
                        `Agent wallet with this operator public key already exists: ${localAddress.toString()}`,
                    );
                }
            } catch (error) {
                if (
                    !(error instanceof Error) ||
                    !error.message.startsWith('Account state data is empty for')
                ) {
                    throw error;
                }
            }

            const deployBody = createDeployWalletBody({
                queryId: createQueryId(),
                walletData: runtimeData,
                senderOriginOperatorPublicKey: 0n,
            });

            if (assetDeposits.length > maxAssetMessages) {
                throw new Error(`You can add up to ${maxAssetMessages} assets (1 message reserved for deploy + TON)`);
            }

            const assetMessages = [];
            for (const deposit of assetDeposits) {
                const asset = getAssetById(deposit.assetId);
                if (!asset) {
                    throw new Error('Selected asset is not available');
                }

                if (asset.kind === 'jetton') {
                    const amount = deposit.amount.trim();
                    const parsedAmount = parseUiAmountToUnits(amount, asset.decimals ?? 9, `${asset.label} amount`);
                    if (parsedAmount <= 0n) {
                        throw new Error(`Enter valid amount for ${asset.label}`);
                    }
                    const tx = await createTransferJettonTransaction(appKit, {
                        jettonAddress: asset.address,
                        recipientAddress: localAddress.toString(),
                        amount: formatUnitsTrimmed(parsedAmount, asset.decimals ?? 9),
                        jettonDecimals: asset.decimals ?? 9,
                        comment: `Create agent ${name}`,
                    });

                    if (!tx.messages[0]) {
                        throw new Error(`Failed to build jetton transfer message for ${asset.label}`);
                    }
                    assetMessages.push(tx.messages[0]);
                    continue;
                }

                const tx = await createTransferNftTransaction(appKit, {
                    nftAddress: asset.address,
                    recipientAddress: localAddress.toString(),
                    comment: `Create agent ${name}`,
                });
                if (!tx.messages[0]) {
                    throw new Error(`Failed to build NFT transfer message for ${asset.label}`);
                }
                assetMessages.push(tx.messages[0]);
            }

            const deployAmountNano = DEPLOY_BASE_NANO + tonDepositNano;

            await sendTransaction({
                network,
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: localAddress.toString(),
                        amount: deployAmountNano.toString(),
                        stateInit: cellToBase64(stateInit),
                        payload: cellToBase64(deployBody),
                    },
                    ...assetMessages,
                ],
            });

            let isIndexed = false;
            for (let attempt = 0; attempt < 30; attempt += 1) {
                let found = false;
                for (let page = 0; page < 5; page += 1) {
                    const ownerNfts = await client.nftItemsByOwner({
                        ownerAddress,
                        pagination: {
                            limit: 100,
                            offset: page * 100,
                        },
                    });

                    found = (ownerNfts.nfts ?? []).some((nft) => isSameTonAddress(nft.address, localAddress.toString()));
                    if (found || (ownerNfts.nfts ?? []).length < 100) {
                        break;
                    }
                }
                if (found) {
                    isIndexed = true;
                    break;
                }

                await delay(2000);
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['agentic-wallets-owner-nfts'] }),
                queryClient.invalidateQueries({ queryKey: ['agentic-wallets-chain-state'] }),
                queryClient.invalidateQueries({ queryKey: ['balance'] }),
                queryClient.invalidateQueries({ queryKey: ['jettons'] }),
                queryClient.invalidateQueries({ queryKey: ['nfts'] }),
            ]);

            if (isIndexed) {
                toast.success(`Deploy + first fund completed. Agent address: ${localAddress.toString()}`);
                navigate('/');
            } else {
                toast.message(`Transaction sent. Wallet ${localAddress.toString()} will appear after indexing.`);
                navigate(`/agent/${localAddress.toString()}`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create agent wallet';
            toast.error(message);
        } finally {
            setIsAwaitingIndexing(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <Link
                to="/"
                className="mb-6 inline-flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-white"
            >
                <ArrowLeft size={14} />
                Back to dashboard
            </Link>

            <div className="max-w-2xl rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h1 className="text-2xl font-bold tracking-tight">Create Agent Wallet</h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Deploy a wallet NFT and send first funding in one wallet confirmation flow.
                </p>

                <div className="mt-6 space-y-4">
                    <Field
                        label="Operator Public Key"
                        value={originOperatorPublicKey}
                        onChange={setOriginOperatorPublicKey}
                        placeholder="0x..."
                    />
                    <Field label="Agent name" value={agentName} onChange={setAgentName} placeholder="Research Agent" />
                    <Field label="Source" value={source} onChange={setSource} placeholder="telegram-bot" />
                    <div>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                            <label className="block text-xs text-neutral-500">Initial TON deposit</label>
                            <span className="text-xs text-neutral-500">Balance: {tonBalanceDisplay} TON</span>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={tonDeposit}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    if (next === '' || /^\d*\.?\d*$/.test(next)) {
                                        setTonDeposit(next);
                                    }
                                }}
                                placeholder="0.2"
                                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 pr-16 text-sm text-white placeholder-neutral-700 outline-none transition-colors focus:border-amber-500/50"
                            />
                            <button
                                type="button"
                                onClick={() => setTonDeposit(initialTonDepositMaxString)}
                                disabled={initialTonDepositMaxNano <= 0n}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/15 bg-white/[0.06] px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Max
                            </button>
                        </div>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs uppercase tracking-wider text-neutral-500">Other funding assets</p>
                            <p className="text-[11px] text-neutral-500">
                                {assetDeposits.length}/{maxDepositsAllowed} assets
                            </p>
                        </div>
                        <div className="space-y-3">
                            {assetDeposits.map((deposit) => {
                                const selected = getAssetById(deposit.assetId);
                                if (!selected) return null;
                                const selectorOpen = openSelectorId === deposit.id;
                                const jettonsOpen = jettonsOpenById[deposit.id] ?? false;
                                const nftsOpen = nftsOpenById[deposit.id] ?? false;
                                const availableJettons = depositAssets.filter(
                                    (asset) => asset.kind === 'jetton' && !isSelectedInOtherDraft(asset.id, deposit.id),
                                );
                                const availableNfts = depositAssets.filter(
                                    (asset) => asset.kind === 'nft' && !isSelectedInOtherDraft(asset.id, deposit.id),
                                );
                                const isFungible = selected.kind === 'jetton';
                                const maxDecimals = selected.decimals ?? 9;
                                return (
                                    <div key={deposit.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                        <div className="relative mb-3 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setOpenSelectorId((current) => (current === deposit.id ? null : deposit.id))}
                                                className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-left text-sm text-white outline-none transition-colors hover:border-white/[0.15] focus:border-amber-500/50"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <AssetIcon imageUrl={selected.imageUrl} label={selected.label} />
                                                    <span>{selected.label}</span>
                                                    {selected.sublabel && <span className="text-neutral-500">{selected.sublabel}</span>}
                                                </span>
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${selectorOpen ? 'rotate-180' : ''}`}>
                                                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeAssetDeposit(deposit.id)}
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                            {selectorOpen && (
                                                <div className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#111] shadow-xl">
                                                    <button
                                                        type="button"
                                                        onClick={() => setJettonsOpenById((prev) => ({ ...prev, [deposit.id]: !(prev[deposit.id] ?? false) }))}
                                                        className="flex w-full items-center justify-between px-4 py-2 text-left text-xs uppercase tracking-wide text-neutral-400 transition-colors hover:bg-white/[0.04]"
                                                    >
                                                        <span>Jettons</span>
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${jettonsOpen ? 'rotate-180' : ''}`}>
                                                            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                        </svg>
                                                    </button>
                                                    {jettonsOpen &&
                                                        availableJettons.map((asset) => (
                                                            <button
                                                                key={asset.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    updateAssetDeposit(deposit.id, { assetId: asset.id, amount: '' });
                                                                    setOpenSelectorId(null);
                                                                }}
                                                                className={`flex w-full items-center justify-between gap-2 px-6 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                                                                    deposit.assetId === asset.id ? 'text-amber-500' : 'text-white'
                                                                }`}
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    <AssetIcon imageUrl={asset.imageUrl} label={asset.label} />
                                                                    <span>{asset.label}</span>
                                                                    {asset.sublabel && <span className="text-neutral-500">{asset.sublabel}</span>}
                                                                </span>
                                                                <span className="font-mono text-xs text-neutral-400">{asset.balance ?? '0'}</span>
                                                            </button>
                                                        ))}
                                                    {jettonsOpen && availableJettons.length === 0 && (
                                                        <div className="px-6 py-2 text-xs text-neutral-500">No jettons found</div>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => setNftsOpenById((prev) => ({ ...prev, [deposit.id]: !(prev[deposit.id] ?? false) }))}
                                                        className="flex w-full items-center justify-between px-4 py-2 text-left text-xs uppercase tracking-wide text-neutral-400 transition-colors hover:bg-white/[0.04]"
                                                    >
                                                        <span>NFTs</span>
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${nftsOpen ? 'rotate-180' : ''}`}>
                                                            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                        </svg>
                                                    </button>
                                                    {nftsOpen &&
                                                        availableNfts.map((asset) => (
                                                            <button
                                                                key={asset.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    updateAssetDeposit(deposit.id, { assetId: asset.id, amount: '' });
                                                                    setOpenSelectorId(null);
                                                                }}
                                                                className={`flex w-full items-center gap-2 px-6 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                                                                    deposit.assetId === asset.id ? 'text-amber-500' : 'text-white'
                                                                }`}
                                                            >
                                                                <AssetIcon imageUrl={asset.imageUrl} label={asset.label} />
                                                                <span>{asset.label}</span>
                                                                {asset.sublabel && <span className="text-neutral-500">{asset.sublabel}</span>}
                                                            </button>
                                                        ))}
                                                    {nftsOpen && availableNfts.length === 0 && (
                                                        <div className="px-6 py-2 text-xs text-neutral-500">No NFTs found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {isFungible ? (
                                            <div>
                                                <div className="mb-1.5 flex items-center justify-between gap-3">
                                                    <label className="block text-xs text-neutral-500">Amount ({selected.label})</label>
                                                    <span className="text-xs text-neutral-500">Balance: {selected.balance ?? '0'} {selected.label}</span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={deposit.amount}
                                                        onChange={(e) => {
                                                            const next = e.target.value;
                                                            if (next === '') {
                                                                updateAssetDeposit(deposit.id, { amount: '' });
                                                                return;
                                                            }
                                                            if (!/^\d*\.?\d*$/.test(next)) return;
                                                            const [, fraction = ''] = next.split('.');
                                                            if (fraction.length > maxDecimals) return;
                                                            updateAssetDeposit(deposit.id, { amount: next });
                                                        }}
                                                        placeholder="0.00"
                                                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 pr-16 text-sm text-white placeholder-neutral-700 outline-none transition-colors focus:border-amber-500/50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateAssetDeposit(deposit.id, { amount: selected.balance ?? '0' })}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/15 bg-white/[0.06] px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-white/[0.12]"
                                                    >
                                                        Max
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-neutral-500">NFT transfer (1 item)</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {canAddMoreAssets && (
                            <button
                                type="button"
                                onClick={addAssetDeposit}
                                className="mt-3 w-full rounded-xl border border-white/[0.1] bg-white/[0.02] py-2.5 text-sm text-white transition-colors hover:bg-white/[0.05]"
                            >
                                Add asset
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => void handleCreate()}
                    disabled={isPending || isAwaitingIndexing || !ownerAddress}
                    className="mt-6 w-full rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPending ? 'Sending...' : isAwaitingIndexing ? 'Waiting for indexing...' : 'Deploy + First Fund'}
                </button>
            </div>
        </div>
    );
}

function AssetIcon({ imageUrl, label }: { imageUrl?: string; label: string }) {
    if (imageUrl) {
        return <img src={imageUrl} alt="" className="h-5 w-5 rounded-full object-cover" />;
    }
    return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold">
            {label.charAt(0)}
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    readOnly = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
    readOnly?: boolean;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-xs text-neutral-500">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                readOnly={readOnly}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-700 outline-none transition-colors focus:border-amber-500/50 read-only:text-neutral-500"
            />
        </div>
    );
}
