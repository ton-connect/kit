/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { EmulationAddressMetadata } from '../emulation';

export interface MetadataV3 {
    address_book: Record<string, AddressBookRowV3>;
    metadata: Record<string, EmulationAddressMetadata>;
}

export interface AddressBookRowV3 {
    domain: string | null;
    user_friendly: string;
    interfaces: string[];
}
