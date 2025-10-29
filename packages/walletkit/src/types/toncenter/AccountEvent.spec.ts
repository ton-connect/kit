import { toEvent } from './AccountEvent';
import { loadData } from '../../../data';
import { ToncenterTracesResponse } from './emulation';
import { AddressBook } from './AccountEvent';

const account = 'EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9';
const addressBook: AddressBook = {
    EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9: 'tolya.ton',
    'EQCLcEJJ4Bj6pZvcNW9GOno0_AIB27-nRBo4e-g-n_-_xDjd': 'pumpanddump.ton',
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
});
