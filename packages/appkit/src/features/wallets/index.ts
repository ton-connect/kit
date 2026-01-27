/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export { WalletsManager } from './service/wallets-manager';

export * from './actions/connect';
export * from './actions/disconnect';
export * from './actions/get-selected-wallet';
export * from './actions/get-connected-wallets';
export * from './actions/set-selected-wallet-id';

export * from './watchers/watch-connected-wallets';
export * from './watchers/watch-selected-wallet';

export * from './types/wallet';
