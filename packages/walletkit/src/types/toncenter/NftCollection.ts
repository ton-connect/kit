/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex, UserFriendlyAddress } from '../../api/models';

export interface NftCollection {
    address: UserFriendlyAddress;

    collectionContent?: {
        uri?: string;
        [key: string]: unknown;
    };

    lastTransactionLt?: string;
    name?: string;
    nextItemIndex?: string;
    ownerAddress?: UserFriendlyAddress | null;

    codeHash?: Hex | null;
    dataHash?: Hex | null;

    description?: string;
    image?: string;
    extra?: {
        cover_image?: string;
        uri?: string;
        _image_big?: string;
        _image_medium?: string;
        _image_small?: string;
        [key: string]: unknown;
    };
}
