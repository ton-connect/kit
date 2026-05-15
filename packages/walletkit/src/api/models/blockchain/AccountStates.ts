/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { AccountState } from './AccountState';

/**
 * Map of normalized account addresses to their blockchain states.
 *
 * Every address passed to a batched account-state fetch is guaranteed to
 * have a key in this map. Accounts that don't exist on chain are represented
 * by an `AccountState` with `status: 'non-existing'`. Keys are normalized
 * via `asAddressFriendly`, regardless of the input format.
 */
export type AccountStates = Record<UserFriendlyAddress, AccountState>;
