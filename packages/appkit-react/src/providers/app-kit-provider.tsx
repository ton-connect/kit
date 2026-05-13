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

/**
 * Props accepted by {@link AppKitProvider}.
 *
 * @public
 * @category Type
 * @section Providers
 */
export interface AppKitProviderProps extends PropsWithChildren {
    /** Runtime instance constructed at app startup; shared across every appkit-react hook and component. */
    appKit: AppKit;
}

/**
 * Top-level React provider that wires AppKit, the TonConnect bridge and i18n into the component tree — wrap your app once near the root so descendant hooks ({@link useAppKit}, {@link useBalance}, …) and components can resolve their context.
 *
 * @sample docs/examples/src/appkit/components/providers#APP_KIT_PROVIDER
 *
 * @public
 * @category Component
 * @section Providers
 */
export const AppKitProvider: FC<AppKitProviderProps> = ({ appKit, children }) => {
    return (
        <AppKitContext.Provider value={appKit}>
            <TonConnectBridge>
                <I18nProvider>{children}</I18nProvider>
            </TonConnectBridge>
        </AppKitContext.Provider>
    );
};
