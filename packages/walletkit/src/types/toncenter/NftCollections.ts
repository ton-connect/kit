/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { NftCollection } from './NftCollection';
import { AddressMetadata } from './AddressMetadata';
import { AddressBookRow } from './AddressBookRow';

export interface NftCollections {
    addressBook?: { [key: string]: AddressBookRow };
    metadata?: { [key: string]: AddressMetadata };
    nftCollections?: NftCollection[];
}
