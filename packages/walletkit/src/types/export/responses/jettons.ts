/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddressJetton } from '../../jettons';
import { Pagination } from '../../toncenter/Pagination';
import { AddressBookRowV3 } from '../../toncenter/v3/AddressBookRowV3';

// Toncenter Jetton Wallets API Response Types
export interface ResponseUserJettons {
    jettons: AddressJetton[];
    address_book: Record<string, AddressBookRowV3>;

    pagination: Pagination;
}
