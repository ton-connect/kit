/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useBalance } from '../../../balances/hooks/use-balance';
import { useJettonBalanceByAddress } from '../../../jettons/hooks/use-jetton-balance-by-address';
import type { AppkitUIToken } from '../../../../types/appkit-ui-token';

interface UseSwapBalancesOptions {
    fromToken: AppkitUIToken | null;
    toToken: AppkitUIToken | null;
    ownerAddress: string | undefined;
}

export const useSwapBalances = ({ fromToken, toToken, ownerAddress }: UseSwapBalancesOptions) => {
    const isFromNative = fromToken?.address === 'ton';
    const isToNative = toToken?.address === 'ton';

    const { data: tonBalance } = useBalance({ query: { refetchInterval: 5000 } });

    const { data: fromJettonBalance } = useJettonBalanceByAddress({
        jettonAddress: fromToken?.address,
        ownerAddress,
        jettonDecimals: fromToken?.decimals,
        query: { enabled: !isFromNative && !!fromToken, refetchInterval: 5000 },
    });

    const { data: toJettonBalance } = useJettonBalanceByAddress({
        jettonAddress: toToken?.address,
        ownerAddress,
        jettonDecimals: toToken?.decimals,
        query: { enabled: !isToNative && !!toToken, refetchInterval: 5000 },
    });

    return {
        fromBalance: isFromNative ? tonBalance : fromJettonBalance,
        toBalance: isToNative ? tonBalance : toJettonBalance,
    };
};
