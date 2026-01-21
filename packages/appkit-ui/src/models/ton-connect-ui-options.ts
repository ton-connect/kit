/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Locales } from 'src/models/locales';
import type { UIPreferences } from 'src/models/ui-preferences';
import type { WalletsListConfiguration } from 'src/models/wallets-list-configuration';
import type { ActionConfiguration } from 'src/models/action-configuration';
import type { RequiredFeatures } from '@ton/appkit';

export interface TonConnectUiOptions {
    /**
     * UI elements configuration.
     */
    uiPreferences?: UIPreferences;

    /**
     * HTML element id to attach the wallet connect button. If not passed button won't appear.
     * @default null.
     */
    buttonRootId?: string | null;

    /**
     * Language for the phrases it the UI elements.
     * @default system
     */
    language?: Locales;

    /**
     * Configuration for the wallets list in the connect wallet modal.
     */
    walletsListConfiguration?: WalletsListConfiguration;

    /**
     * Required features for wallets. If wallet doesn't support required features, it will be disabled.
     */
    walletsRequiredFeatures?: RequiredFeatures;

    /**
     * Preferred features for wallets. If wallet doesn't support preferred features, it will be moved to the end of the list.
     */
    walletsPreferredFeatures?: RequiredFeatures;

    /**
     * Configuration for action-period (e.g. sendTransaction) UI elements: modals and notifications and wallet behaviour (return strategy).
     */
    actionsConfiguration?: ActionConfiguration;

    /**
     * Specifies whether the Android back button should be used to close modals and notifications on Android devices.
     * @default true
     */
    enableAndroidBackHandler?: boolean;
}
