export interface AccountState {
    balance: bigint;
    extra_currencies:
        | {
              '@type': 'extraCurrency';
              id: number;
              amount: string;
          }[]
        | undefined;
    state: 'active' | 'uninitialized' | 'frozen';
    code: Buffer | null;
    data: Buffer | null;
    lastTransaction: {
        lt: string;
        hash: string;
    } | null;
    blockId: {
        workchain: number;
        shard: string;
        seqno: number;
    };
    timeStampt: number;
}
