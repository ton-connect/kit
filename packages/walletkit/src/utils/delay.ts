/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) =>
        setTimeout(() => {
            resolve();
        }, ms),
    );
}
