/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GetJettonsData } from '@ton/appkit/queries';

import { useSelectedWallet } from '../../wallets/hooks/use-selected-wallet';
import type { UseJettonsParameters, UseJettonsReturnType } from './use-jettons';
import { useJettons } from './use-jettons';

export type UseSelectedWalletJettonsParameters = UseJettonsParameters['query'];

export type UseSelectedWalletJettonsReturnType = UseJettonsReturnType<GetJettonsData | undefined>;

/**
 * Hook to get jettons
 */
export const useSelectedWalletJettons = (
    queryOptions?: UseSelectedWalletJettonsParameters,
): UseSelectedWalletJettonsReturnType => {
    const [selectedWallet] = useSelectedWallet();
    const address = selectedWallet?.getAddress();

    return useJettons({
        address: address as string,
        network: selectedWallet?.getNetwork(),
        query: {
            ...queryOptions,
            enabled: !!address,
        },
    });
};
