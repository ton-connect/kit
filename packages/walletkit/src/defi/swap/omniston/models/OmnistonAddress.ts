/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * This interface is copied from @ston-fi/omniston-sdk.
 * We need concrete models here to ensure seamless porting
 * of walletkit to iOS and Android versions.
 */
export interface OmnistonAddress {
    blockchain: number;
    address: string;
}
