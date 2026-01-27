/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export class DefiManagerError extends Error {
    static readonly PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND';
    static readonly NO_DEFAULT_PROVIDER = 'NO_DEFAULT_PROVIDER';
    static readonly NETWORK_ERROR = 'NETWORK_ERROR';
    static readonly INVALID_PARAMS = 'INVALID_PARAMS';

    public readonly code: string;
    public readonly details?: unknown;

    constructor(message: string, code: string, details?: unknown) {
        super(message);
        this.name = 'DefiManagerError';
        this.code = code;
        this.details = details;
    }
}
