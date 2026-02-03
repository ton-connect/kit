/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SignatureDomain } from '@ton/core';

import type { Hex } from '../models/core/Primitives';

export type ISigner = (bytes: Iterable<number>) => Promise<Hex>;
export type ISignerWithDomain = (bytes: Iterable<number>, domain?: SignatureDomain) => Promise<Hex>;

export type WalletSigner = {
    sign: ISigner | ISignerWithDomain;
    publicKey: Hex;
    secretKey?: Buffer; // Optional secretKey for domain signing support
};
