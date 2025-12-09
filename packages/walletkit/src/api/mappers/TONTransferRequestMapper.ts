/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SendMode } from "@ton/core";

import type { TonTransferParams } from "../../types/wallet";
import type { ConnectExtraCurrency } from "../../types/internal";
import type { TONTransferRequest } from "../models/tons/TONTransferRequest";
import { Mapper } from "./Mapper";
import { SendModeMapper } from "./SendModeMapper";
import { ExtraCurrenciesMapper } from "./ExtraCurrenciesMapper";

/**
 * Maps API TONTransferRequest to internal TonTransferParams.
 */
export class TONTransferRequestMapper extends Mapper<
  TONTransferRequest,
  TonTransferParams
> {
  private sendModeMapper = new SendModeMapper();

  map(input: TONTransferRequest): TonTransferParams {
    const base = {
      toAddress: input.recipientAddress,
      amount: input.transferAmount,
      mode: input.mode
        ? (this.sendModeMapper.reverse(input.mode) as SendMode)
        : undefined,
      extraCurrency: input.extraCurrency,
      stateInit: input.stateInit,
    };

    // TonTransferMessage requires exclusive body OR comment (not both)
    // Prefer body (payload) over comment if both are present
    if (input.payload) {
      return {
        ...base,
        body: input.payload,
        comment: undefined,
      };
    }

    return {
      ...base,
      body: undefined,
      comment: input.comment,
    };
  }
}
