/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';

import { useSelectedWallet } from './use-selected-wallet';

export type UseAddressReturnType = string | undefined;

/**
 * Hook to get current wallet address
 */
export const useAddress = (): UseAddressReturnType => {
    const [wallet] = useSelectedWallet();

    return useMemo(() => wallet?.getAddress(), [wallet]);
};
