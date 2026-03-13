/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../../types/network';
import type { AppKit } from '../../core/app-kit';
import type { ApiClient } from '../../core/network';

export type GetApiClientReturnType = ApiClient;

export type GetApiClientOptions = { network: Network };

/**
 * Get API client for a network
 */
export const getApiClient = (appKit: AppKit, options: GetApiClientOptions): GetApiClientReturnType => {
    return appKit.networkManager.getClient(options.network);
};
