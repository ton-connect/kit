import { Address, TupleItem } from '@ton/core';

import { ConnectTransactionParamMessage } from '../internal';
import { ToncenterEmulationResponse } from './emulation';
import { FullAccountState, GetResult } from './api';

export interface ApiClient {
    fetchEmulation(
        address: Address | string,
        messages: ConnectTransactionParamMessage[],
        seqno?: number,
    ): Promise<ToncenterEmulationResponse>;
    sendBoc(boc: string | Uint8Array): Promise<string>;
    runGetMethod(
        address: Address | string,
        method: string,
        stack: TupleItem[] = [],
        seqno?: number,
    ): Promise<GetResult>;
    getAccountState(address: Address | string, seqno?: number): Promise<FullAccountState>;
    getBalance(address: Address | string, seqno?: number): Promise<bigint>;
}
