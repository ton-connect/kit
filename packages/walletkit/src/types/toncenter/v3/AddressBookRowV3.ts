/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AddressBook, AddressBookEntry } from '../../../api/models';
import { asAddressFriendly } from '../../../utils/address';
import type { EmulationAddressMetadata } from '../emulation';

export interface MetadataV3 {
    address_book: Record<string, AddressBookRowV3>;
    metadata: Record<string, EmulationAddressMetadata>;
}

export interface AddressBookRowV3 {
    domain: string | null;
    user_friendly: string;
    interfaces: string[];
}

export function toAddressBookEntry(row: AddressBookRowV3): AddressBookEntry {
    return {
        domain: row.domain ?? undefined,
        address: asAddressFriendly(row.user_friendly),
        interfaces: row.interfaces,
    };
}

export function toAddressBook(addressBookV3: Record<string, AddressBookRowV3>): AddressBook {
    const addressBook: AddressBook = {};
    for (const [_, row] of Object.entries(addressBookV3)) {
        const userFriendlyAddress = asAddressFriendly(row.user_friendly);
        addressBook[userFriendlyAddress] = toAddressBookEntry(row);
    }
    return addressBook;
}
