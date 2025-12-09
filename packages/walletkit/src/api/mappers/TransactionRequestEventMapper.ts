/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventTransactionRequest } from "../../types/events";
import type {
  TransactionRequestEvent,
  TransactionRequestEventPreview,
} from "../models/bridge/TransactionRequestEvent";
import type { ToncenterEmulationHook } from "../../utils/toncenterEmulation";
import { Mapper } from "./Mapper";
import { DAppInfoMapper } from "./DAppInfoMapper";
import { TransactionRequestMapper } from "./TransactionRequestMapper";
import { TransactionEmulatedPreviewMapper } from "./TransactionEmulatedPreviewMapper";

/**
 * Maps EventTransactionRequest to API TransactionRequestEvent model.
 */
export class TransactionRequestEventMapper extends Mapper<
  EventTransactionRequest,
  TransactionRequestEvent
> {
  private dAppInfoMapper = new DAppInfoMapper();
  private transactionRequestMapper = new TransactionRequestMapper();
  private previewMapper = new TransactionEmulatedPreviewMapper();

  map(input: EventTransactionRequest): TransactionRequestEvent {
    // Convert the preview to the format expected by TransactionEmulatedPreviewMapper
    const emulationHook: ToncenterEmulationHook =
      input.preview.result === "success"
        ? {
            emulation: {
              result: "success",
              emulationResult: input.preview.emulationResult,
            },
            moneyFlow: input.preview.moneyFlow,
            isCorrect: true,
            error: null,
          }
        : {
            emulation: {
              result: "error",
              emulationError: input.preview.emulationError,
            },
            moneyFlow: {
              outputs: "0",
              inputs: "0",
              allJettonTransfers: [],
              ourTransfers: [],
              ourAddress: null,
            },
            isCorrect: false,
            error: input.preview.emulationError.message ?? null,
          };

    const preview: TransactionRequestEventPreview = {
      dAppInfo: input.dAppInfo
        ? this.dAppInfoMapper.map(input.dAppInfo)
        : undefined,
      data: this.previewMapper.map(emulationHook),
    };

    return {
      preview,
      request: this.transactionRequestMapper.reverse(input.request),
    };
  }
}
