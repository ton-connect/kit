/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { PropsWithChildren } from 'react';
import type { AppKit } from '@ton/appkit';
export declare const AppKitContext: import("react").Context<AppKit | undefined>;
export interface AppKitProviderProps extends PropsWithChildren {
    appKit: AppKit;
}
export declare function AppKitProvider({ appKit, children }: AppKitProviderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=app-kit-provider.d.ts.map