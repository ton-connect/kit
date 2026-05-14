/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useBalance } from '../../../../balances/hooks/use-balance';
import { useJettonBalanceByAddress } from '../../../../jettons/hooks/use-jetton-balance-by-address';
import { NATIVE_TON_ADDRESS } from '../../../constants';
import type { CryptoOnrampToken } from '../../../types';

interface UseCryptoOnrampBalanceOptions {
    selectedToken: CryptoOnrampToken | null;
    userAddress: string | undefined;
}

export const useCryptoOnrampBalance = ({ selectedToken, userAddress }: UseCryptoOnrampBalanceOptions) => {
    const isNativeTonTarget = selectedToken?.address === NATIVE_TON_ADDRESS;

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
