/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Suppress Node.js punycode deprecation (DEP0040).
 * Must be imported first in cli.ts so it runs before tr46 loads (via node-fetch → whatwg-url).
 */
if (process?.emit) {
    const originalEmit = process.emit.bind(process);
    (process as { emit: (e: string, ...a: unknown[]) => boolean }).emit = function (event: string, ...args: unknown[]) {
        const err = args[0] as { name?: string; message?: string } | undefined;
        if (event === 'warning' && err?.name === 'DeprecationWarning' && err?.message?.includes('punycode')) {
            return false;
        }
        return (originalEmit as (...a: unknown[]) => boolean).apply(process, [event, ...args]);
    };
}
