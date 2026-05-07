/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '@ton/walletkit';

/**
 * Wallet balance for a single token.
 *
 * Re-exported from `@ton/walletkit` as `TokenAmount`. Carries the raw integer
 * amount (in the token's smallest units, e.g. nanotons) together with token
 * metadata (decimals, symbol, etc.) so consumers can format it without
 * looking up the token separately.
 *
 * @public
 * @category Type
 * @section Balances
 */
export type Balance = TokenAmount;
