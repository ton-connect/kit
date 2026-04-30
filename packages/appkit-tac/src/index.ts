/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export { createTacProvider } from './provider/tac-provider';
export type { TacProvider } from './provider/tac-provider';

export { getTacProvider, type GetTacProviderReturnType } from './actions/get-tac-provider';
export {
    getSmartAccountAddress,
    type GetSmartAccountAddressOptions,
    type GetSmartAccountAddressReturnType,
} from './actions/get-smart-account-address';

export { useSmartAccountAddress, type UseSmartAccountAddressReturnType } from './hooks/use-smart-account-address';
