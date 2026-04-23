/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo, useEffect, useState } from 'react';
import { Address } from '@ton/core';
import type { JettonInfo, TransactionTraceMoneyFlowItem } from '@ton/walletkit';
import { getChainNetwork, useWalletKit, useWalletStore } from '@demo/wallet-core';
import type { NetworkType } from '@demo/wallet-core';

import { formatUnits } from '../utils/units';

export function useActiveWalletNetwork(): NetworkType {
    const savedWallets = useWalletStore((state) => state.walletManagement.savedWallets);
    const activeWalletId = useWalletStore((state) => state.walletManagement.activeWalletId);
    const activeWallet = savedWallets.find((w) => w.id === activeWalletId);
    return activeWallet?.network || 'testnet';
}

function useJettonInfo(jettonAddress: Address | string | null) {
    const walletKit = useWalletKit();
    const network = useActiveWalletNetwork();
    const [jettonInfo, setJettonInfo] = useState<JettonInfo | null>(null);
    const chainNetwork = getChainNetwork(network);

    useEffect(() => {
        if (!jettonAddress) {
            setJettonInfo(null);
            return;
        }
        async function updateJettonInfo() {
            if (!jettonAddress) {
                return;
            }
            const info = await walletKit?.jettons?.getJettonInfo(jettonAddress.toString(), chainNetwork);
            setJettonInfo(info ?? null);
        }
        updateJettonInfo();
    }, [jettonAddress, walletKit, chainNetwork]);
    return jettonInfo;
}

function safeParseAddress(address: string) {
    try {
        return Address.parse(address).toString();
    } catch {
        return null;
    }
}

function resolveJettonAddress(jettonAddress: Address | string | undefined) {
    if (!jettonAddress) return null;
    if (typeof jettonAddress === 'string' && jettonAddress !== 'TON') {
        return safeParseAddress(jettonAddress);
    }
    return jettonAddress;
}

export const JettonNameDisplay = memo(function JettonNameDisplay({
    jettonAddress,
}: {
    jettonAddress: Address | string | undefined;
}) {
    const jettonInfo = useJettonInfo(resolveJettonAddress(jettonAddress));
    const name = jettonInfo?.name;
    return <div>{name ?? jettonAddress?.toString() ?? 'UNKNOWN'}</div>;
});

export const JettonAmountDisplay = memo(function JettonAmountDisplay({
    amount,
    jettonAddress,
}: {
    amount: bigint;
    jettonAddress: Address | string | undefined;
}) {
    const jettonInfo = useJettonInfo(resolveJettonAddress(jettonAddress));
    return (
        <div>
            {formatUnits(amount, jettonInfo?.decimals ?? 9)} {jettonInfo?.symbol ?? 'UNKWN'}
        </div>
    );
});

export const JettonImage = memo(function JettonImage({
    jettonAddress,
}: {
    jettonAddress: Address | string | undefined;
}) {
    const jettonInfo = useJettonInfo(resolveJettonAddress(jettonAddress));
    return <img src={jettonInfo?.image} alt={jettonInfo?.name} className="w-8 h-8 rounded-full" />;
});

const JettonFlowItem = memo(function JettonFlowItem({
    jettonAddress,
    amount,
}: {
    jettonAddress: Address | string | undefined;
    amount: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="truncate max-w-[200px] flex items-center gap-2">
                <JettonImage jettonAddress={jettonAddress} />
                <JettonNameDisplay jettonAddress={jettonAddress} />
            </span>
            <div className={`flex ml-2 font-medium ${BigInt(amount) >= 0n ? 'text-green-600' : 'text-red-600'}`}>
                {BigInt(amount) >= 0n ? '+' : ''}
                <JettonAmountDisplay amount={BigInt(amount)} jettonAddress={jettonAddress} />
            </div>
        </div>
    );
});

export const JettonFlow = memo(function JettonFlow({ transfers }: { transfers: TransactionTraceMoneyFlowItem[] }) {
    return (
        <div className="mt-2">
            <div className="font-semibold mb-1">Money Flow:</div>
            <div className="flex flex-col gap-2">
                {transfers?.length > 0
                    ? transfers.map((transfer) =>
                          transfer.assetType === 'jetton' ? (
                              <JettonFlowItem
                                  key={transfer.tokenAddress}
                                  jettonAddress={transfer.tokenAddress}
                                  amount={transfer.amount}
                              />
                          ) : (
                              <JettonFlowItem
                                  key={`${transfer.assetType.toString()}-${transfer.tokenAddress}`}
                                  jettonAddress={transfer.assetType.toLocaleUpperCase()}
                                  amount={transfer.amount}
                              />
                          ),
                      )
                    : null}
            </div>
        </div>
    );
});
