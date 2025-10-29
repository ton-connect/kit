import { toEvent } from './AccountEvent';
import { loadData } from '../../../data';
import { ToncenterTracesResponse } from './emulation';
import { AddressBook } from './AccountEvent';

const account = 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9';
const addressBook: AddressBook = {
    EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9: 'tolya.ton',
    'EQCLcEJJ4Bj6pZvcNW9GOno0_AIB27-nRBo4e-g-n_-_xDjd': 'pumpanddump.ton',
    EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs: 'usdt-minter.ton',
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
                        isWallet: true,
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
                            isWallet: true,
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
                        isWallet: true, // FIXME must be false
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
                            isWallet: true, // FIXME must be false
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
                            isWallet: true, // FIXME must be false
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
                    sendersWallet: '0:c4072d7b04ab4c504cd223dfde42c8037c6a99272d3624aec2cbff2e72b102dd',
                    recipientsWallet: '0:9f27ad7db6c58cbfe24c03be35766209dca0292bb7e45482f8b5912fa11bf300',
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
                base_transactions: [
                    '0x55a1273fb40df01f189902c8ea0a9f49dbc4b5858a0b3e3d88b67e8bbd8f7fd9',
                    '0x027f35335ad0de2d64a62d6ee066f7c85b42bb26667c1e1c922c45bf7060aece',
                    '0xf61b0d813f307936901292b8e7681b9a44d63825e408efca77e54fd56c68f3a9',
                    '0x33f7326c8a709967f5611a1c88b9f4c52e2ec95fe59b5f09a2bf89162945bb71',
                ],
            },
        ]);
    });
});
