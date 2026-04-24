/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';

/**
 * A jetton accepted by the relayer as a fee payment option.
 */
export interface GaslessGasJetton {
    /** Jetton master address */
    jettonMaster: UserFriendlyAddress;
}
