/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const escapeShellArg = (arg: string): string => {
    // Replace single quotes with escaped version and wrap in single quotes
    return `'${arg.replace(/'/g, "'\\''")}'`;
};
