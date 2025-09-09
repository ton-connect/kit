import { Cell } from '@ton/core';

import { ApiClient } from '../types/toncenter/ApiClient';

export type WalletOptions = {
    code: Cell;
    workchain: number;
    client: ApiClient;
};
