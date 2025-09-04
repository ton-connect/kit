import { type NftTransferMessage } from '@ton-community/assets-sdk';

export type NftTransferParamsHuman = {
    nftAddress: string;
    transferAmount: bigint;
    toAddress: string;

    comment?: string;
};

export type NftTransferParamsNative = {
    nftAddress: string;
    transferAmount: bigint;

    transferMessage: NftTransferMessage;
};
