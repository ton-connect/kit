/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Entry point for Android WalletKit bridge.
 * This file ensures native polyfills are installed before the bridge code executes.
 * The bridge bundle does not export anything - all communication happens via window.__walletkitCall.
 */
import './polyfills/setupNativeBridge';
import './bridge';
