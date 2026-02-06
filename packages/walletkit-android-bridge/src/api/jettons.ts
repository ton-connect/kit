/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * jettons.ts – Jetton operations
 *
 * Minimal bridge for jetton operations.
 */

import { walletCall } from '../utils/bridge';

export const getJettons = (args: { walletId: string }) => walletCall('getJettons', args);
export const createTransferJettonTransaction = (args: { walletId: string }) =>
    walletCall('createTransferJettonTransaction', args);
export const getJettonBalance = (args: { walletId: string }) => walletCall('getJettonBalance', args);
export const getJettonWalletAddress = (args: { walletId: string }) => walletCall('getJettonWalletAddress', args);
