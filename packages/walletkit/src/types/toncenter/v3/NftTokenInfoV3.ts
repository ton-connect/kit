/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TokenInfo } from '../TokenInfo';

export interface NftTokenInfoV3 {
    description?: string;
    extra?: { [key: string]: never };
    image?: string;
    name?: string;
    nft_index?: string;
    symbol?: string;
    type?: string;
    valid?: boolean;
}

export function toTokenInfo(data: NftTokenInfoV3): TokenInfo {
    return {
        valid: data.valid,
        type: data.type,
        name: data.name,
        description: data.description,
        image: data.image,
        extra: data.extra,
    };
}
