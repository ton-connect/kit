/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TokenInfoNFTCollection } from './NFTCollectionV3';
import { NftTokenInfoV3 } from './NftTokenInfoV3';

export interface AddressMetadataV3 {
    is_indexed: boolean;
    token_info: Array<NftTokenInfoV3 | TokenInfoNFTCollection>;
}
