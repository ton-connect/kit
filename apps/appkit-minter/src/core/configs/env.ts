/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const ENV_TON_API_KEY_MAINNET =
    import.meta.env.VITE_TON_API_KEY ?? 'AECTPKOIYZUDZ7AAAAAMSOZQCF2U46X2VU6LGOCWRTA4ARB3SIDBKPY6KJDLCXXIBWMHPPQ';
export const ENV_TON_API_KEY_TESTNET =
    import.meta.env.VITE_TON_API_TESTNET_KEY ?? 'AECTPKOIYZUDZ7AAAAAMSOZQCF2U46X2VU6LGOCWRTA4ARB3SIDBKPY6KJDLCXXIBWMHPPQ';
export const ENV_TON_API_MIN_REQUEST_INTERVAL_MS = Number(import.meta.env.VITE_TON_API_MIN_REQUEST_INTERVAL_MS ?? '200');
