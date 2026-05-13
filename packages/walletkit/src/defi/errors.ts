/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Base error thrown by DeFi managers (swap, staking, onramp) when a provider call fails. Subclassed by {@link SwapError} / {@link StakingError} and discriminated at runtime via the `code` field. */
export class DefiError extends Error {
    /** Provider with the requested id is not registered with the manager. */
    static readonly PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND';
    /** No default provider is configured and the caller did not specify one. */
    static readonly NO_DEFAULT_PROVIDER = 'NO_DEFAULT_PROVIDER';
    /** Provider rejected the request because of an upstream/network failure. */
    static readonly NETWORK_ERROR = 'NETWORK_ERROR';
    /** Provider does not support the network selected for the operation. */
    static readonly UNSUPPORTED_NETWORK = 'UNSUPPORTED_NETWORK';
    /** Caller passed parameters that fail provider-level validation. */
    static readonly INVALID_PARAMS = 'INVALID_PARAMS';
    /** Provider failed its own internal validation and cannot be used. */
    static readonly INVALID_PROVIDER = 'INVALID_PROVIDER';

    /** Stable error code for branching logic. One of the static `DefiError.*` constants. */
    public readonly code: string;
    /** Provider-specific extra context (request payload, upstream error, etc.). Shape is not stable. */
    public readonly details?: unknown;

    /**
     * @param message - Human-readable description, forwarded to `Error`.
     * @param code - Stable error code from the `DefiError.*` constants.
     * @param details - Optional provider-specific context for diagnostics.
     */
    constructor(message: string, code: string, details?: unknown) {
        super(message);
        this.name = 'DefiError';
        this.code = code;
        this.details = details;
    }
}
