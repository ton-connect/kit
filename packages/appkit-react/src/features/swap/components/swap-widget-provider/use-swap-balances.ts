/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/appkit';

import { useBalance } from '../../../balances/hooks/use-balance';
import { useJettonBalanceByAddress } from '../../../jettons/hooks/use-jetton-balance-by-address';
import type { AppkitUIToken } from '../../../../types/appkit-ui-token';

interface UseSwapBalancesOptions {
    fromToken: AppkitUIToken | null;
    toToken: AppkitUIToken | null;
    ownerAddress: string | undefined;
    network: Network | undefined;
}

export function useSwapBalances({ fromToken, toToken, ownerAddress, network }: UseSwapBalancesOptions) {
    const isFromNative = fromToken?.address === 'ton';
    const isToNative = toToken?.address === 'ton';

    const { data: tonBalance, isLoading: isTonBalanceLoading } = useBalance({ network });

    const { data: fromJettonBalance, isLoading: isFromJettonBalanceLoading } = useJettonBalanceByAddress({
        jettonAddress: fromToken?.address,
        ownerAddress,
        jettonDecimals: fromToken?.decimals,
        network,
        query: { enabled: !isFromNative && !!fromToken, refetchInterval: 5000 },
    });

    const { data: toJettonBalance, isLoading: isToJettonBalanceLoading } = useJettonBalanceByAddress({
        jettonAddress: toToken?.address,
        ownerAddress,
        jettonDecimals: toToken?.decimals,
        network,
        query: { enabled: !isToNative && !!toToken, refetchInterval: 5000 },
    });

    return {
        fromBalance: isFromNative ? tonBalance : fromJettonBalance,
        toBalance: isToNative ? tonBalance : toJettonBalance,
        isFromBalanceLoading: isFromNative ? isTonBalanceLoading : isFromJettonBalanceLoading,
        isToBalanceLoading: isToNative ? isTonBalanceLoading : isToJettonBalanceLoading,
    };
}
