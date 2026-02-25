/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TonApiAccountAddress } from './accounts';

export interface TonApiNftCollection {
    address: string;
    name: string;
    description: string;
}

export interface TonApiNftAttribute {
    trait_type: string;
    value: string;
}

export interface TonApiNftMetadata {
    attributes?: TonApiNftAttribute[];
    content_url?: string;
    description?: string;
    name?: string;
    image?: string;
}

export interface TonApiNftPreview {
    resolution: string;
    url: string;
}

export interface TonApiNftItem {
    address: string;
    index: number;
    owner?: TonApiAccountAddress;
    collection?: TonApiNftCollection;
    verified: boolean;
    metadata: TonApiNftMetadata;
    previews?: TonApiNftPreview[];
    approved_by?: string[];
    trust: 'whitelist' | 'blacklist' | 'none';
}

export interface TonApiNftItems {
    nft_items: TonApiNftItem[];
}
