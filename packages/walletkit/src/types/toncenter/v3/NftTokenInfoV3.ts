/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NftItemAttribute } from '../NftItem';
import type { TokenInfo } from '../TokenInfo';

export interface NftTokenInfoV3 {
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
        animation: data?.extra?.animation_url,
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

    if (data?.extra?.animation_url) {
        result.animation = data.extra.animation_url;
    } else if (data?.extra?.content_url && data.extra.content_url.includes('mp4')) {
        result.animation = data.extra.content_url;
    }
    return result;
}
