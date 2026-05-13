/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export enum DefiErrorCode {
    /** Provider with the requested id is not registered with the manager. */
    ProviderNotFound = 'PROVIDER_NOT_FOUND',
    /** No default provider is configured and the caller did not specify one. */
    NoDefaultProvider = 'NO_DEFAULT_PROVIDER',
    /** Provider rejected the request because of an upstream/network failure. */
    NetworkError = 'NETWORK_ERROR',
    /** Provider does not support the network selected for the operation. */
    UnsupportedNetwork = 'UNSUPPORTED_NETWORK',
    /** Caller passed parameters that fail provider-level validation. */
    InvalidParams = 'INVALID_PARAMS',
    /** Provider failed its own internal validation and cannot be used. */
    InvalidProvider = 'INVALID_PROVIDER',
}

/**
 * Base error thrown by DeFi managers (swap, staking, onramp) when a provider call fails. Subclassed by {@link SwapError} / {@link StakingError} / {@link CryptoOnrampError} and discriminated at runtime via the `code` field.
 */
export class DefiError extends Error {
    /** Stable error code for branching logic. Subclasses narrow this to their own domain-specific enum (e.g. {@link SwapErrorCode}, {@link StakingErrorCode}). */
    public readonly code: string;
    /** Provider-specific extra context (request payload, upstream error, etc.). Shape is not stable. */
    public readonly details?: unknown;

    /**
     * @param message - Human-readable description, forwarded to `Error`.
     * @param code - {@link DefiErrorCode} Stable error code for branching logic.
     * @param details - Optional provider-specific context for diagnostics.
     */
    constructor(message: string, code: string, details?: unknown) {
        super(message);
        this.name = 'DefiError';
        this.code = code;
        this.details = details;
    }
}
