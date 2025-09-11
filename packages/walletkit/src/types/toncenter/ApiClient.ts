import { Address, TupleItem } from '@ton/core';

import type { ConnectTransactionParamMessage } from '../internal';
import type { ToncenterEmulationResponse } from './emulation';
import type { FullAccountState, GetResult } from './api';
import type { NftItemsByOwnerRequest, NftItemsRequest } from '../../core/ApiClientToncenter';
import type { NftItemsResponse } from './NftItemsResponse';

export interface ApiClient {
    nftItemsByAddress(request: NftItemsRequest): Promise<NftItemsResponse>;
    nftItemsByOwner(request: NftItemsByOwnerRequest): Promise<NftItemsResponse>;
    fetchEmulation(
        address: Address | string,
        messages: ConnectTransactionParamMessage[],
        seqno?: number,
    ): Promise<ToncenterEmulationResponse>;
    sendBoc(boc: string | Uint8Array): Promise<string>;
    runGetMethod(address: Address | string, method: string, stack?: TupleItem[], seqno?: number): Promise<GetResult>;
    getAccountState(address: Address | string, seqno?: number): Promise<FullAccountState>;
    getBalance(address: Address | string, seqno?: number): Promise<bigint>;
}
