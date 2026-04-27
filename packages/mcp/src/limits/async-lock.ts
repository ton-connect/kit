/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export class AsyncLock {
    private tail: Promise<void> = Promise.resolve();

    async runExclusive<T>(fn: () => Promise<T> | T): Promise<T> {
        const previous = this.tail;
        let release: () => void = () => {};
        this.tail = new Promise<void>((resolve) => {
            release = resolve;
        });
        await previous;
        try {
            return await fn();
        } finally {
            release();
        }
    }
}
