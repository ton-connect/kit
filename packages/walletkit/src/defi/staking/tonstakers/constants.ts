/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Timing-related constants
export const TIMING = {
    DEFAULT_INTERVAL: 5000,
    TIMEOUT: 600000,
    CACHE_TIMEOUT: 30000,
    ESTIMATED_TIME_BW_TX_S: 3,
    ESTIMATED_TIME_AFTER_ROUND_S: 10 * 60,
};

// Blockchain-related constants
export const BLOCKCHAIN = {
    CHAIN_DEV: '-3',
    API_URL: 'https://tonapi.io',
    API_URL_TESTNET: 'https://testnet.tonapi.io',
};

// Contract-related constants
export const CONTRACT = {
    STAKING_CONTRACT_ADDRESS: 'EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR',
    STAKING_CONTRACT_ADDRESS_TESTNET: 'kQANFsYyYn-GSZ4oajUJmboDURZU-udMHf9JxzO4vYM_hFP3',
    PARTNER_CODE: 0x000000106796caef,
    PAYLOAD_UNSTAKE: 0x595f07bc,
    PAYLOAD_STAKE: 0x47d54391,
    STAKE_FEE_RES: 1,
    UNSTAKE_FEE_RES: 1.05,
    RECOMMENDED_FEE_RESERVE: 1.1,
};
