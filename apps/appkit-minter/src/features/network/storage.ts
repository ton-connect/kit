/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const STORAGE_KEY = 'appkit-minter:default-network-chain-id';

export const loadStoredNetworkChainId = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

export const saveStoredNetworkChainId = (chainId: string): void => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, chainId);
    } catch {
        // ignore quota / disabled storage
    }
};
