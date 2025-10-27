/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Buffer } from 'buffer';
// console.log('window', typeof window, typeof globalThis, typeof global);
if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
}
if (typeof globalThis !== 'undefined') {
    globalThis.Buffer = Buffer;
}
if (typeof global !== 'undefined') {
    global.Buffer = Buffer;
}

import('./background_main');
