/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '@ton/walletkit';

/**
 * Wallet balance amount, expressed as a string (alias of `TokenAmount` from
 * `@ton/walletkit`). The exact units depend on which API produced the value
 * — balance/jetton-balance actions return human-readable decimal strings
 * already formatted with the token's decimals; lower-level walletkit APIs
 * may return raw integer nano amounts.
 *
 * @public
 * @category Type
 * @section Balances
 */
export type Balance = TokenAmount;
