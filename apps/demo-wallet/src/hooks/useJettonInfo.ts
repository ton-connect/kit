/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from 'react';
import type { Address } from '@ton/core';
import type { JettonInfo } from '@ton/walletkit';
import { getChainNetwork, useWalletKit, useWalletStore } from '@demo/wallet-core';
import type { NetworkType } from '@demo/wallet-core';

import { normalizeAddress } from '../utils/formatters';

export type TokenInfo = Partial<Omit<JettonInfo, 'decimals'>> & {
    decimals?: number;
};

export const TON_INFO: TokenInfo = {
    name: 'TON',
    symbol: 'TON',
    decimals: 9,
    image: '/ton.svg',
};

export function useActiveWalletNetwork(): NetworkType {
    const savedWallets = useWalletStore((state) => state.walletManagement.savedWallets);
    const activeWalletId = useWalletStore((state) => state.walletManagement.activeWalletId);
    const activeWallet = savedWallets.find((w) => w.id === activeWalletId);
    return activeWallet?.network || 'testnet';
}

export function resolveTokenAddress(tokenAddress: Address | string | undefined) {
    if (!tokenAddress) return null;
    if (typeof tokenAddress === 'string') {
        return normalizeAddress(tokenAddress) ?? tokenAddress;
    }
    return tokenAddress;
}

export function useJettonInfo(tokenAddress: Address | string | null | undefined) {
    const walletKit = useWalletKit();
    const network = useActiveWalletNetwork();
    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
    const chainNetwork = getChainNetwork(network);

    useEffect(() => {
        if (!tokenAddress) {
            setTokenInfo(null);
            return;
        }

        async function updateTokenInfo() {
            if (!tokenAddress) return;
            const info = await walletKit?.jettons?.getJettonInfo(tokenAddress.toString(), chainNetwork);
            setTokenInfo(info ?? null);
        }

        updateTokenInfo();
    }, [tokenAddress, walletKit, chainNetwork]);

    return tokenInfo;
}
