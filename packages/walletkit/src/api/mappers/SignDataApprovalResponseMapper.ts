/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventSignDataResponse } from "../../types/events";
import type { SignDataApprovalResponse } from "../models/bridge/SignDataApprovalResponse";
import { Mapper } from "./Mapper";

/**
 * Maps EventSignDataResponse to API SignDataApprovalResponse model.
 */
export class SignDataApprovalResponseMapper extends Mapper<
  EventSignDataResponse,
  SignDataApprovalResponse
> {
  map(input: EventSignDataResponse): SignDataApprovalResponse {
    return {
      signature: input.signature,
    };
  }
}
