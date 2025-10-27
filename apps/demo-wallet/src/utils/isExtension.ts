/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function isExtension() {
    return import.meta.env.VITE_APP_ENV === 'extension';
}
