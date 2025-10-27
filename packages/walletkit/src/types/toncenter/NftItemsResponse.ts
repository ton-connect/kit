/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddressBookRow } from './AddressBookRow';
import { AddressFriendly } from '../primitive';
import { NftItems } from './NftItems';
import { NftMetadata } from './NftMetadata';

export interface NftItemsResponse extends NftItems {
    addressBook: { [key: AddressFriendly]: AddressBookRow };
    metadata: NftMetadata;
}
