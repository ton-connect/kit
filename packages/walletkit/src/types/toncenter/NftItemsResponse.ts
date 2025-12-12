/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { UserFriendlyAddress } from '../../api/models';
import { AddressBookRow } from './AddressBookRow';
import { NftItems } from './NftItems';
import { NftMetadata } from './NftMetadata';

export interface NftItemsResponse extends NftItems {
    addressBook: { [key: UserFriendlyAddress]: AddressBookRow };
    metadata: NftMetadata;
}
