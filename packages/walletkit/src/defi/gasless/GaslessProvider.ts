/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GaslessProviderInterface } from '../../api/interfaces';
import type { GaslessConfig, GaslessEstimateParams, GaslessEstimateResult, GaslessSendParams } from '../../api/models';

/**
 * Abstract base class for gasless relay providers.
 *
 * Concrete providers (e.g. TonApiGaslessProvider) implement the three methods
 * below against a specific relayer backend.
 *
 * @example
 * ```typescript
 * class MyGaslessProvider extends GaslessProvider {
 *   readonly providerId = 'my-relayer';
 *
 *   async getConfig(): Promise<GaslessConfig> { ... }
 *   async estimate(params): Promise<GaslessEstimateResult> { ... }
 *   async send(params): Promise<void> { ... }
 * }
 * ```
 */
export abstract class GaslessProvider implements GaslessProviderInterface {
    readonly type = 'gasless';
    abstract readonly providerId: string;

    abstract getConfig(): Promise<GaslessConfig>;
    abstract estimate(params: GaslessEstimateParams): Promise<GaslessEstimateResult>;
    abstract send(params: GaslessSendParams): Promise<void>;
}
