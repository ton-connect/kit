/**
 * Entry point for Android WalletKit bridge.
 * This file sets up polyfills and loads the bridge, which registers the API on window.walletkitBridge.
 * The bridge bundle does not export anything - all communication happens via window.__walletkitCall.
 */
import { setupPolyfills } from './polyfills/setupPolyfills';

setupPolyfills();

// Import bridge to register API on window.walletkitBridge
import './bridge';
