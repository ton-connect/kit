/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getSeqnoByAddressQueryOptions } from '@ton/appkit/queries';
import type { GetSeqnoByAddressData, GetSeqnoErrorType, GetSeqnoByAddressQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseSeqnoByAddressParameters<selectData = GetSeqnoByAddressData> = GetSeqnoByAddressQueryConfig<selectData>;

export type UseSeqnoByAddressReturnType<selectData = GetSeqnoByAddressData> = UseQueryReturnType<
    selectData,
    GetSeqnoErrorType
>;

/**
 * Hook to get the sequence number (seqno) of a wallet
 */
export const useSeqnoByAddress = <selectData = GetSeqnoByAddressData>(
    parameters: UseSeqnoByAddressParameters<selectData> = {},
): UseSeqnoByAddressReturnType<selectData> => {
    const appKit = useAppKit();
    const options = getSeqnoByAddressQueryOptions(appKit, parameters);

    return useQuery(options);
};
