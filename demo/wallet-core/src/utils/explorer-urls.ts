/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NetworkType } from './network';

const getPrefix = (network: NetworkType): string => {
    if (network === 'testnet') return 'testnet.';
    if (network === 'tetra') return 'tetra.';
    return '';
};

export function getTransactionExplorerUrls(hash: string, network: NetworkType): { tonScan: string; tonViewer: string } {
    const prefix = getPrefix(network);
    const hashClean = hash.startsWith('0x') ? hash.slice(2) : hash;
    return {
        tonScan: `https://${prefix}tonscan.org/tx/${hashClean}`,
        tonViewer: `https://${prefix}tonviewer.com/transaction/${hashClean}`,
    };
}
