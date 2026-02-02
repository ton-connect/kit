/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';

import { useWallet } from './useWalletStore';
import { formatUnits } from '../utils';

export const useFormattedAmount = (amount: string | undefined, decimals: number) => {
    return useMemo(() => formatUnits(amount || '0', decimals), [amount, decimals]);
};

export const useFormattedTonBalance = () => {
    const { balance } = useWallet();

    return useFormattedAmount(balance, 9);
};
