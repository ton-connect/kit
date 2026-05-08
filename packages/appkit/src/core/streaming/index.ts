/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export {
    StreamingManager,
    TonCenterStreamingProvider,
    createTonCenterStreamingProvider,
    TonApiStreamingProvider,
    createTonApiStreamingProvider,
} from '@ton/walletkit';

export type {
    StreamingProvider,
    StreamingProviderFactory,
    StreamingAPI,
    TonCenterStreamingProviderConfig,
    TonApiStreamingProviderConfig,
    TransactionsUpdate,
    Transaction,
    StreamingUpdate,
    StreamingWatchType,
    StreamingEvents,
} from '@ton/walletkit';

/**
 * Update payload delivered to {@link watchJettons} / {@link watchJettonsByAddress} subscribers when the watched owner's jetton balance changes.
 *
 * @extract
 * @public
 * @category Type
 * @section Jettons
 */
export type { JettonUpdate } from '@ton/walletkit';

/**
 * Finality stage carried by every streaming update — `'pending'` (in mempool), `'confirmed'` (included in a block), `'finalized'` (irreversible), or `'invalidated'` (rolled back).
 *
 * @extract
 * @public
 * @category Type
 * @section Balances
 */
export type { StreamingUpdateStatus } from '@ton/walletkit';

/**
 * Update payload delivered to {@link watchBalance} / {@link watchBalanceByAddress} subscribers when the watched address's TON balance changes.
 *
 * @extract
 * @public
 * @category Type
 * @section Balances
 */
export type { BalanceUpdate } from '@ton/walletkit';
