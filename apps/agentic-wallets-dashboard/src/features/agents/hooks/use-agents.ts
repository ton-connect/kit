/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAddress, useAppKit, useNetwork } from '@ton/appkit-react';
import type { NFT } from '@ton/appkit';

import { ENV_AGENTIC_ACTIVITY_POLL_MS, ENV_AGENTIC_COLLECTION_MAINNET, ENV_AGENTIC_COLLECTION_TESTNET } from '@/core/configs/env';

import { useAgentsStore } from '../store/agents-store';
import type { AgentWallet } from '../types';
import { extractNameFromMetadata } from '../lib/metadata';
import { getAgentWalletState } from '../lib/agentic-wallet';
import { isSameTonAddress } from '../lib/address';
import { mapWithConcurrency } from '../lib/async';

function getCollectionAddressForNetwork(chainId: string | undefined): string {
    if (chainId === '-239') {
        return ENV_AGENTIC_COLLECTION_MAINNET;
    }
    if (chainId === '-3') {
        return ENV_AGENTIC_COLLECTION_TESTNET;
    }
    return '';
}

function getAttribute(nft: NFT, traitType: string): string | undefined {
    return nft.attributes?.find((a) => a.traitType === traitType || (a as { trait_type?: string }).trait_type === traitType)
        ?.value;
}

function parseBigint(value: string | undefined): bigint | null {
    if (!value) {
        return null;
    }
    try {
        return value.startsWith('0x') || value.startsWith('0X') ? BigInt(value) : BigInt(value);
    } catch {
        return null;
    }
}

const CHAIN_STATE_CONCURRENCY = 8;

export function useAgents() {
    const appKit = useAppKit();
    const queryClient = useQueryClient();
    const network = useNetwork();
    const ownerAddress = useAddress();
    const chainId = network?.chainId;
    const collectionAddress = getCollectionAddressForNetwork(chainId);

    const {
        data: nftsResponse,
        isLoading: isNftsLoading,
        error: nftsError,
        refetch: refetchNfts,
    } = useQuery({
        queryKey: ['agentic-wallets-owner-nfts', chainId, ownerAddress],
        enabled: !!network && !!ownerAddress,
        refetchInterval: ENV_AGENTIC_ACTIVITY_POLL_MS,
        refetchIntervalInBackground: true,
        queryFn: async () => {
            if (!network || !ownerAddress) {
                return { nfts: [] as NFT[] };
            }

            const client = appKit.networkManager.getClient(network);
            const pageLimit = 100;
            const maxPages = 50;
            const allNfts: NFT[] = [];

            for (let page = 0; page < maxPages; page += 1) {
                const response = await client.nftItemsByOwner({
                    ownerAddress,
                    pagination: {
                        limit: pageLimit,
                        offset: page * pageLimit,
                    },
                });
                const nfts = response.nfts ?? [];
                allNfts.push(...nfts);

                if (nfts.length < pageLimit) {
                    break;
                }
            }

            const deduped = Array.from(new Map(allNfts.map((nft) => [nft.address, nft])).values());
            return {
                nfts: deduped,
            };
        },
    });

    const knownAgentIds = useAgentsStore((s) => s.knownAgentIds);
    const markKnown = useAgentsStore((s) => s.markKnown);
    const markManyKnown = useAgentsStore((s) => s.markManyKnown);

    const chainStateCandidates = useMemo(() => {
        if (!collectionAddress) {
            return [];
        }

        const all = nftsResponse?.nfts ?? [];
        return all.filter((nft) => isSameTonAddress(nft.collection?.address, collectionAddress));
    }, [nftsResponse, collectionAddress]);

    const chainWalletAddresses = useMemo(
        () => Array.from(new Set(chainStateCandidates.map((nft) => nft.address))).sort(),
        [chainStateCandidates],
    );

    type ChainStateEntry = {
        publicKey: bigint;
        originPublicKey: bigint;
        nftItemContent: AgentWallet['nftItemContent'];
        ownerAddress: string;
        collectionAddress: string;
    };

    const chainStateQueryKey = ['agentic-wallets-chain-state', chainId, chainWalletAddresses] as const;

    const {
        data: chainState,
        isLoading: isChainLoading,
        error: chainError,
        refetch: refetchChain,
    } = useQuery({
        queryKey: chainStateQueryKey,
        enabled: !!network && chainWalletAddresses.length > 0,
        staleTime: 30_000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        queryFn: async () => {
            if (!network) {
                return {} as Record<string, ChainStateEntry>;
            }

            const client = appKit.networkManager.getClient(network);
            const previousState = queryClient.getQueryData<Record<string, ChainStateEntry>>(chainStateQueryKey) ?? {};
            const nftByAddress = new Map(chainStateCandidates.map((nft) => [nft.address, nft] as const));

            const entries = await mapWithConcurrency(
                chainWalletAddresses,
                CHAIN_STATE_CONCURRENCY,
                async (walletAddress) => {
                    const nft = nftByAddress.get(walletAddress);
                    try {
                        const state = await getAgentWalletState(client, walletAddress);
                        if (!state.isInitialized) {
                            return null;
                        }

                        return [
                            walletAddress,
                            {
                                publicKey: state.operatorPublicKey,
                                originPublicKey: state.originOperatorPublicKey,
                                nftItemContent: state.nftItemContent,
                                ownerAddress: state.ownerAddress?.toString() ?? nft?.ownerAddress ?? '',
                                collectionAddress: state.collectionAddress.toString(),
                            },
                        ] as const;
                    } catch {
                        const prev = previousState[walletAddress];
                        return prev ? ([walletAddress, prev] as const) : null;
                    }
                },
            );

            return Object.fromEntries(entries.filter((entry): entry is readonly [string, ChainStateEntry] => entry !== null));
        },
    });

    const collectionNfts = useMemo(() => {
        const all = nftsResponse?.nfts ?? [];
        if (!collectionAddress) {
            return [] as NFT[];
        }

        return all.filter((nft) => {
            if (isSameTonAddress(nft.collection?.address, collectionAddress)) {
                return true;
            }
            return isSameTonAddress(chainState?.[nft.address]?.collectionAddress, collectionAddress);
        });
    }, [nftsResponse, collectionAddress, chainState]);

    useEffect(() => {
        if (knownAgentIds.length > 0) {
            return;
        }

        const initialIds = collectionNfts.map((nft) => nft.address);
        if (initialIds.length === 0) {
            return;
        }

        // Build initial baseline silently: no "new" notifications for the first discovered set.
        markManyKnown(initialIds);
    }, [knownAgentIds.length, collectionNfts, markManyKnown]);

    const agents = useMemo(() => {
        const hasKnownBaseline = knownAgentIds.length > 0;

        return collectionNfts.map((nft): AgentWallet => {
            const chain = chainState?.[nft.address];
            const onchainName = chain ? extractNameFromMetadata(chain.nftItemContent) : null;
            const fallbackName = nft.info?.name ?? `Agent #${nft.index ?? '?'}`;

            const source = getAttribute(nft, 'source') ?? nft.info?.description ?? nft.collection?.name ?? 'Unknown';
            const createdAt = getAttribute(nft, 'created_at') ?? new Date().toISOString();
            const isNew = hasKnownBaseline && !knownAgentIds.includes(nft.address);

            const fallbackPublicKey = parseBigint(getAttribute(nft, 'operator_pubkey')) ?? 0n;
            const fallbackOriginPublicKey =
                parseBigint(getAttribute(nft, 'origin_operator_public_key')) ?? fallbackPublicKey;

            const publicKey = chain?.publicKey ?? fallbackPublicKey;
            const originPublicKey = chain?.originPublicKey ?? fallbackOriginPublicKey;
            const status: AgentWallet['status'] = chain ? (chain.publicKey === 0n ? 'revoked' : 'active') : 'active';

            return {
                id: nft.address,
                name: onchainName ?? fallbackName,
                address: nft.address,
                operatorPubkey: `0x${publicKey.toString(16)}`,
                originOperatorPublicKey: `0x${originPublicKey.toString(16)}`,
                ownerAddress: chain?.ownerAddress ?? nft.ownerAddress ?? '',
                createdAt,
                detectedAt: getAttribute(nft, 'detected_at') ?? createdAt,
                isNew,
                status,
                source,
                collectionAddress: nft.collection?.address,
                nftItemContent: chain?.nftItemContent ?? null,
            };
        });
    }, [collectionNfts, chainState, knownAgentIds]);

    const activeAgents = useMemo(() => agents.filter((a) => a.status === 'active'), [agents]);
    const revokedAgents = useMemo(() => agents.filter((a) => a.status === 'revoked'), [agents]);
    const newAgents = useMemo(() => agents.filter((a) => a.isNew), [agents]);

    const refresh = async () => {
        await Promise.all([
            refetchNfts(),
            refetchChain(),
            queryClient.invalidateQueries({ queryKey: ['balance'] }),
            queryClient.invalidateQueries({ queryKey: ['jettons'] }),
            queryClient.invalidateQueries({ queryKey: ['nfts'] }),
            queryClient.invalidateQueries({ queryKey: ['agentic-wallet-activity'] }),
        ]);
    };

    return {
        agents,
        activeAgents,
        revokedAgents,
        newAgents,
        isLoading: isNftsLoading || isChainLoading,
        error: nftsError ?? chainError,
        refresh,
        collectionAddress: collectionAddress || null,
        markAgentKnown: markKnown,
        markAgentsKnown: markManyKnown,
    };
}
