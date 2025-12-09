/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JettonTransferParams } from "../../types/jettons";
import type { JettonsTransferRequest } from "../models/jettons/JettonsTransferRequest";
import { Mapper } from "./Mapper";

/**
 * Maps API JettonsTransferRequest to internal JettonTransferParams.
 */
export class JettonsTransferRequestMapper extends Mapper<
  JettonsTransferRequest,
  JettonTransferParams
> {
  map(input: JettonsTransferRequest): JettonTransferParams {
    return {
      jettonAddress: input.jettonAddress,
      amount: input.transferAmount,
      toAddress: input.recipientAddress,
      comment: input.comment,
    };
  }
}
