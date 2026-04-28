/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AddressBookRowV3 } from '../../../types/toncenter/v3/AddressBookRowV3';
import type { EmulationAddressMetadata } from './metadata';

export interface ToncenterResponseJettonMasters {
    jetton_masters: ToncenterJettonWallet[];
    address_book: Record<string, AddressBookRowV3>;
    metadata: Record<string, EmulationAddressMetadata>;
}

export interface ToncenterResponseJettonWallets {
    jetton_wallets: ToncenterJettonWallet[];
    address_book: Record<string, AddressBookRowV3>;
    metadata: Record<string, EmulationAddressMetadata>;
}

export interface ToncenterJettonWallet {
    address: string;
    balance: string;
    owner: string;
    jetton: string;
    last_transaction_lt: string;
    code_hash: string;
    data_hash: string;
}
