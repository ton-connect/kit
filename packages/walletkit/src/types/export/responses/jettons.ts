/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddressJetton } from '../../jettons';
import { EmulationAddressBookEntry } from '../../toncenter/emulation';
import { Pagination } from '../../toncenter/Pagination';

// Toncenter Jetton Wallets API Response Types
export interface ResponseUserJettons {
    jettons: AddressJetton[];
    address_book: Record<string, EmulationAddressBookEntry>;

    pagination: Pagination;
}
