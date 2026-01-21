/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function isClientSide(): boolean {
    return typeof window !== 'undefined';
}

export function isServerSide(): boolean {
    return !isClientSide();
}
