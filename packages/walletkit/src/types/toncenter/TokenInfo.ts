/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface TokenInfo {
    description?: string;
    extra?: { [key: string]: never };
    image?: string;
    name?: string;
    nftIndex?: string;
    symbol?: string;
    type?: string;
    valid?: boolean;
}
