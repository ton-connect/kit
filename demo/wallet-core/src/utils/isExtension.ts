/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Checks if the code is running in a browser extension environment
 * (Chrome Extension, Firefox Extension, etc.)
 */
export function isExtension(): boolean {
    // Check if running in React Native
    if (isReactNative()) {
        return false;
    }

    // eslint-disable-next-line no-undef
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        return true;
    }

    // @ts-expect-error check for Firefox extension
    // eslint-disable-next-line no-undef
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.id) {
        return true;
    }

    return false;
}

/**
 * Checks if the code is running in a web browser (not extension, not React Native)
 */
export function isWeb(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && !isExtension() && !isReactNative();
}

/**
 * Checks if the code is running in React Native
 */
export function isReactNative(): boolean {
    return typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
}
