/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';

/**
 * Address book entry providing human-readable metadata for an on-chain address.
 */
export interface EmulationAddressBookEntry {
    /**
     * DNS domain name associated with the address, if any
     */
    domain?: string;

    /**
     * User-friendly representation of the address
     */
    userFriendly: UserFriendlyAddress;

    /**
     * List of known interfaces implemented by the contract
     */
    interfaces: string[];
}
