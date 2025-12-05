/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { UserFriendlyAddress } from './Primitives';

/**
 * Map of raw addresses to their metadata entries.
 */
export type AddressBook = { [key: UserFriendlyAddress]: AddressBookEntry };

export interface AddressBookEntry {
    /**
     * The human-readable representation of the blockchain address
     */
    userFriendly?: UserFriendlyAddress;

    /**
     * The domain name associated with the address if available
     */
    domain?: string;
}
