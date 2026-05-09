/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { useAppKit, useAddress } from '@ton/appkit-react';

import { getSmartAccountAddress } from '../actions/get-smart-account-address';

export type UseSmartAccountAddressReturnType = UseQueryResult<string, Error>;

/**
 * Hook to get the TAC smart account address for the connected wallet and an EVM application.
 * Re-runs automatically when the selected wallet changes.
 */
export const useSmartAccountAddress = (applicationAddress: string): UseSmartAccountAddressReturnType => {
    const appKit = useAppKit();
    const address = useAddress();

    return useQuery({
        queryKey: ['tac', 'smart-account-address', address, applicationAddress],
        queryFn: () => getSmartAccountAddress(appKit, { applicationAddress }),
        enabled: !!address && !!applicationAddress,
    });
};
