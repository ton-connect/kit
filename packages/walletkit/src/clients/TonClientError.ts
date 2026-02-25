/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export class TonClientError extends Error {
    public readonly status: number;
    public readonly details?: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = 'TonClientError';
        this.status = status;
        this.details = details;
    }
}
