/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface EmulationTokenInfoWallet {
    type: 'jetton_wallets';
    valid: boolean;
    extra: {
        balance: string;
        jetton: string;
        owner: string;
    };
}

export interface EmulationTokenInfoMaster {
    type: 'jetton_masters';
    valid: boolean;
    name: string;
    symbol: string;
    description: string;
    image?: string;
    extra: Record<string, unknown>;
}

export type EmulationTokenInfo =
    | EmulationTokenInfoWallet
    | EmulationTokenInfoMaster
    | { type: string; valid: boolean; [key: string]: unknown };

export interface EmulationAddressMetadata {
    isIndexed: boolean;
    tokenInfo?: EmulationTokenInfo[];
}
