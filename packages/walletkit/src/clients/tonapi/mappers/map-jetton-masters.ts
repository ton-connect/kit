/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterResponseJettonMasters } from '../../../types/toncenter/emulation';
import type { TonApiJettonInfo } from '../types/jettons';

export function mapJettonMasters(jettonInfo: TonApiJettonInfo): ToncenterResponseJettonMasters {
    return {
        jetton_masters: [
            {
                address: jettonInfo.metadata.address,
                balance: '0', // Emulated format requirement
                owner: jettonInfo.admin.address,
                jetton: jettonInfo.metadata.address,
                last_transaction_lt: '0',
                code_hash: '',
                data_hash: '',
            },
        ],
        address_book: {}, // Not provided by TonApi jettons info
        metadata: {
            [jettonInfo.metadata.address]: {
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
