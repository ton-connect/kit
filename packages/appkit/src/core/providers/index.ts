/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export { CustomProvidersManager } from './services/custom-providers-manager';

export * from './types/provider';
export * from './types/custom-provider';

export type {
    BaseProvider,
    ProviderInput,
    ProviderFactory,
    ProviderFactoryContext,
    SwapProviderInterface,
} from '@ton/walletkit';
