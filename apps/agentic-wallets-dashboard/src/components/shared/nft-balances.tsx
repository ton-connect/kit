/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/appkit-react';
import { useNftsByAddress, useNetwork } from '@ton/appkit-react';

import { isAllowedNftTrust } from '@/features/agents/lib/nft-trust';

interface NftBalancesProps {
    address: string;
    compact?: boolean;
    network?: Network;
}

export function NftBalances({ address, compact = false, network }: NftBalancesProps) {
    const connectedNetwork = useNetwork();
    const effectiveNetwork = network ?? connectedNetwork;
    const { data: nftsResponse } = useNftsByAddress({ address, network: effectiveNetwork, limit: 30 });
    const nfts = (nftsResponse?.nfts ?? []).filter(isAllowedNftTrust);

    if (nfts.length === 0) return null;

    if (compact) {
        return (
            <div className="flex flex-wrap gap-1.5">
                {nfts.slice(0, 4).map((nft) => (
                    <span
                        key={nft.address}
                        className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-neutral-500"
                    >
                        {nft.info?.image?.url ? (
                            <img src={nft.info.image.url} alt="" className="h-3 w-3 rounded-sm object-cover" />
                        ) : (
                            <span className="inline-flex h-3 w-3 items-center justify-center rounded-sm bg-white/[0.06] text-[8px]">
                                N
                            </span>
                        )}
                        <span className="max-w-[90px] truncate">{nft.info?.name ?? 'NFT'}</span>
                    </span>
                ))}
                {nfts.length > 4 && <span className="text-[10px] text-neutral-600">+{nfts.length - 4}</span>}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {nfts.map((nft) => (
                <div
                    key={nft.address}
                    className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2.5"
                >
                    <div className="flex items-center gap-2.5">
                        {nft.info?.image?.url ? (
                            <img src={nft.info.image.url} alt="" className="h-7 w-7 rounded-md object-cover" />
                        ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] text-[10px] font-medium text-neutral-500">
                                NFT
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium">{nft.info?.name ?? 'NFT'}</p>
                            <p className="text-[10px] text-neutral-600">{nft.collection?.name ?? 'Unknown collection'}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
