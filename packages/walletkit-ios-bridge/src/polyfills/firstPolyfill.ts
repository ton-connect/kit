/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/order */

// import 'url-polyfill';

import { URL, URLSearchParams } from 'whatwg-url';

import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
    window.URL = URL as any;
    window.URLSearchParams = URLSearchParams as any;
}
if (typeof globalThis !== 'undefined') {
    globalThis.Buffer = Buffer;
    globalThis.URL = URL as any;
    globalThis.URLSearchParams = URLSearchParams as any;
}
if (typeof global !== 'undefined') {
    global.Buffer = Buffer;
    global.URL = URL as any;
    global.URLSearchParams = URLSearchParams as any;
}

// Polyfills for iOS JavaScriptCore

if (typeof window !== 'undefined') {
    // EventTarget polyfill
    if (typeof EventTarget === 'undefined') {
        const EventTargetPolyfill = class EventTarget {
            private _listeners: Map<string, ((event: any) => void)[]> = new Map();

            addEventListener(type: string, listener: any): void {
                if (!this._listeners.has(type)) {
                    this._listeners.set(type, []);
                }
                const actualListener =
                    typeof listener === 'function' ? listener : listener?.handleEvent?.bind(listener);
                if (actualListener) {
                    this._listeners.get(type)!.push(actualListener);
                }
            }

            removeEventListener(type: string, listener: any): void {
                const typeListeners = this._listeners.get(type);
                if (typeListeners) {
                    const actualListener =
                        typeof listener === 'function' ? listener : listener?.handleEvent?.bind(listener);
                    if (actualListener) {
                        const index = typeListeners.indexOf(actualListener);
                        if (index > -1) {
                            typeListeners.splice(index, 1);
                        }
                    }
                }
            }

            dispatchEvent(event: any): boolean {
                const typeListeners = this._listeners.get(event.type);
                if (typeListeners) {
                    typeListeners.forEach((listener) => {
                        try {
                            listener(event);
                        } catch (error) {
                            console.error('Error in event listener:', error);
                        }
                    });
                }
                return true;
            }
        };
        (window as any).EventTarget = EventTargetPolyfill;
        (globalThis as any).EventTarget = EventTargetPolyfill;
    }

    // Event polyfill
    if (typeof Event === 'undefined') {
        const EventPolyfill = class Event {
            type: string;
            bubbles: boolean;
            cancelable: boolean;

            constructor(type: string, eventInit?: { bubbles?: boolean; cancelable?: boolean }) {
                this.type = type;
                this.bubbles = eventInit?.bubbles || false;
                this.cancelable = eventInit?.cancelable || false;
            }
        };
        (window as any).Event = EventPolyfill;
        (globalThis as any).Event = EventPolyfill;
    }

    // CustomEvent polyfill
    if (typeof CustomEvent === 'undefined') {
        const CustomEventPolyfill = class CustomEvent extends (window as any).Event {
            detail: any;

            constructor(type: string, eventInit?: { bubbles?: boolean; cancelable?: boolean; detail?: any }) {
                super(type, eventInit);
                this.detail = eventInit?.detail;
            }
        };
        (window as any).CustomEvent = CustomEventPolyfill;
        (globalThis as any).CustomEvent = CustomEventPolyfill;
    }

    // MessageEvent polyfill
    if (typeof MessageEvent === 'undefined') {
        const MessageEventPolyfill = class MessageEvent extends (window as any).Event {
            data: any;
            source: any;
            origin: string;

            constructor(
                type: string,
                eventInit?: { data?: any; source?: any; origin?: string; bubbles?: boolean; cancelable?: boolean },
            ) {
                super(type, eventInit);
                this.data = eventInit?.data;
                this.source = eventInit?.source;
                this.origin = eventInit?.origin || '';
            }
        };
        (window as any).MessageEvent = MessageEventPolyfill;
        (globalThis as any).MessageEvent = MessageEventPolyfill;
    }

    // MutationObserver polyfill (simplified - iOS doesn't need DOM mutation watching)
    if (typeof MutationObserver === 'undefined') {
        const MutationObserverPolyfill = class MutationObserver {
            constructor(callback: (mutations: any[], observer: MutationObserver) => void) {
                // No-op for iOS
            }

            observe(target: any, options?: any): void {
                // No-op for iOS
            }

            disconnect(): void {
                // No-op for iOS
            }

            takeRecords(): any[] {
                return [];
            }
        };
        (window as any).MutationObserver = MutationObserverPolyfill;
        (globalThis as any).MutationObserver = MutationObserverPolyfill;
    }

    // Node constants polyfill
    if (typeof Node === 'undefined') {
        (window as any).Node = {
            ELEMENT_NODE: 1,
            ATTRIBUTE_NODE: 2,
            TEXT_NODE: 3,
            CDATA_SECTION_NODE: 4,
            ENTITY_REFERENCE_NODE: 5,
            ENTITY_NODE: 6,
            PROCESSING_INSTRUCTION_NODE: 7,
            COMMENT_NODE: 8,
            DOCUMENT_NODE: 9,
            DOCUMENT_TYPE_NODE: 10,
            DOCUMENT_FRAGMENT_NODE: 11,
            NOTATION_NODE: 12,
        };
    }

    // EventTarget methods polyfill
    if (!(window as any).addEventListener) {
        const listeners = new Map<string, ((event: any) => void)[]>();

        (window as any).addEventListener = function (type: string, listener: any) {
            if (!listeners.has(type)) {
                listeners.set(type, []);
            }
            const actualListener = typeof listener === 'function' ? listener : listener?.handleEvent?.bind(listener);
            if (actualListener) {
                listeners.get(type)!.push(actualListener);
            }
        };

        (window as any).removeEventListener = function (type: string, listener: any) {
            const typeListeners = listeners.get(type);
            if (typeListeners) {
                const actualListener =
                    typeof listener === 'function' ? listener : listener?.handleEvent?.bind(listener);
                if (actualListener) {
                    const index = typeListeners.indexOf(actualListener);
                    if (index > -1) {
                        typeListeners.splice(index, 1);
                    }
                }
            }
        };

        (window as any).dispatchEvent = function (event: any) {
            const typeListeners = listeners.get(event.type);
            if (typeListeners) {
                typeListeners.forEach((listener) => {
                    try {
                        listener(event);
                    } catch (error) {
                        console.error('Error in event listener:', error);
                    }
                });
            }
            return true;
        };
    }

    // Additional polyfills commonly needed in iOS
    if (typeof AbortController === 'undefined') {
        (window as any).AbortController = class AbortController {
            signal = {
                aborted: false,
                addEventListener: () => {},
                removeEventListener: () => {},
            };

            abort() {
                this.signal.aborted = true;
            }
        };
    }

    if (typeof crypto === 'undefined' || !(crypto as any).randomUUID) {
        if (typeof crypto === 'undefined') {
            (window as any).crypto = {};
        }

        if (!(crypto as any).randomUUID) {
            (crypto as any).randomUUID = function (): string {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = (Math.random() * 16) | 0;
                    const v = c === 'x' ? r : (r & 0x3) | 0x8;
                    return v.toString(16);
                });
            };
        }
    }

    // Basic DOM polyfills
    if (typeof document === 'undefined') {
        (window as any).document = {
            readyState: 'complete',
            getElementById: () => null,
            addEventListener: (window as any).addEventListener,
            removeEventListener: (window as any).removeEventListener,
            dispatchEvent: (window as any).dispatchEvent,
            querySelectorAll: () => [],
            body: {
                addEventListener: (window as any).addEventListener,
                removeEventListener: (window as any).removeEventListener,
            },
        };

        (window as any).Element = function () {};
        (window as any).Element.prototype.querySelectorAll = () => [];
        (window as any).Element.prototype.addEventListener = () => {};
        (window as any).Element.prototype.removeEventListener = () => {};
    }

    // Location polyfill
    if (!(window as any).location) {
        (window as any).location = {
            href: 'about:blank',
            origin: 'about:blank',
            protocol: 'about:',
            host: '',
            hostname: '',
            port: '',
            pathname: '/blank',
            search: '',
            hash: '',
            assign: function (url: string) {
                this.href = url;
            },
            replace: function (url: string) {
                this.href = url;
            },
            reload: function () {
                // No-op for iOS
            },
            toString: function () {
                return this.href;
            },
        };
    }
}
