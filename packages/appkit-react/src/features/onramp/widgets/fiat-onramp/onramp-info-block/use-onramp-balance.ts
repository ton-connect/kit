/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useBalance } from '../../../../balances/hooks/use-balance';
import { useJettonBalanceByAddress } from '../../../../jettons/hooks/use-jetton-balance-by-address';
import type { AppkitUIToken } from '../../../../../types/appkit-ui-token';

const NATIVE_TON_TOKEN_ADDRESS = 'ton';

interface UseOnrampBalanceOptions {
    selectedToken: AppkitUIToken | null;
    userAddress: string | undefined;
}

export const useOnrampBalance = ({ selectedToken, userAddress }: UseOnrampBalanceOptions) => {
    const isNativeTonTarget = selectedToken?.address === NATIVE_TON_TOKEN_ADDRESS;

    const { data: nativeBalanceData, isLoading: isNativeBalanceLoading } = useBalance({
        query: { enabled: isNativeTonTarget && !!userAddress, refetchInterval: 5000 },
    });

    const { data: jettonBalanceData, isLoading: isJettonBalanceLoading } = useJettonBalanceByAddress({
        jettonAddress: !isNativeTonTarget ? selectedToken?.address : undefined,
        ownerAddress: userAddress,
        jettonDecimals: selectedToken?.decimals,
        query: { enabled: !isNativeTonTarget && !!selectedToken?.address && !!userAddress, refetchInterval: 5000 },
    });

    return {
        targetBalance: (isNativeTonTarget ? nativeBalanceData : jettonBalanceData) ?? '',
        isLoadingTargetBalance: isNativeTonTarget ? isNativeBalanceLoading : isJettonBalanceLoading,
    };
};
