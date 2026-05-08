/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type { Base64String, Hex, ExtraCurrencies } from '@ton/walletkit';

/**
 * Decimal string carrying a token amount; preserves precision and avoids floating-point rounding (e.g., `"1.5"` TON, or raw nano units depending on the API).
 *
 * @extract
 * @public
 * @category Type
 * @section Primitives
 */
export type { TokenAmount } from '@ton/walletkit';

/**
 * User-friendly TON wallet address as a base64url string (e.g., `"EQDtFp...4q2"`).
 *
 * @extract
 * @public
 * @category Type
 * @section Primitives
 */
export type { UserFriendlyAddress } from '@ton/walletkit';
