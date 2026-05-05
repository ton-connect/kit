/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const ENV_BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL ?? 'https://walletbot.me/tonconnect-bridge/bridge';
export const ENV_TON_API_PROVIDER = import.meta.env?.VITE_TON_API_PROVIDER === 'tonapi' ? 'tonapi' : 'toncenter';
export const ENV_TON_API_KEY_MAINNET =
    import.meta.env.VITE_TON_API_KEY ?? 'AECTPKOIYZUDZ7AAAAAMSOZQCF2U46X2VU6LGOCWRTA4ARB3SIDBKPY6KJDLCXXIBWMHPPQ';
export const ENV_TON_API_KEY_TESTNET =
    import.meta.env.VITE_TON_API_TESTNET_KEY ??
    'AECTPKOIYZUDZ7AAAAAMSOZQCF2U46X2VU6LGOCWRTA4ARB3SIDBKPY6KJDLCXXIBWMHPPQ';
export const ENV_TON_API_KEY_TETRA = import.meta.env.VITE_TON_API_TETRA_KEY ?? '';
export const ENV_TON_API_MIN_REQUEST_INTERVAL_MS = Number(
    import.meta.env.VITE_TON_API_MIN_REQUEST_INTERVAL_MS ?? '1000',
);

export const DISABLE_NETWORK_SEND = import.meta.env?.VITE_DISABLE_NETWORK_SEND === 'true' || false;
export const DISABLE_MANIFEST_DOMAIN_CHECK = import.meta.env?.VITE_DISABLE_MANIFEST_DOMAIN_CHECK === 'true' || false;
export const DISABLE_HTTP_BRIDGE = import.meta.env?.VITE_DISABLE_HTTP_BRIDGE === 'true' || false;
export const DISABLE_AUTO_POPUP = import.meta.env?.VITE_DISABLE_AUTO_POPUP === 'true' || false;
export const DISABLE_AUTO_EMULATION = import.meta.env?.VITE_DISABLE_AUTO_EMULATION === 'true' || false;
