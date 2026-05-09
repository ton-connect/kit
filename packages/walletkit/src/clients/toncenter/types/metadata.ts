/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface EmulationAddressMetadata {
    is_indexed: boolean;
    token_info?: EmulationTokenInfo[];
}

export type EmulationTokenInfo =
    | EmulationTokenInfoWallets
    | EmulationTokenInfoMasters
    | (EmulationTokenInfoBase & Record<string, unknown>);

export interface EmulationTokenInfoBase {
    valid: boolean;
    type: string;
}

export interface EmulationTokenInfoWallets extends EmulationTokenInfoBase {
    type: 'jetton_wallets';
    extra: {
        balance: string;
        jetton: string;
        owner: string;
    };
}

export interface EmulationTokenInfoMasters extends EmulationTokenInfoBase {
    type: 'jetton_masters';
    name: string;
    symbol: string;
    description: string;
    image?: string;
    extra: {
        _image_big?: string;
        _image_medium?: string;
        _image_small?: string;
        decimals: string;
        image_data?: string;
        social?: string[];
        uri?: string;
        websites?: string[];
        [key: string]: unknown;
    };
}
