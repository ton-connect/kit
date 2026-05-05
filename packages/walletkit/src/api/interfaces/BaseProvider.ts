/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Base interface shared by all provider types.
 */
export interface BaseProvider {
    readonly providerId: string;
    readonly type: string;
}
