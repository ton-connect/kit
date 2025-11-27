/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { toAddressBook, toEvent } from './AccountEvent';
import { loadData } from '../../../data';
import { ToncenterTracesResponse } from './emulation';

const acc1 = 'UQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3AF4';
const acc2 = 'UQC8G3SPXSa3TYV3mP9N1CUqK3nPUbIyrkG-HxnozZVHt2Iv';

describe('AccountEvent', () => {
    it('contract call', async () => {
        const traces = loadData<ToncenterTracesResponse>('contract-call-traces');
        const addressBook = toAddressBook(traces);
        const actual = toEvent(traces.traces[0], acc1, addressBook);
        expect(actual.actions).toMatchSnapshot();
    });

    it('contract call unknown', async () => {
        const traces = loadData<ToncenterTracesResponse>('contract-call-unknown-traces');
        const addressBook = toAddressBook(traces);
        const actual = toEvent(traces.traces[0], acc1, addressBook);
        expect(actual.actions).toMatchSnapshot();
    });

    it('ft received', async () => {
        const traces = loadData<ToncenterTracesResponse>('ft-received-traces');
        const addressBook = toAddressBook(traces);
        const actual = toEvent(traces.traces[0], acc1, addressBook);
        expect(actual.actions).toMatchSnapshot();
    });

    it('ft sent', async () => {
        const traces = loadData<ToncenterTracesResponse>('ft-sent-traces');
        const addressBook = toAddressBook(traces);
        const actual = toEvent(traces.traces[0], acc1, addressBook);
        expect(actual.actions).toMatchSnapshot();
    });

    it('nft received', async () => {
        const traces = loadData<ToncenterTracesResponse>('nft-received-traces');
        const addressBook = toAddressBook(traces);
        const actual = toEvent(traces.traces[0], acc1, addressBook);
        expect(actual.actions).toMatchSnapshot();
    });

    it('nft sent', async () => {
        const traces = loadData<ToncenterTracesResponse>('nft-sent-traces');
        const addressBook = toAddressBook(traces);
        const actual = toEvent(traces.traces[0], acc1, addressBook);
        expect(actual.actions).toMatchSnapshot();
    });

    it('ton received', async () => {
        const traces = loadData<ToncenterTracesResponse>('ton-received-traces');
        const addressBook = toAddressBook(traces);
        const actual = toEvent(traces.traces[0], acc1, addressBook);
        expect(actual.actions).toMatchSnapshot();
    });

    it('ton sent', async () => {
        const traces = loadData<ToncenterTracesResponse>('ton-sent-traces');
        const addressBook = toAddressBook(traces);
        const actual = toEvent(traces.traces[0], acc1, addressBook);
        expect(actual.actions).toMatchSnapshot();
    });

    it('ton received acc2', async () => {
        const traces = loadData<ToncenterTracesResponse>('ton-received-acc2-traces');
        const addressBook = toAddressBook(traces);
        const actual = toEvent(traces.traces[0], acc2, addressBook);
        expect(actual.actions).toMatchSnapshot();
    });
});
