/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../../api/models';
import type { AddressMetadata } from './AddressMetadata';

export type NftMetadata = { [key: UserFriendlyAddress]: AddressMetadata };
