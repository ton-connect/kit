/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Buffer } from 'buffer';

declare global {
    interface Window {
        global: typeof globalThis;
        Buffer: typeof Buffer;
    }
}

window.global = window;
window.Buffer = Buffer;
