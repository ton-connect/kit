/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getSeqnoQueryOptions } from '@ton/appkit/queries';
import type { GetSeqnoData, GetSeqnoErrorType, GetSeqnoQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseSeqnoParameters<selectData = GetSeqnoData> = GetSeqnoQueryConfig<selectData>;

export type UseSeqnoReturnType<selectData = GetSeqnoData> = UseQueryReturnType<selectData, GetSeqnoErrorType>;

/**
 * Hook to get the sequence number (seqno) of a wallet
 */
export const useSeqno = <selectData = GetSeqnoData>(
    parameters: UseSeqnoParameters<selectData> = {},
): UseSeqnoReturnType<selectData> => {
    const appKit = useAppKit();
    const options = getSeqnoQueryOptions(appKit, parameters);

    return useQuery(options);
};
