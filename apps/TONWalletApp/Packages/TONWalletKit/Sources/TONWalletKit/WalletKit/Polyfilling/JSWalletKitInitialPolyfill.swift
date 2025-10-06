//
//  JSWalletKitInitialPolyfill.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import JavaScriptCore

public class JSWalletKitInitialPolyfill: JSPolyfill {
    
    public func apply(to context: JSContext) {
        context.polyfill(with: JSPBKDF2Polyfill())
        context.polyfill(with: JSSecureRandomBytesPolyfill())
        context.polyfill(with: JSEventSourcePolyfill())
        
        context.evaluateScript("""
            // Create global window object for browser compatibility
            const window = globalThis || this || {};
            
            // Add basic console object
            const console = {
                log: function(...args) {
                    nativeLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                },
                warn: function(...args) { 
                    nativeLog('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); 
                },
                error: function(...args) { 
                    nativeLog('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); 
                },
                info: function(...args) { 
                    nativeLog('[INFO] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); 
                },
                debug: function(...args) { 
                    nativeLog('[DEBUG] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); 
                },
                trace: function(...args) { 
                    nativeTrace(args);
                    // nativeLog('[TRACE] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); 
                }
            };
        
            // Set up crypto polyfill using Swift's secure random
            const crypto = {
                getRandomValues: function(array) {
                    if (!array) {
                        throw new Error('crypto.getRandomValues: array is required');
                    }
                    
                    // Check if it's a typed array
                    if (!(array instanceof Int8Array || array instanceof Uint8Array || 
                          array instanceof Uint8ClampedArray || array instanceof Int16Array || 
                          array instanceof Uint16Array || array instanceof Int32Array || 
                          array instanceof Uint32Array)) {
                        throw new Error('crypto.getRandomValues: argument must be a typed array');
                    }
                    
                    // Get random bytes from Swift
                    const randomBytes = getSecureRandomBytes(array.length);
                    if (!randomBytes) {
                        throw new Error('crypto.getRandomValues: failed to generate random bytes');
                    }
                    
                    // Fill the array with random values
                    for (let i = 0; i < array.length; i++) {
                        array[i] = randomBytes[i];
                    }
                    
                    return array;
                },
                
                // Add randomUUID for completeness (using crypto.getRandomValues)
                randomUUID: function() {
                    const bytes = new Uint8Array(16);
                    this.getRandomValues(bytes);
                    
                    // Set version (4) and variant bits according to RFC 4122
                    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
                    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
                    
                    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
                    return hex.substring(0, 8) + '-' + hex.substring(8, 12) + '-' + 
                           hex.substring(12, 16) + '-' + hex.substring(16, 20) + '-' + 
                           hex.substring(20, 32);
                }
            };
            
            // EventSource polyfill
            
            // Global instance tracker for Swift bridge
            if (!window.eventSourceInstances) {
                window.eventSourceInstances = {};
            }
            
            class EventSource {
                constructor(url, options = {}) {
                    this.url = url;
                    this.readyState = 0; // CONNECTING
                    this.withCredentials = options.withCredentials || false;
                    
                    // Event handlers
                    this.onopen = null;
                    this.onmessage = null;
                    this.onerror = null;
                    
                    // Event listeners
                    this._eventListeners = new Map();
                    
                    // Generate unique ID for this EventSource instance
                    this._id = 'es_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    
                    // Register this instance globally for Swift bridge
                    window.eventSourceInstances[this._id] = this;
                    
                    // Start connection
                    setTimeout(() => this._connect(), 0);
                }
                
                _connect() {
                    try {
                        this.readyState = 0; // CONNECTING
                        const result = nativeEventSourceCreate(this.url, this._id, {
                            withCredentials: this.withCredentials
                        });
                        
                        if (result === 'error') {
                            this._handleError(new Error('Failed to create native EventSource'));
                        }
                    } catch (error) {
                        this._handleError(error);
                    }
                }
                
                close() {
                    if (this.readyState !== 2) { // Not already CLOSED
                        this.readyState = 2; // CLOSED
                        nativeEventSourceClose(this._id);
                        
                        // Clean up global instance tracking
                        if (window.eventSourceInstances && window.eventSourceInstances[this._id]) {
                            delete window.eventSourceInstances[this._id];
                        }
                    }
                }
                
                addEventListener(type, listener, options) {
                    if (typeof listener !== 'function') return;
                    
                    if (!this._eventListeners.has(type)) {
                        this._eventListeners.set(type, []);
                    }
                    this._eventListeners.get(type).push(listener);
                }
                
                removeEventListener(type, listener) {
                    if (!this._eventListeners.has(type)) return;
                    
                    const listeners = this._eventListeners.get(type);
                    const index = listeners.indexOf(listener);
                    if (index !== -1) {
                        listeners.splice(index, 1);
                    }
                }
                
                _dispatchEvent(event) {
                    // Call specific handler
                    if (event.type === 'open' && this.onopen) {
                        this.onopen(event);
                    } else if (event.type === 'message' && this.onmessage) {
                        this.onmessage(event);
                    } else if (event.type === 'error' && this.onerror) {
                        this.onerror(event);
                    }
                    
                    // Call addEventListener listeners
                    if (this._eventListeners.has(event.type)) {
                        const listeners = this._eventListeners.get(event.type);
                        listeners.forEach(listener => {
                            try {
                                listener(event);
                            } catch (e) {
                                console.error('EventSource listener error:', e);
                            }
                        });
                    }
                }
                
                _handleOpen() {
                    this.readyState = 1; // OPEN
                    const event = new CustomEvent('open');
                    this._dispatchEvent(event);
                }
                
                _handleMessage(data, eventType, lastEventId) {
                    const event = new CustomEvent(eventType || 'message');
                    event.data = data;
                    event.lastEventId = lastEventId || '';
                    event.origin = new URL(this.url).origin;
                    this._dispatchEvent(event);
                }
                
                _handleError(error) {
                    this.readyState = 2; // CLOSED
                    const event = new CustomEvent('error');
                    event.error = error;
                    this._dispatchEvent(event);
                }
                
                // Constants
                static get CONNECTING() { return 0; }
                static get OPEN() { return 1; }
                static get CLOSED() { return 2; }
                
                get CONNECTING() { return 0; }
                get OPEN() { return 1; }
                get CLOSED() { return 2; }
            }
            
            // CustomEvent implementation for non-DOM environments
            if (!window.CustomEvent) {
                window.CustomEvent = function(type, options) {
                    options = options || {};
                    this.type = type;
                    this.bubbles = options.bubbles || false;
                    this.cancelable = options.cancelable || false;
                    this.detail = options.detail || null;
                };
            }
            
            // PBKDF2 polyfill using native Swift implementation
            window.Pbkdf2 = {
                derive: function(password, salt, iterations, keySize, hash) {
                    return new Promise(function(resolve, reject) {
                        try {
                            const result = nativePbkdf2Derive(password, salt, iterations, keySize, hash);
                            resolve(Buffer.from(result, 'hex'));
                        } catch (error) {
                            reject(error);
                        }
                    });
                }
            };
                        
            window.console = console;
            window.crypto = crypto;
            globalThis.crypto = crypto;
            window.EventSource = EventSource;
            globalThis.EventSource = EventSource;
            self = {}
            self.crypto = crypto;
            self.EventSource = EventSource;
        """)
    }
}
