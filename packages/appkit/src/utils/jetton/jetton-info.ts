/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Jetton, JettonInfo } from '../../types/jetton';

export const isJettonInfo = (value: unknown): value is JettonInfo => {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.address === 'string' &&
        typeof v.name === 'string' &&
        typeof v.symbol === 'string' &&
        typeof v.description === 'string'
    );
};

export const getJettonsSymbol = (jetton: Jetton): string | undefined => {
    if (!jetton?.info?.symbol) {
        return;
    }

    return jetton.info.symbol;
};

export const getJettonsName = (jetton: Jetton): string | undefined => {
    if (!jetton?.info?.name && !jetton?.info?.symbol) {
        return;
    }

    return jetton.info?.name || jetton.info?.symbol || '';
};

export const getJettonsImage = (jetton: Jetton): string | undefined => {
    if (!jetton?.info?.image) {
        return;
    }

    return (
        jetton.info.image.url ||
        (jetton.info.image.data ? atob(jetton.info.image.data) : undefined) ||
        jetton.info.image.mediumUrl ||
        jetton.info.image.largeUrl ||
        jetton.info.image.smallUrl ||
        ''
    );
};

export const getFormattedJettonInfo = (jetton: Jetton) => {
    const jettonName = getJettonsName(jetton);
    const jettonSymbol = getJettonsSymbol(jetton);
    const jettonImage = getJettonsImage(jetton);
    const jettonBalance = jetton.balance || '0';
    const jettonDecimals = jetton.decimalsNumber;

    return {
        address: jetton.address,
        walletAddress: jetton.walletAddress,
        description: jetton.info?.description,
        name: jettonName,
        symbol: jettonSymbol,
        image: jettonImage,
        imageData: jetton.info?.image?.data,
        balance: jettonBalance,
        decimals: jettonDecimals,
    };
};
