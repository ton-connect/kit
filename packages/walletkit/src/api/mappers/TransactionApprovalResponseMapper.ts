/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventTransactionResponse } from "../../types/events";
import type { TransactionApprovalResponse } from "../models/bridge/TransactionApprovalResponse";
import { Mapper } from "./Mapper";

/**
 * Maps EventTransactionResponse to API TransactionApprovalResponse model.
 */
export class TransactionApprovalResponseMapper extends Mapper<
  EventTransactionResponse,
  TransactionApprovalResponse
> {
  map(input: EventTransactionResponse): TransactionApprovalResponse {
    return {
      signedBoc: input.signedBoc,
    };
  }
}
