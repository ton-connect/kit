/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';

import { useSelectedWallet } from './use-selected-wallet';

/**
 * Return type of {@link useAddress} — `undefined` when no wallet is selected.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export type UseAddressReturnType = string | undefined;

/**
 * Read the user-friendly address of the currently selected wallet. Updates when the selection changes.
 *
 * @returns Selected wallet's address, or `undefined` when none is selected.
 *
 * @public
 * @category Hook
 * @section Wallets
 */
export const useAddress = (): UseAddressReturnType => {
    const [wallet] = useSelectedWallet();

    return useMemo(() => wallet?.getAddress(), [wallet]);
};
