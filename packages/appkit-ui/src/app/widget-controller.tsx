/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from 'solid-js/web';
import type { Action } from 'src/app/state/modals-state';
import {
    lastSelectedWalletInfo,
    lastVisibleWalletsInfo,
    setAction,
    setLastSelectedWalletInfo,
    setSingleWalletModalState,
    setWalletsModalState,
} from 'src/app/state/modals-state';
import type { TonConnectUI } from 'src/ton-connect-ui';
import type { WalletInfoWithOpenMethod, WalletOpenMethod } from 'src/models/connected-wallet';
import type { WalletsModalCloseReason } from 'src/models';
import type { OptionalTraceable, Traceable, WalletInfoRemote, WalletNotSupportFeatureError } from '@ton/appkit';

import App from './App';

export const widgetController = {
    openWalletsModal: (options?: OptionalTraceable): void =>
        void setTimeout(() =>
            setWalletsModalState((prev) => ({
                status: 'opened',
                traceId: options?.traceId ?? prev?.traceId,
                closeReason: null,
            })),
        ),
    closeWalletsModal: (reason: WalletsModalCloseReason): void =>
        void setTimeout(() =>
            setWalletsModalState({
                status: 'closed',
                closeReason: reason,
            }),
        ),
    openSingleWalletModal: (walletInfo: WalletInfoRemote): void => {
        void setTimeout(() =>
            setSingleWalletModalState({
                status: 'opened',
                closeReason: null,
                walletInfo: walletInfo,
            }),
        );
    },
    closeSingleWalletModal: (reason: WalletsModalCloseReason): void =>
        void setTimeout(() =>
            setSingleWalletModalState({
                status: 'closed',
                closeReason: reason,
            }),
        ),
    openWalletNotSupportFeatureModal: (cause: WalletNotSupportFeatureError['cause'], options: Traceable): void =>
        void setTimeout(() =>
            setWalletsModalState({
                status: 'opened',
                traceId: options.traceId,
                closeReason: null,
                type: 'wallet-not-support-feature',
                requiredFeature: cause.requiredFeature,
            }),
        ),
    setAction: (action: Action): void => void setTimeout(() => setAction(action)),
    clearAction: (): void => void setTimeout(() => setAction(null)),
    getSelectedWalletInfo: ():
        | WalletInfoWithOpenMethod
        | {
              openMethod: WalletOpenMethod;
          }
        | null => lastSelectedWalletInfo(),
    getLastVisibleWallets: () => lastVisibleWalletsInfo(),
    removeSelectedWalletInfo: (): void => setLastSelectedWalletInfo(null),
    renderApp: (root: string, tonConnectUI: TonConnectUI): (() => void) =>
        render(() => <App tonConnectUI={tonConnectUI} />, document.getElementById(root) as HTMLElement),
};
