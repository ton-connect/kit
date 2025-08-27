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
