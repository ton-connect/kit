/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AddressBook } from '../core/AddressBook';
import type { Jetton } from './Jetton';

/**
 * Response containing a list of Jetton tokens.
 */
export interface JettonsResponse {
    /**
     * Address book mapping
     */
    addressBook: AddressBook;
    /**
     * List of Jettons
     */
    jettons: Jetton[];
}
