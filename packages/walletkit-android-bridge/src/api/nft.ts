/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { walletCall } from '../utils/bridge';

export const getNfts = (args: { walletId: string }) => walletCall('getNfts', args);
export const getNft = (args: { walletId: string }) => walletCall('getNft', args);
export const createTransferNftTransaction = (args: { walletId: string }) =>
    walletCall('createTransferNftTransaction', args);
export const createTransferNftRawTransaction = (args: { walletId: string }) =>
    walletCall('createTransferNftRawTransaction', args);
