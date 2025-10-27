/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddressFriendly } from '../primitive';
import { AddressMetadata } from './AddressMetadata';

export type NftMetadata = { [key: AddressFriendly]: AddressMetadata };
