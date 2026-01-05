/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';

export const getNftByAddress = (address: string) => {
    const store = getStore();
    const state = store.getState();

    return state.nfts.userNfts.find((nft) => nft.address === address);
};
