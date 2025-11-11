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

    extra?: {
        attributes?: NftItemAttribute[];
        lottie?: string;
        uri?: string;
        _image_big?: string;
        _image_medium?: string;
        _image_small?: string;
        animation_url?: string;
        content_url?: string;
        [key: string]: unknown;
    };
    image?: string;
    lottie?: string;
    name?: string;
    symbol?: string;
    type?: string;
    valid?: boolean;
    animation?: string;
}
