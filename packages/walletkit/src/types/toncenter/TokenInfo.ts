/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NftItemAttribute } from './NftItem';
import type { TokenInfo as APITokenInfo } from '../../api/models';

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

export function toApiTokenInfo(data: TokenInfo): APITokenInfo {
    var lottie: string | undefined;
    var animationUrl: string | undefined;

    if (data?.extra?.animation_url) {
        animationUrl = data.extra.animation_url;
    } else if (data?.extra?.content_url && data.extra.content_url.includes('mp4')) {
        animationUrl = data.extra.content_url;
    }

    if (data.lottie) {
        lottie = data.lottie;
    } else if (data.extra && typeof data.extra === 'object' && 'lottie' in data.extra) {
        const lottieValue = (data.extra as Record<string, unknown>).lottie;
        if (typeof lottieValue === 'string') {
            lottie = lottieValue;
        }
    }

    const result: APITokenInfo = {
        name: data.name,
        description: data.description,
        image: {
            url: data.image ?? data.extra?._image_medium,
            smallUrl: data.extra?._image_small,
            mediumUrl: data.extra?._image_medium,
            largeUrl: data.extra?._image_big,
        },
        animation: {
            url: animationUrl,
            lottie: lottie,
        },
        symbol: data.symbol,
    };
    return result;
}
