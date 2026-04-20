/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { GaslessGasJetton } from './GaslessGasJetton';

/**
 * Relayer configuration for gasless transactions.
 *
 * Reports which jettons the relayer accepts as fee payment and the address
 * where the relayer fee is routed.
 */
export interface GaslessConfig {
    /** Address where the relayer expects to receive the fee */
    relayAddress: UserFriendlyAddress;
    /** Jettons supported by the relayer for paying the fee */
    supportedGasJettons: GaslessGasJetton[];
}
