/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { NftItemAttribute } from './NftItem';

export interface TokenInfo {
    description?: string;
    extra?: { [key: string]: string | NftItemAttribute[] }; // attributes, lottie, uri, _image_big, _image_medium, _image_small
    image?: string;
    lottie?: string;
    name?: string;
    nftIndex?: string;
    symbol?: string;
    type?: string;
    valid?: boolean;
}
