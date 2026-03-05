/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import type { ToncenterResponseJettonMasters } from '../../../types/toncenter/emulation';
import type { TonApiJettonInfo } from '../types/jettons';
import { asAddressFriendly } from '../../../utils/address';
import type { AddressBookRowV3 } from '../../../types/toncenter/v3/AddressBookRowV3';

function toRaw(address: string): string {
    return Address.parse(address).toRawString();
}

export function mapJettonMasters(jettonInfo: TonApiJettonInfo): ToncenterResponseJettonMasters {
    const addressBook: Record<string, AddressBookRowV3> = {};

    const jettonRaw = toRaw(jettonInfo.metadata.address);
    const jettonFriendly = asAddressFriendly(jettonInfo.metadata.address);

    if (jettonInfo.admin) {
        const adminRaw = toRaw(jettonInfo.admin.address);
        const adminFriendly = asAddressFriendly(jettonInfo.admin.address);
        addressBook[adminRaw] = {
            user_friendly: adminFriendly,
            domain: jettonInfo.admin.name ?? null,
            interfaces: [],
        };
    }

    addressBook[jettonRaw] = {
        user_friendly: jettonFriendly,
        domain: null,
        interfaces: ['jetton_master'],
    };

    return {
        jetton_masters: [
            {
                address: jettonRaw,
                balance: '0',
                owner: jettonInfo.admin ? toRaw(jettonInfo.admin.address) : '',
                jetton: jettonRaw,
                last_transaction_lt: '0',
                code_hash: '',
                data_hash: '',
            },
        ],
        address_book: addressBook,
        metadata: {
            [jettonRaw]: {
                is_indexed: true,
                token_info: [
                    {
                        valid: true,
                        type: 'jetton_masters',
                        name: jettonInfo.metadata.name,
                        symbol: jettonInfo.metadata.symbol,
                        description: jettonInfo.metadata.description,
                        image: jettonInfo.metadata.image,
                        extra: {
                            decimals: jettonInfo.metadata.decimals,
                        },
                    },
                ],
            },
        },
    };
}
