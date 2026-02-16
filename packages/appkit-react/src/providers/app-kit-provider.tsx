/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { PropsWithChildren } from 'react';
import { createContext } from 'react';
import type { AppKit } from '@ton/appkit';

import { I18nProvider } from './i18n-provider';

export const AppKitContext = createContext<AppKit | undefined>(undefined);

export interface AppKitProviderProps extends PropsWithChildren {
    appKit: AppKit;
}

export function AppKitProvider({ appKit, children }: AppKitProviderProps) {
    return (
        <AppKitContext.Provider value={appKit}>
            <I18nProvider>{children}</I18nProvider>
        </AppKitContext.Provider>
    );
}
