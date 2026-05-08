/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NetworkAdapters, ProviderInput } from '@ton/walletkit';

import type { ConnectorInput } from '../../../types/connector';
import type { Network } from '../../../types/network';

/**
 * Constructor options for {@link AppKit} — networks, connectors, providers and runtime flags.
 *
 * @public
 * @category Type
 * @section Core
 */
export interface AppKitConfig {
    /** Map of chain id to api-client config; if omitted, AppKit defaults to mainnet only. */
    networks?: NetworkAdapters;

    /** Wallet connectors registered at startup. */
    connectors?: ConnectorInput[];

    /** Default network connectors (e.g. TonConnect) enforce on new connections; `undefined` to allow any. */
    defaultNetwork?: Network;

    /** Defi/onramp providers registered at startup. */
    providers?: ProviderInput[];

    /** Set to `true` to enable server-side rendering support. */
    ssr?: boolean;
}
