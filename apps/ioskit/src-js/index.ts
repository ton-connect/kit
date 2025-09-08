import textEncoder from './textEncoder';
if (typeof window !== 'undefined') {
    textEncoder(window);
}
if (typeof globalThis !== 'undefined') {
    textEncoder(globalThis);
}
if (typeof global !== 'undefined') {
    textEncoder(global);
}

import('./firstPolyfill');