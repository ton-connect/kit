/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { PropsWithChildren, FC } from 'react';
import { createContext } from 'react';
import type { AppKit } from '@ton/appkit';

import { I18nProvider } from './i18n-provider';
import { TonConnectBridge } from '../tonconnect/tonconnect-bridge';

export const AppKitContext = createContext<AppKit | undefined>(undefined);

export interface AppKitProviderProps extends PropsWithChildren {
    appKit: AppKit;
}

export const AppKitProvider: FC<AppKitProviderProps> = ({ appKit, children }) => {
    return (
        <AppKitContext.Provider value={appKit}>
            <TonConnectBridge>
                <I18nProvider>{children}</I18nProvider>
            </TonConnectBridge>
        </AppKitContext.Provider>
    );
};
