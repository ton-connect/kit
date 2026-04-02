/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Jetton } from '@ton/walletkit';

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

    const img = jetton.info.image;
    return (
        img.url ||
        (img.data ? `data:image/png;base64,${img.data}` : undefined) ||
        img.mediumUrl ||
        img.largeUrl ||
        img.smallUrl ||
        ''
    );
};

export const getFormattedJettonInfo =
    (formatJettonAmount: (balance: string, decimals: number) => string) => (jetton: Jetton) => {
        const jettonName = getJettonsName(jetton);
        const jettonSymbol = getJettonsSymbol(jetton);
        const jettonImage = getJettonsImage(jetton);
        const jettonBalance = jetton.balance || '0';
        const jettonDecimals = jetton.decimalsNumber;
        const formattedBalance = jettonDecimals ? formatJettonAmount(jettonBalance, jettonDecimals) : '0';

        return {
            address: jetton.address,
            walletAddress: jetton.walletAddress,
            description: jetton.info?.description,
            name: jettonName,
            symbol: jettonSymbol,
            image: jettonImage,
            balance: formattedBalance,
            decimals: jettonDecimals,
        };
    };
