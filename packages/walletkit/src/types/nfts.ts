/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, Cell } from '@ton/core';

export type NftTransferParamsHuman = {
    nftAddress: string;
    transferAmount: bigint | string;
    toAddress: string;

    comment?: string;
};

export type NftTransferMessageDTO = {
    queryId: bigint | string;
    newOwner: Address | string;
    responseDestination: Address | null | string;
    customPayload: Cell | null | string;
    forwardAmount: bigint | string;
    forwardPayload: Cell | null | string;
};

export type NftTransferParamsRaw = {
    nftAddress: string;
    transferAmount: bigint | string;

    transferMessage: NftTransferMessageDTO;
};
