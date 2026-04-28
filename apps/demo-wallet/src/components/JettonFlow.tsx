/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo } from 'react';
import type { Address } from '@ton/core';
import type { TransactionTraceMoneyFlowItem } from '@ton/walletkit';

import { resolveTokenAddress, TON_INFO, useJettonInfo } from '../hooks/useJettonInfo';
import { formatUnits } from '../utils/units';

export const JettonNameDisplay = memo(function JettonNameDisplay({
    jettonAddress,
}: {
    jettonAddress: Address | string | undefined;
}) {
    const jettonInfo = useJettonInfo(resolveTokenAddress(jettonAddress));
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
    const jettonInfo = useJettonInfo(resolveTokenAddress(jettonAddress));
    const decimals = jettonInfo?.decimals ?? 9;
    const symbol = jettonInfo?.symbol ?? 'UNKWN';
    return (
        <div>
            {formatUnits(amount, decimals)} {symbol}
        </div>
    );
});

export const JettonImage = memo(function JettonImage({
    jettonAddress,
}: {
    jettonAddress: Address | string | undefined;
}) {
    const jettonInfo = useJettonInfo(resolveTokenAddress(jettonAddress));
    if (!jettonInfo?.image) {
        return <img src={TON_INFO.image} alt={TON_INFO.name} className="w-8 h-8 rounded-full" />;
    }
    return <img src={jettonInfo.image} alt={jettonInfo.name} className="w-8 h-8 rounded-full" />;
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
