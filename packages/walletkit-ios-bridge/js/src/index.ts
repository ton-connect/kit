/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import textEncoder from './textEncoder';
if (typeof window !== 'undefined') {
    textEncoder(window);
}
if (typeof globalThis !== 'undefined') {
    textEncoder(globalThis);
    if (typeof window !== 'undefined') {
        self.fetch = window.fetch;
    }
}
if (typeof global !== 'undefined') {
    textEncoder(global);
    if (typeof window !== 'undefined') {
        self.fetch = window.fetch;
    }
}

if (typeof self !== 'undefined') {
    textEncoder(self);
    if (typeof window !== 'undefined') {
        self.fetch = window.fetch;
    }
}

import('./firstPolyfill');
