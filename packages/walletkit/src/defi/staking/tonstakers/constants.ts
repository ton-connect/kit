/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '../../../api/models';
import type { UserFriendlyAddress } from '../../../api/models';
import { parseUnits } from '../../../utils/units';

export const CACHE_TIMEOUT = 30000;

export const STAKING_CONTRACT_ADDRESS = {
    // https://github.com/ton-blockchain/liquid-staking-contract/tree/35d676f6ac6e35e755ea3c4d7d7cf577627b1cf0
    [Network.mainnet().chainId]: 'EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR' as UserFriendlyAddress,
    // https://github.com/ton-blockchain/liquid-staking-contract/tree/77f13c850890517a6b490ef5f109c31b4fa783e7
    [Network.testnet().chainId]: 'kQANFsYyYn-GSZ4oajUJmboDURZU-udMHf9JxzO4vYM_hFP3' as UserFriendlyAddress,
};

// Contract-related constants
export const CONTRACT = {
    PARTNER_CODE: 0x000000106796caef,
    PAYLOAD_UNSTAKE: 0x595f07bc,
    PAYLOAD_STAKE: 0x47d54391,
    STAKE_FEE_RES: parseUnits('1', 9),
    UNSTAKE_FEE_RES: parseUnits('1.05', 9),
    RECOMMENDED_FEE_RESERVE: parseUnits('1.1', 9),
};
