/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  ToncenterTransaction,
  EmulationAccountStatus,
} from "../../types/toncenter/emulation";
import type {
  Transaction,
  AccountStatus,
} from "../models/transactions/Transaction";
import { Mapper } from "./Mapper";

/**
 * Maps ToncenterTransaction to API Transaction model.
 */
export class TransactionMapper extends Mapper<
  ToncenterTransaction,
  Transaction
> {
  private mapAccountStatus(
    status: EmulationAccountStatus | string,
  ): AccountStatus {
    switch (status) {
      case "active":
        return { type: "active" };
      case "frozen":
        return { type: "frozen" };
      case "uninit":
        return { type: "uninitialized" };
      default:
        return { type: "unknown", value: String(status) };
    }
  }

  map(input: ToncenterTransaction): Transaction {
    return {
      account: input.account,
      accountStateBefore: undefined, // UNMAPPED_FIELD
      accountStateAfter: undefined, // UNMAPPED_FIELD
      description: undefined, // UNMAPPED_FIELD
      hash: input.hash,
      logicalTime: input.lt,
      now: input.now,
      msBlockSeqno: input.mc_block_seqno,
      traceExternalHash: input.trace_external_hash,
      traceId: input.trace_id,
      previousTransactionHash: input.prev_trans_hash ?? undefined,
      previousTransactionLogicalTime: input.prev_trans_lt ?? undefined,
      origStatus: this.mapAccountStatus(input.orig_status),
      endStatus: this.mapAccountStatus(input.end_status),
      totalFees: input.total_fees,
      totalFeesExtraCurrencies: input.total_fees_extra_currencies,
      blockRef: undefined, // UNMAPPED_FIELD
      inMessage: undefined, // UNMAPPED_FIELD
      outMessages: [], // UNMAPPED_FIELD
      isEmulated: input.emulated ?? false,
    };
  }
}
