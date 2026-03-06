/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
    createTransferJettonTransaction,
    createTransferNftTransaction,
    createTransferTonTransaction,
    getTransactionStatus,
} from '@ton/appkit';
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
import { toNano } from '@ton/core';
import { useQueryClient } from '@tanstack/react-query';
import { getMaxOutgoingMessages } from '@ton/walletkit';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from './modal';

import type { AgentWallet } from '@/features/agents';
import { isAllowedNftTrust } from '@/features/agents/lib/nft-trust';
import { formatUnitsTrimmed, parseUiAmountToUnits, tryParseUiAmountToUnits } from '@/features/agents/lib/amount';

interface FundModalProps {
    agent: AgentWallet | null;
    onClose: () => void;
    onSuccess?: () => void | Promise<void>;
}

type AssetKind = 'ton' | 'jetton' | 'nft';

interface AssetItem {
    id: string;
    kind: AssetKind;
    address?: string;
    label: string;
    sublabel?: string;
    imageUrl?: string;
    decimals?: number;
    balance?: string;
    usdEquivalent?: number;
}

interface FundingItem {
    uid: string;
    assetId: string;
    amount: string;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const PER_NON_TON_RESERVE_NANO = toNano('0.06');

export function FundModal({ agent, onClose, onSuccess }: FundModalProps) {
    const appKit = useAppKit();
    const queryClient = useQueryClient();
    const [wallet] = useSelectedWallet();
    const { mutateAsync: sendTransaction, isPending: isSending } = useSendTransaction();
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
    const [fundingItems, setFundingItems] = useState<FundingItem[]>([]);
    const [openSelectorUid, setOpenSelectorUid] = useState<string | null>(null);
    const [jettonsOpenByUid, setJettonsOpenByUid] = useState<Record<string, boolean>>({});
    const [nftsOpenByUid, setNftsOpenByUid] = useState<Record<string, boolean>>({});
    const contentRef = useRef<HTMLDivElement>(null);
    const prevItemsCountRef = useRef(0);

    const network = useNetwork();
    const ownerAddress = useAddress();
    const { data: ownerTonBalance } = useBalanceByAddress({ address: ownerAddress ?? '', network });

    const {
        data: jettonsResponse,
        isLoading: jettonsLoading,
        isFetching: jettonsFetching,
    } = useJettonsByAddress({ address: ownerAddress, network });

    const { data: nftsResponse, isLoading: nftsLoading, isFetching: nftsFetching } = useNfts({ network });

    const assets = useMemo<AssetItem[]>(() => {
        const ton: AssetItem = { id: 'ton', kind: 'ton', label: 'TON', sublabel: 'Toncoin' };

        const jettons: AssetItem[] = (jettonsResponse?.jettons ?? [])
            .filter((j) => (tryParseUiAmountToUnits(j.balance, j.decimalsNumber ?? 9) ?? 0n) > 0n)
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

        const nfts: AssetItem[] = (nftsResponse?.nfts ?? [])
            .filter(isAllowedNftTrust)
            .filter((nft) => nft.address !== agent?.address)
            .slice(0, 30)
            .map((nft) => ({
                id: `nft:${nft.address}`,
                kind: 'nft',
                address: nft.address,
                label: nft.info?.name ?? 'NFT',
                sublabel: nft.collection?.name,
                imageUrl: nft.info?.image?.url,
            }));

        return [ton, ...jettons, ...nfts];
    }, [agent?.address, jettonsResponse?.jettons, nftsResponse?.nfts]);

    const createFundingItem = (assetId: string = 'ton'): FundingItem => ({
        uid: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        assetId,
        amount: '',
    });

    useEffect(() => {
        if (agent && fundingItems.length === 0) {
            setFundingItems([createFundingItem('ton')]);
        }
    }, [agent, fundingItems.length]);

    const handleClose = () => {
        setFundingItems([createFundingItem('ton')]);
        setOpenSelectorUid(null);
        setJettonsOpenByUid({});
        setNftsOpenByUid({});
        onClose();
    };
    const agentName = agent?.name ?? 'Agent';
    const agentAddress = agent?.address;

    const getAssetById = (id: string): AssetItem | undefined => assets.find((a) => a.id === id);
    const getAssetBalance = (asset: AssetItem): string => {
        if (asset.kind === 'ton') return ownerTonBalance ?? '0';
        if (asset.kind === 'jetton') return asset.balance ?? '0';
        return '0';
    };
    const ownerTonBalanceNano = tryParseUiAmountToUnits(ownerTonBalance ?? '0', 9) ?? 0n;
    const getAssetBalanceUnits = (asset: AssetItem): bigint => {
        if (asset.kind === 'ton') {
            return ownerTonBalanceNano;
        }
        if (asset.kind === 'jetton') {
            return tryParseUiAmountToUnits(asset.balance ?? '0', asset.decimals ?? 9) ?? 0n;
        }
        return 0n;
    };
    const formatBalance = (value: string): string => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return value;
        if (parsed === 0) return '0';
        if (parsed < 0.0001) return parsed.toFixed(8);
        if (parsed < 1) return parsed.toFixed(6);
        return parsed.toFixed(4);
    };
    const isAssetSelectedInOtherItem = (assetId: string, currentUid: string): boolean => {
        return fundingItems.some((item) => item.uid !== currentUid && item.assetId === assetId);
    };
    const findFirstUnselectedAssetId = (): string | null => {
        for (const asset of assets) {
            if (!fundingItems.some((item) => item.assetId === asset.id)) {
                return asset.id;
            }
        }
        return null;
    };
    const addFundingAsset = () => {
        const nextAssetId = findFirstUnselectedAssetId();
        if (!nextAssetId) return;
        setFundingItems((prev) => [...prev, createFundingItem(nextAssetId)]);
    };
    const updateFundingItem = (uid: string, patch: Partial<FundingItem>) => {
        setFundingItems((prev) => prev.map((item) => (item.uid === uid ? { ...item, ...patch } : item)));
    };
    const removeFundingItem = (uid: string) => {
        setFundingItems((prev) => prev.filter((item) => item.uid !== uid));
        setJettonsOpenByUid((prev) => {
            const next = { ...prev };
            delete next[uid];
            return next;
        });
        setNftsOpenByUid((prev) => {
            const next = { ...prev };
            delete next[uid];
            return next;
        });
        setOpenSelectorUid((current) => (current === uid ? null : current));
    };

    const walletFeatures = (
        wallet as unknown as { tonConnectWallet?: { device?: { features?: unknown[] } } } | null
    )?.tonConnectWallet?.device?.features;
    const maxOutgoingMessages = Math.max(
        1,
        getMaxOutgoingMessages((Array.isArray(walletFeatures) ? walletFeatures : []) as never[]) ?? 1,
    );
    const messageCount = fundingItems.length;
    const maxAssetsAllowed = Math.min(assets.length, maxOutgoingMessages);
    const canAddMoreAssets = fundingItems.length < maxAssetsAllowed;
    const nonTonAssetCount = fundingItems.filter((item) => {
        const asset = getAssetById(item.assetId);
        return asset != null && asset.kind !== 'ton';
    }).length;
    const maxTonForFundingNano = (() => {
        const reserveNano = PER_NON_TON_RESERVE_NANO * BigInt(nonTonAssetCount);
        return ownerTonBalanceNano > reserveNano ? ownerTonBalanceNano - reserveNano : 0n;
    })();
    const maxTonForFundingString = formatUnitsTrimmed(maxTonForFundingNano, 9);

    useEffect(() => {
        if (fundingItems.length > prevItemsCountRef.current && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
        prevItemsCountRef.current = fundingItems.length;
    }, [fundingItems.length]);

    const handleFund = async () => {
        try {
            setIsAwaitingConfirmation(true);
            if (!agentAddress) {
                throw new Error('Agent is not selected');
            }
            if (!network) {
                throw new Error('Network is not selected');
            }
            if (!fundingItems.length) {
                throw new Error('Add at least one asset');
            }

            const messages = [];
            for (const item of fundingItems) {
                const asset = getAssetById(item.assetId);
                if (!asset) {
                    throw new Error('Selected asset is no longer available');
                }

                if (asset.kind === 'ton') {
                    const normalized = item.amount.trim();
                    const amountNano = parseUiAmountToUnits(normalized, 9, 'TON amount');
                    if (amountNano <= 0n) {
                        throw new Error(`Enter valid TON amount`);
                    }
                    if (amountNano > maxTonForFundingNano) {
                        throw new Error(`Maximum TON for this funding is ${maxTonForFundingString}`);
                    }
                    const tx = createTransferTonTransaction(appKit, {
                        recipientAddress: agentAddress,
                        amount: formatUnitsTrimmed(amountNano, 9),
                        comment: `Fund ${agentName}`,
                    });
                    if (!tx.messages[0]) throw new Error('Failed to build TON transfer message');
                    messages.push(tx.messages[0]);
                    continue;
                }

                if (asset.kind === 'jetton') {
                    const normalized = item.amount.trim();
                    const decimals = asset.decimals ?? 9;
                    const amountUnits = parseUiAmountToUnits(normalized, decimals, `${asset.label} amount`);
                    if (amountUnits <= 0n) {
                        throw new Error(`Enter valid amount for ${asset.label}`);
                    }
                    if (!asset.address) {
                        throw new Error(`Jetton address is missing for ${asset.label}`);
                    }
                    const balanceUnits = getAssetBalanceUnits(asset);
                    if (amountUnits > balanceUnits) {
                        throw new Error(`Amount exceeds balance for ${asset.label}`);
                    }
                    const tx = await createTransferJettonTransaction(appKit, {
                        jettonAddress: asset.address,
                        recipientAddress: agentAddress,
                        amount: formatUnitsTrimmed(amountUnits, decimals),
                        jettonDecimals: decimals,
                        comment: `Fund ${agentName}`,
                    });
                    if (!tx.messages[0]) throw new Error(`Failed to build ${asset.label} transfer message`);
                    messages.push(tx.messages[0]);
                    continue;
                }

                if (asset.kind === 'nft') {
                    if (!asset.address) {
                        throw new Error(`NFT address is missing for ${asset.label}`);
                    }
                    const tx = await createTransferNftTransaction(appKit, {
                        nftAddress: asset.address,
                        recipientAddress: agentAddress,
                        comment: `Fund ${agentName}`,
                    });
                    if (!tx.messages[0]) throw new Error(`Failed to build NFT transfer message for ${asset.label}`);
                    messages.push(tx.messages[0]);
                }
            }

            const tx = await sendTransaction({
                network,
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages,
            });

            let confirmation: 'completed' | 'pending' | 'failed' = 'pending';
            for (let attempt = 0; attempt < 20; attempt += 1) {
                const status = await getTransactionStatus(appKit, { network, normalizedHash: tx.normalizedHash });
                if (status.status === 'completed') {
                    confirmation = 'completed';
                    break;
                }
                if (status.status === 'failed') {
                    confirmation = 'failed';
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 1500));
            }

            const refreshNow = async () => {
                await Promise.all([
                    onSuccess?.(),
                    queryClient.invalidateQueries({ queryKey: ['balance'] }),
                    queryClient.invalidateQueries({ queryKey: ['jettons'] }),
                    queryClient.invalidateQueries({ queryKey: ['nfts'] }),
                    queryClient.invalidateQueries({ queryKey: ['agentic-wallet-activity'] }),
                    queryClient.invalidateQueries({ queryKey: ['agentic-wallets-owner-nfts'] }),
                    queryClient.invalidateQueries({ queryKey: ['agentic-wallets-chain-state'] }),
                ]);
            };

            await refreshNow();
            void (async () => {
                for (let attempt = 0; attempt < 5; attempt += 1) {
                    await delay(2500);
                    await Promise.all([
                        queryClient.refetchQueries({ queryKey: ['balance'], type: 'active' }),
                        queryClient.refetchQueries({ queryKey: ['jettons'], type: 'active' }),
                        queryClient.refetchQueries({ queryKey: ['nfts'], type: 'active' }),
                        queryClient.refetchQueries({ queryKey: ['agentic-wallet-activity'], type: 'active' }),
                        queryClient.refetchQueries({ queryKey: ['agentic-wallets-owner-nfts'], type: 'active' }),
                        queryClient.refetchQueries({ queryKey: ['agentic-wallets-chain-state'], type: 'active' }),
                    ]);
                }
            })();

            if (confirmation === 'completed') {
                toast.success(`Funded ${messages.length} asset${messages.length > 1 ? 's' : ''} to ${agentName}`);
            } else if (confirmation === 'failed') {
                toast.message('Transaction was sent, but status check is ambiguous. Please verify in activity feed.');
            } else {
                toast.message('Transaction sent. Waiting for indexer update...');
            }
            handleClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fund';
            toast.error(message);
        } finally {
            setIsAwaitingConfirmation(false);
        }
    };

    const isPending = isSending || isAwaitingConfirmation;

    const canSubmit =
        fundingItems.length > 0 &&
        fundingItems.every((item) => {
            const asset = getAssetById(item.assetId);
            if (!asset) return false;
            if (asset.kind === 'nft') return !!asset.address;
            const decimals = asset.kind === 'ton' ? 9 : (asset.decimals ?? 9);
            const amount = tryParseUiAmountToUnits(item.amount, decimals);
            if (amount === null || amount <= 0n) {
                return false;
            }
            if (asset.kind === 'ton') {
                return amount <= maxTonForFundingNano;
            }
            return amount <= getAssetBalanceUnits(asset);
        });

    return (
        <Modal open={!!agent} onClose={handleClose} title={`Fund ${agentName}`}>
            <div ref={contentRef} className="max-h-[70vh] space-y-4 overflow-y-auto pr-0 sm:pr-1">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className="block text-xs text-neutral-500">Assets</label>
                    <span className="text-[11px] text-neutral-500">
                        {messageCount}/{maxAssetsAllowed} per tx
                    </span>
                </div>

                {fundingItems.length > 0 && (
                    <div className="space-y-3">
                        {fundingItems.map((item) => {
                            const asset = getAssetById(item.assetId);
                            if (!asset) return null;

                            const isFungible = asset.kind === 'ton' || asset.kind === 'jetton';
                            const balance = getAssetBalance(asset);
                            const maxAmountString = asset.kind === 'ton' ? maxTonForFundingString : balance;
                            const canUseMax = isFungible && getAssetBalanceUnits(asset) > 0n;
                            const maxInputDecimals = asset.kind === 'ton' ? 9 : asset.kind === 'jetton' ? (asset.decimals ?? 9) : 0;

                            const selectorOpen = openSelectorUid === item.uid;
                            const jettonsOpen = jettonsOpenByUid[item.uid] ?? false;
                            const nftsOpen = nftsOpenByUid[item.uid] ?? false;
                            const availableJettons = assets.filter(
                                (option) => option.kind === 'jetton' && !isAssetSelectedInOtherItem(option.id, item.uid),
                            );
                            const availableNfts = assets.filter(
                                (option) => option.kind === 'nft' && !isAssetSelectedInOtherItem(option.id, item.uid),
                            );
                            return (
                                <div key={item.uid} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                    <div className="relative mb-3 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setOpenSelectorUid((current) => (current === item.uid ? null : item.uid))}
                                            className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-left text-sm text-white outline-none transition-colors hover:border-white/[0.15] focus:border-amber-500/50"
                                        >
                                            <span className="flex min-w-0 items-center gap-2">
                                                <AssetIcon asset={asset} />
                                                <span className="truncate">{asset.label}</span>
                                                {asset.kind === 'jetton' && (
                                                    <span className="font-mono text-xs text-neutral-400 sm:hidden">
                                                        {formatBalance(asset.balance ?? '0')}
                                                    </span>
                                                )}
                                                {asset.sublabel && (
                                                    <span className="hidden truncate text-neutral-500 sm:inline">
                                                        {asset.sublabel}
                                                    </span>
                                                )}
                                            </span>
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 12 12"
                                                fill="none"
                                                className={`transition-transform ${selectorOpen ? 'rotate-180' : ''}`}
                                            >
                                                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeFundingItem(item.uid)}
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                                            aria-label="Remove asset"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                        {selectorOpen && (
                                            <div className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#111] shadow-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isAssetSelectedInOtherItem('ton', item.uid)) return;
                                                        updateFundingItem(item.uid, { assetId: 'ton', amount: '' });
                                                        setOpenSelectorUid(null);
                                                    }}
                                                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                                                        item.assetId === 'ton' ? 'text-amber-500' : 'text-white'
                                                    }`}
                                                    disabled={isAssetSelectedInOtherItem('ton', item.uid)}
                                                >
                                                    <AssetIcon asset={assets[0]} />
                                                    <span>TON</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setJettonsOpenByUid((prev) => ({ ...prev, [item.uid]: !(prev[item.uid] ?? false) }))
                                                    }
                                                    className="flex w-full items-center justify-between px-4 py-2 text-left text-xs uppercase tracking-wide text-neutral-400 transition-colors hover:bg-white/[0.04]"
                                                >
                                                    <span>Jettons</span>
                                                    <svg
                                                        width="12"
                                                        height="12"
                                                        viewBox="0 0 12 12"
                                                        fill="none"
                                                        className={`transition-transform ${jettonsOpen ? 'rotate-180' : ''}`}
                                                    >
                                                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                    </svg>
                                                </button>
                                                {jettonsOpen &&
                                                    availableJettons.map((option) => (
                                                            <button
                                                                key={option.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    updateFundingItem(item.uid, { assetId: option.id, amount: '' });
                                                                    setOpenSelectorUid(null);
                                                                }}
                                                                className={`flex w-full items-center justify-between gap-2 px-6 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                                                                    item.assetId === option.id ? 'text-amber-500' : 'text-white'
                                                                }`}
                                                            >
                                                                <span className="flex min-w-0 items-center gap-2">
                                                                    <AssetIcon asset={option} />
                                                                    <span className="truncate">{option.label}</span>
                                                                    {option.sublabel && (
                                                                        <span className="hidden truncate text-neutral-500 sm:inline">
                                                                            {option.sublabel}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <span className="font-mono text-xs text-neutral-400">
                                                                    {formatBalance(option.balance ?? '0')}
                                                                </span>
                                                            </button>
                                                        ))}
                                                {jettonsOpen && availableJettons.length === 0 && (
                                                    <div className="px-6 py-2 text-xs text-neutral-500">No jettons found</div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setNftsOpenByUid((prev) => ({ ...prev, [item.uid]: !(prev[item.uid] ?? false) }))
                                                    }
                                                    className="flex w-full items-center justify-between px-4 py-2 text-left text-xs uppercase tracking-wide text-neutral-400 transition-colors hover:bg-white/[0.04]"
                                                >
                                                    <span>NFTs</span>
                                                    <svg
                                                        width="12"
                                                        height="12"
                                                        viewBox="0 0 12 12"
                                                        fill="none"
                                                        className={`transition-transform ${nftsOpen ? 'rotate-180' : ''}`}
                                                    >
                                                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                    </svg>
                                                </button>
                                                {nftsOpen &&
                                                    availableNfts.map((option) => (
                                                            <button
                                                                key={option.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    updateFundingItem(item.uid, { assetId: option.id, amount: '' });
                                                                    setOpenSelectorUid(null);
                                                                }}
                                                                className={`flex w-full items-center gap-2 px-6 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                                                                    item.assetId === option.id ? 'text-amber-500' : 'text-white'
                                                                }`}
                                                            >
                                                                <AssetIcon asset={option} />
                                                                <span className="truncate">{option.label}</span>
                                                                {option.sublabel && (
                                                                    <span className="hidden truncate text-neutral-500 sm:inline">
                                                                        {option.sublabel}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))}
                                                {nftsOpen && availableNfts.length === 0 && (
                                                    <div className="px-6 py-2 text-xs text-neutral-500">No NFTs found</div>
                                                )}
                                                {(jettonsLoading || jettonsFetching || nftsLoading || nftsFetching) && assets.length <= 1 && (
                                                    <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-neutral-500">
                                                        <div className="h-3 w-3 animate-spin rounded-full border border-white/10 border-t-amber-500" />
                                                        Loading assets...
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {isFungible ? (
                                        <>
                                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                                <label className="block text-xs text-neutral-500">Amount ({asset.label})</label>
                                                <span className="text-xs text-neutral-500">
                                                    Balance: {formatBalance(balance)} {asset.label}
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={item.amount}
                                                    onChange={(e) => {
                                                        const next = e.target.value;
                                                        if (next === '') {
                                                            updateFundingItem(item.uid, { amount: '' });
                                                            return;
                                                        }
                                                        if (!/^\d*\.?\d*$/.test(next)) return;
                                                        const [, fraction = ''] = next.split('.');
                                                        if (fraction.length > maxInputDecimals) return;
                                                        updateFundingItem(item.uid, { amount: next });
                                                    }}
                                                    placeholder="0.00"
                                                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 pr-16 font-mono text-base text-white placeholder-neutral-700 outline-none transition-colors focus:border-amber-500/50"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => updateFundingItem(item.uid, { amount: maxAmountString })}
                                                    disabled={!canUseMax}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/15 bg-white/[0.06] px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    Max
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-xs text-neutral-500">NFT transfer (1 item)</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {canAddMoreAssets && (
                    <button
                        type="button"
                        onClick={addFundingAsset}
                        className="w-full rounded-xl border border-white/[0.1] bg-white/[0.02] py-2.5 text-sm text-white transition-colors hover:bg-white/[0.05]"
                    >
                        Add asset
                    </button>
                )}

                <div className="flex items-start gap-2 rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-3 py-2.5">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                    <p className="text-xs leading-relaxed text-amber-500/80">
                        The agent can spend all transferred assets. Fund only what you&apos;re comfortable with.
                    </p>
                </div>

                <button
                    onClick={() => void handleFund()}
                    disabled={isPending || !canSubmit}
                    className="w-full rounded-full bg-amber-500 py-3 text-sm font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isPending ? (
                        <span className="inline-flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                            Sending...
                        </span>
                    ) : (
                        `Fund ${messageCount} asset${messageCount === 1 ? '' : 's'}`
                    )}
                </button>
            </div>
        </Modal>
    );
}

function AssetIcon({ asset }: { asset: AssetItem }) {
    if (asset.kind === 'ton') {
        return (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0098EA]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </div>
        );
    }

    if (asset.imageUrl) {
        return <img src={asset.imageUrl} alt="" className="h-5 w-5 rounded-full object-cover" />;
    }

    return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold">
            {asset.label.charAt(0)}
        </div>
    );
}
