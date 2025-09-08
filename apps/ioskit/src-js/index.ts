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