/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MasterchainInfo } from '../../../api/models';
import type { TonApiMasterchainHeadResponse } from '../types/masterchain';
import { asHex } from '../../../utils/hex';

export function mapMasterchainInfo(rawResponse: TonApiMasterchainHeadResponse): MasterchainInfo {
    return {
        seqno: rawResponse.seqno,
        shard: rawResponse.shard,
        workchain: rawResponse.workchain_id,
        fileHash: asHex(`0x${rawResponse.file_hash}`),
        rootHash: asHex(`0x${rawResponse.root_hash}`),
    };
}
