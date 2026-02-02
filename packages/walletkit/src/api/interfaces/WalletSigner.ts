/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex } from '../models/core/Primitives';

export type ISigner = (bytes: Iterable<number>) => Promise<Hex>;

export type WalletSigner = {
    sign: ISigner;
    publicKey: Hex;
};
