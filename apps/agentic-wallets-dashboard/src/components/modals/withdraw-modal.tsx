/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useBalanceByAddress, useJettonsByAddress, useNetwork, useNftsByAddress } from '@ton/appkit-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Modal } from './modal';

import type { AgentWallet } from '@/features/agents';
import { ENV_TON_API_KEY_MAINNET, ENV_TON_API_KEY_TESTNET } from '@/core/configs/env';
import { useAgentOperations } from '@/features/agents';
import { isAllowedNftTrust } from '@/features/agents/lib/nft-trust';

interface WithdrawModalProps {
    agent: AgentWallet | null;
    onClose: () => void;
    onSuccess?: () => void | Promise<void>;
}

export function WithdrawModal({ agent, onClose, onSuccess }: WithdrawModalProps) {
    const network = useNetwork();
    const { withdrawAllFromAgentWallet, isPending } = useAgentOperations();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: balance } = useBalanceByAddress({ address: agent?.address ?? '', network });
    const { data: jettonsResponse } = useJettonsByAddress({ address: agent?.address ?? '', network });
    const { data: nftsResponse } = useNftsByAddress({ address: agent?.address ?? '', network, limit: 30 });
    const jettons = jettonsResponse?.jettons ?? [];
    const nfts = (nftsResponse?.nfts ?? []).filter(isAllowedNftTrust);
    const [includeTon, setIncludeTon] = useState(true);
    const [selectedJettons, setSelectedJettons] = useState<Record<string, boolean>>({});
    const [selectedNfts, setSelectedNfts] = useState<Record<string, boolean>>({});
    const [jettonsOpen, setJettonsOpen] = useState(true);
    const [nftsOpen, setNftsOpen] = useState(true);
    const [tonUsdPrice, setTonUsdPrice] = useState(0);
    const [jettonsFade, setJettonsFade] = useState({ top: false, bottom: false });
    const [nftsFade, setNftsFade] = useState({ top: false, bottom: false });
    const jettonsListRef = useRef<HTMLDivElement | null>(null);
    const nftsListRef = useRef<HTMLDivElement | null>(null);

    const toNumber = (value: string | undefined): number => {
        if (!value) return 0;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const balanceValue = toNumber(balance);
    const balanceStr = balanceValue.toFixed(2);

    const selectedCardClass = (isSelected: boolean): string =>
        isSelected ? 'border-amber-500/50 bg-amber-500/[0.08]' : 'border-white/[0.06] bg-white/[0.02]';

    const getJettonUsdPrice = (jetton: (typeof jettons)[number]): number => {
        const usdPrice = jetton.prices.find((price) => price.currency.toUpperCase() === 'USD');
        return toNumber(usdPrice?.value);
    };

    const getJettonUsdValue = (jetton: (typeof jettons)[number]): number => {
        return toNumber(jetton.balance) * getJettonUsdPrice(jetton);
    };

    const formatTokenAmount = (value: string): string => {
        return toNumber(value).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
        });
    };

    const formatUsd = (value: number): string => {
        return `~$${value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const updateFadeState = useCallback(
        (element: HTMLDivElement | null, setState: (value: { top: boolean; bottom: boolean }) => void) => {
            if (!element) {
                setState({ top: false, bottom: false });
                return;
            }

            const hasOverflow = element.scrollHeight > element.clientHeight + 1;
            if (!hasOverflow) {
                setState({ top: false, bottom: false });
                return;
            }

            const top = element.scrollTop > 1;
            const bottom = element.scrollTop + element.clientHeight < element.scrollHeight - 1;
            setState({ top, bottom });
        },
        [],
    );

    const sortedJettons = useMemo(() => {
        return [...jettons].sort((left, right) => getJettonUsdValue(right) - getJettonUsdValue(left));
    }, [jettons]);

    const jettonIdsKey = sortedJettons.map((j) => j.address).join('|');
    const nftIdsKey = nfts.map((n) => n.address).join('|');

    useEffect(() => {
        if (!agent) return;
        setIncludeTon(true);
        setSelectedJettons(Object.fromEntries(sortedJettons.map((jetton) => [jetton.address, true])));
        setSelectedNfts(Object.fromEntries(nfts.map((nft) => [nft.address, true])));
    }, [agent?.id, jettonIdsKey, nftIdsKey]);

    useEffect(() => {
        if (!agent) return;

        let cancelled = false;
        const isTestnet = String(network?.chainId) === '-3';
        const apiKey = isTestnet ? ENV_TON_API_KEY_TESTNET : ENV_TON_API_KEY_MAINNET;

        const loadTonUsd = async () => {
            try {
                const response = await fetch('https://tonapi.io/v2/rates?tokens=ton&currencies=usd', {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch TON price (status ${response.status})`);
                }

                const data = (await response.json()) as {
                    rates?: {
                        TON?: {
                            prices?: {
                                USD?: number | string;
                            };
                        };
                    };
                };
                const rawPrice = data.rates?.TON?.prices?.USD;
                const nextPrice = typeof rawPrice === 'number' ? rawPrice : toNumber(rawPrice);
                if (!cancelled) {
                    setTonUsdPrice(Number.isFinite(nextPrice) ? nextPrice : 0);
                }
            } catch {
                if (!cancelled) {
                    setTonUsdPrice(0);
                }
            }
        };

        void loadTonUsd();

        return () => {
            cancelled = true;
        };
    }, [agent?.id, network?.chainId]);

    useEffect(() => {
        updateFadeState(jettonsListRef.current, setJettonsFade);
    }, [jettonsOpen, jettons.length, updateFadeState]);

    useEffect(() => {
        updateFadeState(nftsListRef.current, setNftsFade);
    }, [nftsOpen, nfts.length, updateFadeState]);

    const selectedJettonItems = useMemo(() => {
        return jettons.filter((jetton) => selectedJettons[jetton.address]);
    }, [jettons, selectedJettons]);

    const selectedNftItems = useMemo(() => {
        return nfts.filter((nft) => selectedNfts[nft.address]);
    }, [nfts, selectedNfts]);

    const totalUsd = useMemo(() => {
        const jettonsUsd = selectedJettonItems.reduce((sum, jetton) => {
            const jettonBalance = toNumber(jetton.balance);
            const priceUsd = getJettonUsdPrice(jetton);
            return sum + jettonBalance * priceUsd;
        }, 0);

        const tonUsd = includeTon ? balanceValue * tonUsdPrice : 0;
        return jettonsUsd + tonUsd;
    }, [balanceValue, includeTon, selectedJettonItems, tonUsdPrice]);

    const hasSelection = includeTon || selectedJettonItems.length > 0 || selectedNftItems.length > 0;
    const uiPending = isPending || isSubmitting;

    const handleWithdraw = async () => {
        if (!agent) return;

        try {
            setIsSubmitting(true);
            await withdrawAllFromAgentWallet(agent, {
                includeTon,
                jettons: selectedJettonItems.map((jetton) => ({
                    walletAddress: jetton.walletAddress,
                    amount: jetton.balance,
                    decimals: jetton.decimalsNumber ?? 9,
                })),
                nfts: selectedNftItems.map((nft) => ({
                    address: nft.address,
                })),
            });
            await onSuccess?.();
            toast.success(`Withdraw request sent for ${agent.name}`);
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to withdraw funds';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!agent) return null;

    return (
        <Modal open={!!agent} onClose={onClose} title={`Withdraw from ${agent.name}`}>
            <div className="flex max-h-[75vh] flex-col">
                <div className="relative min-h-0 flex-1">
                    <div className="app-scrollbar h-full space-y-4 overflow-y-auto pb-3 pr-2">
                        <button
                            type="button"
                            onClick={() => setIncludeTon((current) => !current)}
                            className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${selectedCardClass(includeTon)}`}
                        >
                            <div>
                                <p className="text-xs text-neutral-500">TON</p>
                                <p className="mt-1 font-mono text-2xl font-semibold">{balanceStr} TON</p>
                                <p className="mt-1 text-xs text-neutral-400">
                                    {tonUsdPrice > 0 ? formatUsd(balanceValue * tonUsdPrice) : '~$—'}
                                </p>
                            </div>
                        </button>

                        {jettons.length > 0 && (
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setJettonsOpen((value) => !value)}
                                    className="flex w-full items-center justify-between py-1 text-left text-xs uppercase tracking-wide text-neutral-400 transition-colors hover:text-neutral-300"
                                >
                                    <span>Jetton Balances</span>
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        className={`transition-transform ${jettonsOpen ? 'rotate-180' : ''}`}
                                    >
                                        <path
                                            d="M3 4.5L6 7.5L9 4.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                                {jettonsOpen && (
                                    <div className="relative max-h-60">
                                        <div
                                            ref={jettonsListRef}
                                            onScroll={(event) => updateFadeState(event.currentTarget, setJettonsFade)}
                                            className="app-scrollbar max-h-60 space-y-2 overflow-y-auto pb-1 pr-2"
                                        >
                                            {sortedJettons.map((j) => (
                                                <button
                                                    type="button"
                                                    key={j.address}
                                                    onClick={() =>
                                                        setSelectedJettons((current) => ({
                                                            ...current,
                                                            [j.address]: !current[j.address],
                                                        }))
                                                    }
                                                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-colors ${selectedCardClass(Boolean(selectedJettons[j.address]))}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {j.info.image?.url ? (
                                                            <img
                                                                src={j.info.image.url}
                                                                alt=""
                                                                className="h-5 w-5 rounded-full"
                                                            />
                                                        ) : (
                                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.06] text-[8px] font-medium text-neutral-500">
                                                                {(j.info.symbol ?? '?').slice(0, 2)}
                                                            </div>
                                                        )}
                                                        <span className="text-sm">{j.info.symbol ?? 'Unknown'}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-mono text-sm tabular-nums text-neutral-300">
                                                            {formatTokenAmount(j.balance)} {j.info.symbol ?? ''}
                                                        </div>
                                                        <div className="text-xs text-neutral-500">
                                                            {getJettonUsdPrice(j) > 0
                                                                ? formatUsd(toNumber(j.balance) * getJettonUsdPrice(j))
                                                                : '~$—'}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        {jettonsFade.top && (
                                            <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
                                        )}
                                        {jettonsFade.bottom && (
                                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {nfts.length > 0 && (
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setNftsOpen((value) => !value)}
                                    className="flex w-full items-center justify-between py-1 text-left text-xs uppercase tracking-wide text-neutral-400 transition-colors hover:text-neutral-300"
                                >
                                    <span>NFT Assets</span>
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        className={`transition-transform ${nftsOpen ? 'rotate-180' : ''}`}
                                    >
                                        <path
                                            d="M3 4.5L6 7.5L9 4.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                                {nftsOpen && (
                                    <div className="relative max-h-60">
                                        <div
                                            ref={nftsListRef}
                                            onScroll={(event) => updateFadeState(event.currentTarget, setNftsFade)}
                                            className="app-scrollbar max-h-60 space-y-2 overflow-y-auto pb-1 pr-2"
                                        >
                                            {nfts.map((nft) => (
                                                <button
                                                    type="button"
                                                    key={nft.address}
                                                    onClick={() =>
                                                        setSelectedNfts((current) => ({
                                                            ...current,
                                                            [nft.address]: !current[nft.address],
                                                        }))
                                                    }
                                                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-colors ${selectedCardClass(Boolean(selectedNfts[nft.address]))}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {nft.info?.image?.url ? (
                                                            <img
                                                                src={nft.info.image.url}
                                                                alt=""
                                                                className="h-5 w-5 rounded-sm object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-white/[0.06] text-[8px] font-medium text-neutral-500">
                                                                N
                                                            </div>
                                                        )}
                                                        <span className="text-sm">{nft.info?.name ?? 'NFT'}</span>
                                                    </div>
                                                    <span className="text-xs text-neutral-500">
                                                        {nft.collection?.name ?? 'Unknown collection'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        {nftsFade.top && (
                                            <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
                                        )}
                                        {nftsFade.bottom && (
                                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-xs leading-relaxed text-neutral-500">
                            Choose what to withdraw from this agent wallet. If TON is not selected, only chosen
                            jettons/NFTs will be transferred.
                        </p>
                    </div>
                </div>

                <div className="mt-3 border-t border-white/[0.08] bg-[#0a0a0a] pt-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-neutral-300">
                            Total: <span className="font-mono">{formatUsd(totalUsd)}</span>
                        </p>
                        <button
                            onClick={() => void handleWithdraw()}
                            disabled={uiPending || !hasSelection}
                            className="rounded-full border border-white/[0.1] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {uiPending ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    Sending...
                                </span>
                            ) : (
                                'Withdraw'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
