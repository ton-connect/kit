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
};

// Contract-related constants
export const CONTRACT = {
    STAKING_CONTRACT_ADDRESS: 'EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR',
    STAKING_CONTRACT_ADDRESS_TESTNET: 'kQANFsYyYn-GSZ4oajUJmboDURZU-udMHf9JxzO4vYM_hFP3',
    PARTNER_CODE: 0x000000106796caef,
    PAYLOAD_UNSTAKE: 0x595f07bc,
    PAYLOAD_STAKE: 0x47d54391,
    STAKE_FEE_RES: toNano('1'),
    UNSTAKE_FEE_RES: toNano('1.05'),
    RECOMMENDED_FEE_RESERVE: toNano('1.1'),
};

// Blockchain identifiers exposed as part of the public staking API.
// Currently not used internally but kept for library consumers.
export const BLOCKCHAIN = {
    MAINNET: 'mainnet',
    TESTNET: 'testnet',
} as const;
