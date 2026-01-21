/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReturnStrategy } from 'src/models/return-strategy';

export interface ActionConfiguration {
    /**
     * Configure action modals behavior.
     * @default ['before']
     */
    modals?: ('before' | 'success' | 'error')[] | 'all';

    /**
     * Configure action notifications behavior.
     * @default 'all'
     */
    notifications?: ('before' | 'success' | 'error')[] | 'all';

    /**
     * Specifies return strategy for the deeplink when user signs/declines the request.
     * @default 'back'
     */
    returnStrategy?: ReturnStrategy;

    /**
     * Specifies return url for TWA-TWA connections.
     * This will be applied as a return strategy if dApp is opened as a TWA and user selects TWA wallet (overrides `returnStrategy` if).
     */
    twaReturnUrl?: `${string}://${string}`;

    /**
     * @deprecated Shouldn't be used anymore, SDK will automatically detect return strategy for TWA-TWA connections.
     * Specifies whether the method should redirect user to the connected wallet
     * @default 'ios'
     */
    skipRedirectToWallet?: 'ios' | 'always' | 'never';
}

export type StrictActionConfiguration = {
    [key in keyof Omit<ActionConfiguration, 'twaReturnUrl'>]-?: Exclude<ActionConfiguration[key], 'all'>;
} & { twaReturnUrl: ActionConfiguration['twaReturnUrl'] };
