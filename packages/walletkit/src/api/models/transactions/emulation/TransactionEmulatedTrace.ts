/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String, Hex } from '../../core/Primitives';
import type { TransactionTrace } from '../TransactionTrace';
import type { TransactionAddressMetadata } from '../TransactionMetadata';
import type { AddressBook } from '../../core/AddressBook';

/**
 * Extended transaction trace with emulation-specific data including
 * code/data cells and address metadata.
 */
export interface TransactionEmulatedTrace extends TransactionTrace {
    /**
     * Map of code cell hashes to their Base64-encoded content
     */
    codeCells: { [key: Hex]: Base64String };
    /**
     * Map of data cell hashes to their Base64-encoded content
     */
    dataCells: { [key: Hex]: Base64String };
    /**
     * Address metadata for accounts involved in the transaction
     */
    metadata: TransactionAddressMetadata;
    /**
     * Address book mapping addresses to their human-readable names
     */
    addressBook: AddressBook;
}
