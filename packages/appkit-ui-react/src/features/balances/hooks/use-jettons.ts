/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonsQueryOptions } from '@ton/appkit/queries';
import type { GetJettonsData, GetJettonsErrorType, GetJettonsQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseJettonsParameters<selectData = GetJettonsData> = GetJettonsQueryConfig<selectData>;

export type UseJettonsReturnType<selectData = GetJettonsData> = UseQueryReturnType<selectData, GetJettonsErrorType>;

/**
 * Hook to get jettons
 */
export const useJettons = <selectData = GetJettonsData>(
    parameters: UseJettonsParameters<selectData> = {},
): UseJettonsReturnType<selectData> => {
    const appKit = useAppKit();
    const options = getJettonsQueryOptions(appKit, parameters);

    return useQuery(options);
};
