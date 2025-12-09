/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterEmulationHook } from "../../utils/toncenterEmulation";
import type { TransactionEmulatedPreview } from "../models/transactions/emulation/TransactionEmulatedPreview";
import { Result } from "../models/core/Primitives";
import { Mapper } from "./Mapper";
import { TransactionEmulatedTraceMapper } from "./TransactionEmulatedTraceMapper";
import { TransactionMoneyFlowMapper } from "./TransactionMoneyFlowMapper";

/**
 * Maps ToncenterEmulationHook to API TransactionEmulatedPreview model.
 */
export class TransactionEmulatedPreviewMapper extends Mapper<
  ToncenterEmulationHook,
  TransactionEmulatedPreview
> {
  private traceMapper = new TransactionEmulatedTraceMapper();
  private moneyFlowMapper = new TransactionMoneyFlowMapper();

  map(input: ToncenterEmulationHook): TransactionEmulatedPreview {
    if (input.emulation.result === "error") {
      return {
        result: Result.failure,
        error: {
          code: input.emulation.emulationError.code,
          message: input.emulation.emulationError.message,
        },
      };
    }

    return {
      result: Result.success,
      trace: this.traceMapper.map(input.emulation.emulationResult),
      moneyFlow: this.moneyFlowMapper.map(input.moneyFlow),
    };
  }
}
