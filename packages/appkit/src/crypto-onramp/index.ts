/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Error thrown by {@link CryptoOnrampManager} and crypto-onramp providers — extends {@link DefiError} with a `'crypto-onramp'` discriminator.
 *
 * @extract
 * @public
 * @category Class
 * @section Crypto Onramp
 */
export { CryptoOnrampError } from '@ton/walletkit';

/**
 * @extract
 * @public
 * @category Class
 * @section Crypto Onramp
 */
export { CryptoOnrampProvider, CryptoOnrampManager } from '@ton/walletkit';

/**
 * @extract
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type {
    CryptoOnrampQuote,
    CryptoOnrampQuoteParams,
    CryptoOnrampDeposit,
    CryptoOnrampDepositParams,
    CryptoOnrampProviderMetadata,
    CryptoOnrampProviderMetadataOverride,
    CryptoOnrampProviderInterface,
} from '@ton/walletkit';

/**
 * Final state of a crypto-onramp deposit returned by {@link getCryptoOnrampStatus} — `'success'` (delivered to the recipient), `'pending'` (still in flight), or `'failed'` (provider could not complete the deposit).
 *
 * @extract
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type { CryptoOnrampStatus } from '@ton/walletkit';

/**
 * Parameters accepted by {@link getCryptoOnrampStatus} — identifies a previously created deposit and the provider that issued it.
 *
 * @extract
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type { CryptoOnrampStatusParams } from '@ton/walletkit';

// Internal-only — `CryptoOnrampAPI` is the contract `CryptoOnrampManager` satisfies, not consumed directly from `@ton/appkit`.
export type { CryptoOnrampAPI } from '@ton/walletkit';
