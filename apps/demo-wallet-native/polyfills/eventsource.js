/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import RNEventSource from 'react-native-sse';

class EventSourcePolyfill {
    constructor(url, options = {}) {
        const es = new RNEventSource(url, options);

        // Bridge addEventListener to property handlers (onopen, onmessage, etc.)
        // react-native-sse only supports addEventListener, not property handlers
        es.addEventListener('open', (e) => es.onopen?.(e));
        es.addEventListener('message', (e) => es.onmessage?.(e));
        es.addEventListener('error', (e) => es.onerror?.(e));
        es.addEventListener('close', (e) => es.onclose?.(e));

        return es;
    }
}

globalThis.EventSource = EventSourcePolyfill;
