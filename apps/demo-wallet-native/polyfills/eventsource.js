/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const RNEventSourceModule = require('react-native-sse');
const RNEventSource =
    RNEventSourceModule && RNEventSourceModule.default ? RNEventSourceModule.default : RNEventSourceModule;

// Utility functions
const logInfo = (...args) => {
    try {
        // eslint-disable-next-line no-console
        console.log('[EventSource]', ...args);
    } catch {
        //
    }
};

/**
 * EventSource wrapper with default headers and logging
 */
class EventSourceWithDefaults {
    constructor(url, options = {}) {
        const defaultHeaders = {
            Accept: 'text/event-stream',
        };

        const merged = {
            ...options,
            headers: { ...(options.headers || {}), ...defaultHeaders },
        };

        const es = new RNEventSource(url, merged);

        try {
            this.setupEventHandlers(es);
        } catch (e) {
            logInfo('Error setting up event handlers:', e?.message || 'unknown');
        }

        return es;
    }

    setupEventHandlers(es) {
        // Patch property handlers
        const originalOnOpen = es.onopen;
        const originalOnMessage = es.onmessage;
        const originalOnError = es.onerror;

        es.onopen = function (evt) {
            if (typeof originalOnOpen === 'function') {
                try {
                    originalOnOpen.call(es, evt);
                } catch (e) {
                    logInfo('Error in onopen handler:', e?.message || 'unknown');
                }
            }
        };

        es.onmessage = function (evt) {
            if (typeof originalOnMessage === 'function') {
                try {
                    originalOnMessage.call(es, evt);
                } catch (e) {
                    logInfo('Error in onmessage handler:', e?.message || 'unknown');
                }
            }
        };

        es.onerror = function (evt) {
            if (typeof originalOnError === 'function') {
                try {
                    originalOnError.call(es, evt);
                } catch (e) {
                    logInfo('Error in onerror handler:', e?.message || 'unknown');
                }
            }
        };

        // Add event listeners with logging
        if (es.addEventListener) {
            es.addEventListener('open', (e) => {
                if (es.onopen) es.onopen(e);
            });

            es.addEventListener('message', (evt) => {
                if (es.onmessage) es.onmessage(evt);
            });

            es.addEventListener('error', (evt) => {
                if (es.onerror) es.onerror(evt);
            });

            es.addEventListener('close', (e) => {
                if (es.onclose) es.onclose(e);
            });
        }
    }
}

// Install polyfill if EventSource is not available
if (typeof globalThis !== 'undefined' && !globalThis.EventSource) {
    globalThis.EventSource = EventSourceWithDefaults;
    logInfo('EventSource polyfill installed');
}

module.exports = EventSourceWithDefaults;
