/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectAdditionalRequest, RequiredFeatures, ITonConnect } from '@ton/appkit';
import { createStore } from 'solid-js/store';
import type { Locales } from 'src/models/locales';
import type { WalletsListConfiguration } from 'src/models/wallets-list-configuration';
import type { ReturnStrategy } from 'src/models/return-strategy';
import type { Loadable } from 'src/models/loadable';

export type AppState = {
    connector: ITonConnect;
    buttonRootId: string | null;
    language: Locales;
    walletsListConfiguration: WalletsListConfiguration | object;
    connectRequestParameters?: Loadable<ConnectAdditionalRequest> | null;
    returnStrategy: ReturnStrategy;
    twaReturnUrl: `${string}://${string}` | undefined;
    preferredWalletAppName: string | undefined;
    enableAndroidBackHandler: boolean;
    walletsRequiredFeatures: RequiredFeatures | undefined;
    walletsPreferredFeatures: RequiredFeatures | undefined;
};

export const [appState, setAppState] = createStore<AppState>({
    buttonRootId: null,
    language: 'en',
    returnStrategy: 'back',
    twaReturnUrl: undefined,
    walletsListConfiguration: {},
    enableAndroidBackHandler: true,
} as AppState);
