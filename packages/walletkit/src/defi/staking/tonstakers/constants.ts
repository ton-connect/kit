/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { toNano } from '@ton/core';

// Timing-related constants
export const TIMING = {
    DEFAULT_INTERVAL: 5000,
    TIMEOUT: 600000,
    CACHE_TIMEOUT: 30000,
    ESTIMATED_TIME_BW_TX_S: 3,
    ESTIMATED_TIME_AFTER_ROUND_S: 10 * 60,
    CYCLE_LENGTH_HOURS: 18,
    CYCLES_PER_YEAR: (365.25 * 24) / 18,
    PROTOCOL_FEE: 0.1,
};

// Contract-related constants
export const CONTRACT = {
    // https://github.com/ton-blockchain/liquid-staking-contract/tree/35d676f6ac6e35e755ea3c4d7d7cf577627b1cf0
    STAKING_CONTRACT_ADDRESS: 'EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR',
    // https://github.com/ton-blockchain/liquid-staking-contract/tree/77f13c850890517a6b490ef5f109c31b4fa783e7
    STAKING_CONTRACT_ADDRESS_TESTNET: 'kQANFsYyYn-GSZ4oajUJmboDURZU-udMHf9JxzO4vYM_hFP3',
    PARTNER_CODE: 0x000000106796caef,
    PAYLOAD_UNSTAKE: 0x595f07bc,
    PAYLOAD_STAKE: 0x47d54391,
    STAKE_FEE_RES: toNano('1'),
    UNSTAKE_FEE_RES: toNano('1.05'),
    RECOMMENDED_FEE_RESERVE: toNano('1.1'),
};
