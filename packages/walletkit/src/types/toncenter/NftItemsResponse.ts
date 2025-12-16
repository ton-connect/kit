/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../../api/models';
import type { AddressBookRow } from './AddressBookRow';
import type { NftItems } from './NftItems';
import type { NftMetadata } from './NftMetadata';

export interface NftItemsResponse extends NftItems {
    addressBook: { [key: UserFriendlyAddress]: AddressBookRow };
    metadata: NftMetadata;
}
