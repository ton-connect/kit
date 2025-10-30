/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddressFriendly, Hex } from '../primitive';

export interface NftCollection {
    address: AddressFriendly;

    collectionContent?: { [key: string]: string }; // uri - meta json

    lastTransactionLt?: string;
    name?: string;
    nextItemIndex?: string;
    ownerAddress?: AddressFriendly | null;

    codeHash?: Hex | null;
    dataHash?: Hex | null;

    description?: string;
    image?: string;
    extra?: { [key: string]: string }; // toncenter fields - cover_image, uri, _image_big, _image_medium, _image_small
}
