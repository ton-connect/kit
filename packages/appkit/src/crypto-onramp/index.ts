/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Error thrown by {@link CryptoOnrampManager} and crypto-onramp providers — extends {@link DefiError} with `name: 'CryptoOnrampError'` and a stable `code` from the static `CryptoOnrampError.*` / `DefiError.*` constants.
 *
 * Codes (`CryptoOnrampError.*`, in addition to inherited {@link DefiError} codes):
 * - `'PROVIDER_ERROR'` — provider's upstream API rejected the call (unexpected response, auth failure, internal error).
 * - `'QUOTE_FAILED'` — provider could not produce a quote for the supplied parameters.
 * - `'DEPOSIT_FAILED'` — provider could not create a deposit for the previously obtained quote.
 * - `'REFUND_ADDRESS_REQUIRED'` — provider requires a refund address that the caller did not supply.
 * - `'INVALID_REFUND_ADDRESS'` — supplied refund address is not valid for the source chain.
 * - `'REVERSED_AMOUNT_NOT_SUPPORTED'` — provider does not support specifying the amount on the target side of the swap.
 *
 * @extract
 * @public
 * @category Class
 * @section Crypto Onramp
 */
export { CryptoOnrampError } from '@ton/walletkit';

/**
 * Abstract base class implemented by crypto-onramp providers (Layerswap, swaps.xyz, custom integrations). Apps don't use it directly — they consume providers through {@link CryptoOnrampManager} and the `getCryptoOnramp*` / {@link createCryptoOnrampDeposit} actions.
 *
 * @extract
 * @public
 * @category Class
 * @section Crypto Onramp
 */
export { CryptoOnrampProvider } from '@ton/walletkit';

/**
 * Runtime that owns registered {@link CryptoOnrampProvider}s and dispatches quote/deposit/status calls. Usually accessed through the higher-level actions ({@link getCryptoOnrampQuote}, {@link createCryptoOnrampDeposit}, {@link getCryptoOnrampStatus}).
 *
 * @extract
 * @public
 * @category Class
 * @section Crypto Onramp
 */
export { CryptoOnrampManager } from '@ton/walletkit';

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
