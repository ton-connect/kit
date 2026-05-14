/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Map of extra-currency ids to raw amounts attached to a transaction message — TON's mechanism for transferring non-jetton native tokens (e.g., wrapped or testnet currencies). Keys are the extra-currency ids defined by the masterchain configuration.
 *
 * @extract
 * @public
 * @category Type
 * @section Primitives
 */
export type { ExtraCurrencies } from '@ton/walletkit';

/**
 * Base64-encoded byte string — used for transaction payloads, BoCs, signatures, and other opaque binary blobs that travel through TonConnect and the indexer APIs.
 *
 * @extract
 * @public
 * @category Type
 * @section Primitives
 */
export type { Base64String } from '@ton/walletkit';

/**
 * `0x`-prefixed hexadecimal string used for public keys and other hashes.
 *
 * @extract
 * @public
 * @category Type
 * @section Primitives
 */
export type { Hex } from '@ton/walletkit';

/**
 * Decimal string carrying a token amount. Preserves precision and avoids floating-point rounding (e.g., `"1.5"` TON, or raw nano units depending on the API).
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
