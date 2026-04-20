/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GaslessConfig, GaslessEstimateParams, GaslessEstimateResult, GaslessSendParams } from '../models';
import type { DefiManagerAPI } from './DefiManagerAPI';
import type { DefiProvider } from './DefiProvider';

/**
 * Gasless API interface exposed by GaslessManager.
 *
 * Gasless lets a dApp submit on-chain transactions without the user paying TON
 * for gas: a relayer co-signs and covers the gas, taking a jetton fee in return.
 */
export interface GaslessAPI extends DefiManagerAPI<GaslessProviderInterface> {
    /**
     * Fetch relayer configuration (supported jettons and relay address).
     * @param providerId Provider identifier (optional, uses default if not specified)
     */
    getConfig(providerId?: string): Promise<GaslessConfig>;

    /**
     * Estimate fees and obtain relayer-wrapped messages for signing.
     *
     * Pass the returned `messages` to `wallet.signMessage` to obtain a signed
     * internal-message BoC, then submit it via `send`.
     *
     * @param params Estimation parameters (wallet identity, fee jetton, messages)
     * @param providerId Provider identifier (optional, uses default if not specified)
     */
    estimate(params: GaslessEstimateParams, providerId?: string): Promise<GaslessEstimateResult>;

    /**
     * Submit a signed transaction BoC to the relayer for on-chain execution.
     *
     * @param params Signed message and wallet public key
     * @param providerId Provider identifier (optional, uses default if not specified)
     */
    send(params: GaslessSendParams, providerId?: string): Promise<void>;
}

/**
 * Interface that all gasless providers must implement.
 */
export interface GaslessProviderInterface extends DefiProvider {
    readonly type: 'gasless';

    /**
     * Unique identifier for the provider
     */
    readonly providerId: string;

    /**
     * Fetch relayer configuration (supported jettons and relay address).
     */
    getConfig(): Promise<GaslessConfig>;

    /**
     * Estimate fees and return relayer-wrapped messages for signing.
     */
    estimate(params: GaslessEstimateParams): Promise<GaslessEstimateResult>;

    /**
     * Submit a signed transaction BoC to the relayer.
     */
    send(params: GaslessSendParams): Promise<void>;
}
