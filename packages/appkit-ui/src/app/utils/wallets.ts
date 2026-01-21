/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletInfo } from '@ton/appkit';
import { TonConnect } from '@ton/appkit';
import type { UIWallet } from 'src/models/ui-wallet';
import type { WalletsListConfiguration } from 'src/models';
import { mergeConcat } from 'src/app/utils/array';

export function uiWalletToWalletInfo(uiWallet: UIWallet): WalletInfo {
    if ('jsBridgeKey' in uiWallet) {
        return {
            ...uiWallet,
            injected: TonConnect.isWalletInjected(uiWallet.jsBridgeKey),
            embedded: TonConnect.isInsideWalletBrowser(uiWallet.jsBridgeKey),
        };
    }

    return uiWallet;
}

export function applyWalletsListConfiguration(
    walletsList: WalletInfo[],
    configuration?: WalletsListConfiguration,
): WalletInfo[] {
    if (!configuration) {
        return walletsList;
    }

    if (configuration.includeWallets?.length) {
        walletsList = mergeConcat('name', walletsList, configuration.includeWallets.map(uiWalletToWalletInfo));
    }

    return walletsList;
}

export function supportsDesktop(walletInfo: WalletInfo): boolean {
    return walletInfo.platforms.some((w) => ['macos', 'linux', 'windows'].includes(w));
}

export function supportsMobile(walletInfo: WalletInfo): boolean {
    return walletInfo.platforms.some((w) => ['ios', 'android'].includes(w));
}

export function supportsExtension(walletInfo: WalletInfo): boolean {
    return walletInfo.platforms.some((w) => ['chrome', 'firefox', 'safari'].includes(w));
}

export function eqWalletName(wallet1: { name: string; appName: string }, name?: string): boolean {
    if (!name) {
        return false;
    }

    return wallet1.name.toLowerCase() === name.toLowerCase() || wallet1.appName.toLowerCase() === name.toLowerCase();
}
