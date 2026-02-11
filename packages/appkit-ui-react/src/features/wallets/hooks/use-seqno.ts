/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GetSeqnoByAddressData } from '@ton/appkit/queries';

import { useAddress } from './use-address';
import type { UseSeqnoByAddressParameters, UseSeqnoByAddressReturnType } from './use-seqno-by-address';
import { useSeqnoByAddress } from './use-seqno-by-address';

export type UseSeqnoParameters<selectData = GetSeqnoByAddressData> = UseSeqnoByAddressParameters<selectData>;

export type UseSeqnoReturnType<selectData = GetSeqnoByAddressData> = UseSeqnoByAddressReturnType<selectData>;

/**
 * Hook to get seqno of the selected wallet
 */
export const useSeqno = <selectData = GetSeqnoByAddressData>(
    parameters: UseSeqnoParameters<selectData> = {},
): UseSeqnoReturnType<selectData> => {
    const address = useAddress();
    return useSeqnoByAddress({ ...parameters, address });
};
