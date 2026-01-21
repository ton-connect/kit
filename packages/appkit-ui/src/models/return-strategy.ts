/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Specifies return strategy for the deeplink when user signs/declines the request.
 * [See details]{@link https://github.com/ton-connect/docs/blob/main/bridge.md#universal-link}.
 */
export type ReturnStrategy = 'back' | 'none' | `${string}://${string}`;
