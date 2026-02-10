/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSelectedWallet } from '../../wallets/hooks/use-selected-wallet';
import type { UseSeqnoParameters, UseSeqnoReturnType } from './use-seqno';
import { useSeqno } from './use-seqno';

export type UseSelectedWalletSeqnoParameters = UseSeqnoParameters['query'];

export type UseSelectedWalletSeqnoReturnType = UseSeqnoReturnType;

/**
 * Hook to get the sequence number (seqno) of the selected wallet
 */
export const useSelectedWalletSeqno = (
    queryOptions?: UseSelectedWalletSeqnoParameters,
): UseSelectedWalletSeqnoReturnType => {
    const [selectedWallet] = useSelectedWallet();
    const address = selectedWallet?.getAddress();

    return useSeqno({
        address: address as string,
        network: selectedWallet?.getNetwork(),
        query: {
            ...queryOptions,
            enabled: !!address,
        },
    });
};
