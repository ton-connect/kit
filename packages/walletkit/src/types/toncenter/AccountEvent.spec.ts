/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { toEvent } from './AccountEvent';
import { loadData } from '../../../data';
import { ToncenterTracesResponse } from './emulation';
import { AddressBook } from './AccountEvent';

const account = 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9';
const addressBook: AddressBook = {
    EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9: {
        domain: 'tolya.ton',
        isScam: false,
        isWallet: true,
    },
    'EQCLcEJJ4Bj6pZvcNW9GOno0_AIB27-nRBo4e-g-n_-_xDjd': {
        domain: 'pumpanddump.ton',
        isScam: false,
        isWallet: true,
    },
    EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs: {
        domain: 'usdt-minter.ton',
        isScam: false,
        isWallet: false,
    },
    EQAOevdCKKtPvNCvVd1M8rqLcYERrMSY39jou5U_gQdXwCne: {
        domain: 'usdt-minter.ton',
        isScam: false,
        isWallet: false,
    },
};

describe('AccountEvent', () => {
    it('ton sent', async () => {
        const traces = loadData<ToncenterTracesResponse>('ton-sent-traces');
        const actual = toEvent(traces.traces[0], account, addressBook);
        expect(actual.actions).toEqual([
            {
                id: '0xf5079a2225e581ff140fd6e8963c5ba1cd795ea7da2761165cb7c7f786a9a847',
                type: 'TonTransfer',
                status: 'success',
                TonTransfer: {
                    sender: {
                        address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                        name: 'tolya.ton',
                        isScam: false,
                        isWallet: true,
                    },
                    recipient: {
                        address: 'EQBONmT67oFPvbbByzbXK6xS0V4YbBHs1mT-Gz8afP2AHYFo',
                        isScam: false,
                        isWallet: true,
                    },
                    amount: 1000000000n,
                },
                simplePreview: {
                    name: 'Ton Transfer',
                    description: 'Transferring 1 TON',
                    value: '1 TON',
                    accounts: [
                        {
                            address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                            name: 'tolya.ton',
                            isScam: false,
                            isWallet: true,
                        },
                        {
                            address: 'EQBONmT67oFPvbbByzbXK6xS0V4YbBHs1mT-Gz8afP2AHYFo',
                            isScam: false,
                            isWallet: true,
                        },
                    ],
                },
                baseTransactions: ['0xf5079a2225e581ff140fd6e8963c5ba1cd795ea7da2761165cb7c7f786a9a847'],
            },
        ]);
    });

    it('ton received', async () => {
        const traces = loadData<ToncenterTracesResponse>('ton-received-traces');
        const actual = toEvent(traces.traces[0], account, addressBook);
        expect(actual.actions).toEqual([
            {
                id: '0xb4ceb391908f1f57d019aafc268083143d340fecd1b6c6c50d4b0261d0c5303d',
                type: 'TonTransfer',
                status: 'success',
                TonTransfer: {
                    sender: {
                        address: 'EQCLcEJJ4Bj6pZvcNW9GOno0_AIB27-nRBo4e-g-n_-_xDjd',
                        name: 'pumpanddump.ton',
                        isScam: false,
                        isWallet: true,
                    },
                    recipient: {
                        address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                        name: 'tolya.ton',
                        isScam: false,
                        isWallet: true,
                    },
                    amount: 250000000n,
                    comment: 'На покупку Dust',
                },
                simplePreview: {
                    name: 'Ton Transfer',
                    description: 'Transferring 0.25 TON',
                    value: '0.25 TON',
                    accounts: [
                        {
                            address: 'EQCLcEJJ4Bj6pZvcNW9GOno0_AIB27-nRBo4e-g-n_-_xDjd',
                            name: 'pumpanddump.ton',
                            isScam: false,
                            isWallet: true,
                        },
                        {
                            address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                            name: 'tolya.ton',
                            isScam: false,
                            isWallet: true,
                        },
                    ],
                },
                baseTransactions: ['0xb4ceb391908f1f57d019aafc268083143d340fecd1b6c6c50d4b0261d0c5303d'],
            },
        ]);
    });

    it('contract call', async () => {
        const traces = loadData<ToncenterTracesResponse>('contract-call-traces');
        const actual = toEvent(traces.traces[0], account, addressBook);
        expect(actual.actions).toEqual([
            {
                id: '0xed0059d3002e0a3738c8d874a98c6cab6647dc055ff904717335f74e21c427cf',
                TonTransfer: {
                    amount: 90000000n,
                    comment: undefined,
                    recipient: {
                        address: 'EQAOevdCKKtPvNCvVd1M8rqLcYERrMSY39jou5U_gQdXwCne',
                        isScam: false,
                        isWallet: false,
                        name: 'usdt-minter.ton',
                    },
                    sender: {
                        address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                        isScam: false,
                        isWallet: true,
                        name: 'tolya.ton',
                    },
                },
                baseTransactions: ['0xed0059d3002e0a3738c8d874a98c6cab6647dc055ff904717335f74e21c427cf'],
                simplePreview: {
                    accounts: [
                        {
                            address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                            isScam: false,
                            isWallet: true,
                            name: 'tolya.ton',
                        },
                        {
                            address: 'EQAOevdCKKtPvNCvVd1M8rqLcYERrMSY39jou5U_gQdXwCne',
                            isScam: false,
                            isWallet: false,
                            name: 'usdt-minter.ton',
                        },
                    ],
                    description: 'Transferring 0.09 TON',
                    name: 'Ton Transfer',
                    value: '0.09 TON',
                },
                status: 'success',
                type: 'TonTransfer',
            },
            {
                id: '0xed0059d3002e0a3738c8d874a98c6cab6647dc055ff904717335f74e21c427cf',
                type: 'SmartContractExec',
                status: 'success',
                SmartContractExec: {
                    executor: {
                        address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                        name: 'tolya.ton',
                        isScam: false,
                        isWallet: true,
                    },
                    contract: {
                        address: 'EQAOevdCKKtPvNCvVd1M8rqLcYERrMSY39jou5U_gQdXwCne',
                        isScam: false,
                        isWallet: false,
                        name: 'usdt-minter.ton',
                    },
                    tonAttached: 90000000n,
                    operation: '0x3dc680ae',
                    payload: '',
                },
                simplePreview: {
                    name: 'Smart Contract Execution',
                    description: 'Execution of smart contract',
                    value: '0.09 TON',
                    accounts: [
                        {
                            address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                            name: 'tolya.ton',
                            isScam: false,
                            isWallet: true,
                        },
                        {
                            address: 'EQAOevdCKKtPvNCvVd1M8rqLcYERrMSY39jou5U_gQdXwCne',
                            isScam: false,
                            isWallet: false,
                            name: 'usdt-minter.ton',
                        },
                    ],
                },
                baseTransactions: ['0xdd3fd249b31515b60d4ff242820e7eda0ceca49d7a42a2c874ac31dcfb43cb9c'],
            },
            {
                id: '0xdd3fd249b31515b60d4ff242820e7eda0ceca49d7a42a2c874ac31dcfb43cb9c',
                type: 'ContractDeploy',
                status: 'success',
                ContractDeploy: {
                    address: 'EQAOevdCKKtPvNCvVd1M8rqLcYERrMSY39jou5U_gQdXwCne',
                    interfaces: [],
                },
                simplePreview: {
                    name: 'Contract Deploy',
                    description: 'Deploying a contract',
                    value: '',
                    accounts: [
                        {
                            address: 'EQAOevdCKKtPvNCvVd1M8rqLcYERrMSY39jou5U_gQdXwCne',
                            isScam: false,
                            isWallet: false,
                            name: 'usdt-minter.ton',
                        },
                    ],
                },
                baseTransactions: ['0xdd3fd249b31515b60d4ff242820e7eda0ceca49d7a42a2c874ac31dcfb43cb9c'],
            },
        ]);
    });

    it('ft sent', async () => {
        const traces = loadData<ToncenterTracesResponse>('ft-sent-traces');
        const actual = toEvent(traces.traces[0], account, addressBook);
        expect(actual.actions).toEqual([
            {
                id: '0x8d213f8019c3819383f171ba9d6618be1a314164083302354bff2fc91245bb80',
                type: 'JettonTransfer',
                status: 'success',
                JettonTransfer: {
                    sender: {
                        address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                        name: 'tolya.ton',
                        isScam: false,
                        isWallet: true,
                    },
                    recipient: {
                        address: 'EQBONmT67oFPvbbByzbXK6xS0V4YbBHs1mT-Gz8afP2AHYFo',
                        isScam: false,
                        isWallet: true,
                    },
                    sendersWallet: 'EQDEBy17BKtMUEzSI9_eQsgDfGqZJy02JK7Cy_8ucrEC3Xiq',
                    recipientsWallet: 'EQCfJ619tsWMv-JMA741dmIJ3KApK7fkVIL4tZEvoRvzAGpu',
                    amount: 1000000n,
                    comment: 'Hello!',
                    jetton: {
                        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                        name: 'Tether USD',
                        symbol: 'USD₮',
                        decimals: 6,
                        image: 'https://cache.tonapi.io/imgproxy/T3PB4s7oprNVaJkwqbGg54nexKE0zzKhcrPv8jcWYzU/rs:fill:200:200:1/g:no/aHR0cHM6Ly90ZXRoZXIudG8vaW1hZ2VzL2xvZ29DaXJjbGUucG5n.webp',
                        verification: 'whitelist',
                        score: 100,
                    },
                },
                simplePreview: {
                    name: 'Jetton Transfer',
                    description: 'Transferring 1 USD₮',
                    value: '1 USD₮',
                    valueImage:
                        'https://cache.tonapi.io/imgproxy/T3PB4s7oprNVaJkwqbGg54nexKE0zzKhcrPv8jcWYzU/rs:fill:200:200:1/g:no/aHR0cHM6Ly90ZXRoZXIudG8vaW1hZ2VzL2xvZ29DaXJjbGUucG5n.webp',
                    accounts: [
                        {
                            address: 'EQBONmT67oFPvbbByzbXK6xS0V4YbBHs1mT-Gz8afP2AHYFo',
                            isScam: false,
                            isWallet: true,
                        },
                        {
                            address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                            name: 'tolya.ton',
                            isScam: false,
                            isWallet: true,
                        },
                        {
                            address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                            name: 'usdt-minter.ton',
                            isScam: false,
                            isWallet: false,
                        },
                    ],
                },
                baseTransactions: [
                    '0xf61b0d813f307936901292b8e7681b9a44d63825e408efca77e54fd56c68f3a9',
                    '0x027f35335ad0de2d64a62d6ee066f7c85b42bb26667c1e1c922c45bf7060aece',
                    '0x55a1273fb40df01f189902c8ea0a9f49dbc4b5858a0b3e3d88b67e8bbd8f7fd9',
                ],
            },
        ]);
    });

    it('ft received', async () => {
        const traces = loadData<ToncenterTracesResponse>('ft-received-traces');
        const actual = toEvent(traces.traces[0], account, addressBook);
        expect(actual.actions).toEqual([
            {
                id: '0x63ca0d794bd993043441e0a58108b9004c7bfda04844cb534f1423eebf80173f',
                type: 'JettonTransfer',
                status: 'success',
                JettonTransfer: {
                    sender: {
                        address: 'EQBONmT67oFPvbbByzbXK6xS0V4YbBHs1mT-Gz8afP2AHYFo',
                        isScam: false,
                        isWallet: true,
                    },
                    recipient: {
                        address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                        name: 'tolya.ton',
                        isScam: false,
                        isWallet: true,
                    },
                    sendersWallet: 'EQCfJ619tsWMv-JMA741dmIJ3KApK7fkVIL4tZEvoRvzAGpu',
                    recipientsWallet: 'EQDEBy17BKtMUEzSI9_eQsgDfGqZJy02JK7Cy_8ucrEC3Xiq',
                    amount: 3000000n,
                    jetton: {
                        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                        name: 'Tether USD',
                        symbol: 'USD₮',
                        decimals: 6,
                        image: 'https://cache.tonapi.io/imgproxy/T3PB4s7oprNVaJkwqbGg54nexKE0zzKhcrPv8jcWYzU/rs:fill:200:200:1/g:no/aHR0cHM6Ly90ZXRoZXIudG8vaW1hZ2VzL2xvZ29DaXJjbGUucG5n.webp',
                        verification: 'whitelist',
                        score: 100,
                    },
                },
                simplePreview: {
                    name: 'Jetton Transfer',
                    description: 'Transferring 3 USD₮',
                    value: '3 USD₮',
                    valueImage:
                        'https://cache.tonapi.io/imgproxy/T3PB4s7oprNVaJkwqbGg54nexKE0zzKhcrPv8jcWYzU/rs:fill:200:200:1/g:no/aHR0cHM6Ly90ZXRoZXIudG8vaW1hZ2VzL2xvZ29DaXJjbGUucG5n.webp',
                    accounts: [
                        {
                            address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                            name: 'tolya.ton',
                            isScam: false,
                            isWallet: true,
                        },
                        {
                            address: 'EQBONmT67oFPvbbByzbXK6xS0V4YbBHs1mT-Gz8afP2AHYFo',
                            isScam: false,
                            isWallet: true,
                        },
                        {
                            address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                            name: 'usdt-minter.ton',
                            isScam: false,
                            isWallet: false,
                        },
                    ],
                },
                baseTransactions: [
                    '0x63ca0d794bd993043441e0a58108b9004c7bfda04844cb534f1423eebf80173f',
                    '0x37927129a79cdc7461aaeb302f4e60858744aa4b779ee94e97e2de848d5feac2',
                    '0x1f749e3135d21971ad64978a1b5964ad50ea798d174c5a3febab06842af79c14',
                    '0x7e56951504c267cff862abec672eaa4c9b92188422c51b22e45c9653f8254675',
                ],
            },
        ]);
    });

    it('nft sent', async () => {
        const traces = loadData<ToncenterTracesResponse>('nft-sent-traces');
        const actual = toEvent(traces.traces[0], account, addressBook);
        expect(actual.actions).toEqual([
            {
                type: 'NftItemTransfer',
                status: 'success',
                NftItemTransfer: {
                    sender: {
                        address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                        name: 'tolya.ton',
                        isScam: false,
                        isWallet: true,
                    },
                    recipient: {
                        address: 'EQBONmT67oFPvbbByzbXK6xS0V4YbBHs1mT-Gz8afP2AHYFo',
                        isScam: false,
                        isWallet: true,
                    },
                    nft: 'EQDKDP1Rn3YxArW-ydnjr0NZLqNi-3c_oxnqCcTxYsFx4IUQ',
                },
                simplePreview: {
                    name: 'NFT Transfer',
                    description: 'Transferring 1 NFT',
                    value: '1 NFT',
                    accounts: [
                        {
                            address: 'EQBONmT67oFPvbbByzbXK6xS0V4YbBHs1mT-Gz8afP2AHYFo',
                            isScam: false,
                            isWallet: true,
                        },
                        {
                            address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                            name: 'tolya.ton',
                            isScam: false,
                            isWallet: true,
                        },
                        {
                            address: 'EQDKDP1Rn3YxArW-ydnjr0NZLqNi-3c_oxnqCcTxYsFx4IUQ',
                            isScam: false,
                            isWallet: false,
                        },
                    ],
                },
                baseTransactions: [
                    '0xa9fbb77b9dea075b459d883d95bf315bda384c71dbe2c4fd38f537fe0531b406',
                    '0x94ca23cd5e1ebea0ec17d818136d38bc6503c8427722c7a7ee277c77bf5adaaf',
                    '0x77dd11723edd46d6dfcbc2ebbb1be915e0851225d9c7d6656a9a917c22460c0c',
                ],
            },
        ]);
    });

    it('nft received', async () => {
        const traces = loadData<ToncenterTracesResponse>('nft-received-traces');
        const actual = toEvent(traces.traces[0], account, addressBook);
        expect(actual.actions).toEqual([
            {
                type: 'NftItemTransfer',
                status: 'success',
                NftItemTransfer: {
                    sender: {
                        address: 'EQBONmT67oFPvbbByzbXK6xS0V4YbBHs1mT-Gz8afP2AHYFo',
                        isScam: false,
                        isWallet: true,
                    },
                    recipient: {
                        address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                        name: 'tolya.ton',
                        isScam: false,
                        isWallet: true,
                    },
                    nft: 'EQDKDP1Rn3YxArW-ydnjr0NZLqNi-3c_oxnqCcTxYsFx4IUQ',
                },
                simplePreview: {
                    name: 'NFT Transfer',
                    description: 'Transferring 1 NFT',
                    value: '1 NFT',
                    accounts: [
                        {
                            address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                            name: 'tolya.ton',
                            isScam: false,
                            isWallet: true,
                        },
                        {
                            address: 'EQBONmT67oFPvbbByzbXK6xS0V4YbBHs1mT-Gz8afP2AHYFo',
                            isScam: false,
                            isWallet: true,
                        },
                        {
                            address: 'EQDKDP1Rn3YxArW-ydnjr0NZLqNi-3c_oxnqCcTxYsFx4IUQ',
                            isScam: false,
                            isWallet: false,
                        },
                    ],
                },
                baseTransactions: [
                    '0x05075fa2c6675d1f8a0c2ac1491d299cd52f0935d90d76658bcdfdf1caf47f10',
                    '0x37c6c0484dcc0737cbea4f6dbf35200b91109f3afc5514caffe15c219b3391ab',
                    '0x58f830603b332a711f6e5d883101f20c87e54f57b9d9ae10e8d1cd2abbb852ea',
                ],
            },
        ]);
    });

    it('contract call unknown', async () => {
        const traces = loadData<ToncenterTracesResponse>('contract-call-unknown-traces');
        const actual = toEvent(traces.traces[0], account, addressBook);
        expect(actual.actions).toEqual([
            {
                TonTransfer: {
                    amount: 15000000n,
                    recipient: {
                        address: 'EQB43-VCmf17O7YMd51fAvOjcMkCw46N_3JMCoegH_ZDo40e',
                        isScam: false,
                        isWallet: true,
                    },
                    sender: {
                        address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                        isScam: false,
                        isWallet: true,
                        name: 'tolya.ton',
                    },
                },
                baseTransactions: ['0xb142f5e55f70cfc21ea19dd43727e675109327d63a0ed8486f30b9143c8a8b34'],
                id: '0xb142f5e55f70cfc21ea19dd43727e675109327d63a0ed8486f30b9143c8a8b34',
                simplePreview: {
                    accounts: [
                        {
                            address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                            isScam: false,
                            isWallet: true,
                            name: 'tolya.ton',
                        },
                        {
                            address: 'EQB43-VCmf17O7YMd51fAvOjcMkCw46N_3JMCoegH_ZDo40e',
                            isScam: false,
                            isWallet: true,
                        },
                    ],
                    description: 'Transferring 0.015 TON',
                    name: 'Ton Transfer',
                    value: '0.015 TON',
                },
                status: 'success',
                type: 'TonTransfer',
            },
            {
                SmartContractExec: {
                    contract: {
                        address: 'EQB43-VCmf17O7YMd51fAvOjcMkCw46N_3JMCoegH_ZDo40e',
                        isScam: false,
                        isWallet: false,
                    },
                    executor: {
                        address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                        isScam: false,
                        isWallet: true,
                        name: 'tolya.ton',
                    },
                    operation: '0x4eb1f0f9',
                    payload: '',
                    tonAttached: 15000000n,
                },
                baseTransactions: ['0x4405d2add96306dc732867de45621b3d67bbd04682b1c36be01361106e4c25c1'],
                id: '0xb142f5e55f70cfc21ea19dd43727e675109327d63a0ed8486f30b9143c8a8b34',
                simplePreview: {
                    accounts: [
                        {
                            address: 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9',
                            isScam: false,
                            isWallet: true,
                            name: 'tolya.ton',
                        },
                        {
                            address: 'EQB43-VCmf17O7YMd51fAvOjcMkCw46N_3JMCoegH_ZDo40e',
                            isScam: false,
                            isWallet: false,
                        },
                    ],
                    description: 'Execution of smart contract',
                    name: 'Smart Contract Execution',
                    value: '0.015 TON',
                },
                status: 'success',
                type: 'SmartContractExec',
            },
        ]);
    });
});
