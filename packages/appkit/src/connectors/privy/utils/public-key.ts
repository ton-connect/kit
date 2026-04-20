/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex } from '@ton/walletkit';
import { asHex } from '@ton/walletkit';

const PRIVY_API_URL = 'https://auth.privy.io/api/v1/wallets';

/**
 * Fetch the Ed25519 public key for a Privy-managed TON wallet via Privy's REST API.
 * Requires an access token (from `usePrivy().getAccessToken()`) and the Privy app id.
 *
 * Returns a walletkit-compatible Hex string (`0x` + 64 lowercase hex chars).
 */
export async function fetchPrivyTonWalletPublicKey(walletId: string, accessToken: string, appId: string): Promise<Hex> {
    const response = await fetch(`${PRIVY_API_URL}/${walletId}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'privy-app-id': appId,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to load Privy TON wallet public key (HTTP ${response.status})`);
    }

    const body = (await response.json()) as { public_key?: string; publicKey?: string };
    let hex = (body.public_key ?? body.publicKey ?? '').replace(/^0x/i, '').toLowerCase();

    // Privy occasionally prefixes Ed25519 keys with a 0x00 byte — strip it.
    if (hex.length === 66 && hex.startsWith('00')) {
        hex = hex.slice(2);
    }

    if (hex.length !== 64 || !/^[0-9a-f]{64}$/.test(hex)) {
        throw new Error('Unexpected public key shape from Privy');
    }

    return asHex(`0x${hex}`);
}
