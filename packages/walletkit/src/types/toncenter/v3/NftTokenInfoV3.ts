/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { NftItemAttribute } from '../NftItem';
import { TokenInfo } from '../TokenInfo';

export interface NftTokenInfoV3 {
    description?: string;
    extra?: { [key: string]: string | NftItemAttribute[] }; // attributes, lottie, uri, _image_big, _image_medium, _image_small
    image?: string;
    lottie?: string;
    name?: string;
    nft_index?: string;
    symbol?: string;
    type: 'nft_items';
    valid?: boolean;
}

export function toTokenInfo(data: NftTokenInfoV3): TokenInfo {
    const result: TokenInfo = {
        valid: data.valid,
        type: data.type,
        name: data.name,
        description: data.description,
        image: data.image,
        extra: data.extra,
    };
    // Extract lottie from extra if it exists, or use direct lottie field
    if (data.lottie) {
        result.lottie = data.lottie;
    } else if (data.extra && typeof data.extra === 'object' && 'lottie' in data.extra) {
        const lottieValue = (data.extra as Record<string, unknown>).lottie;
        if (typeof lottieValue === 'string') {
            result.lottie = lottieValue;
        }
    }
    return result;
}
