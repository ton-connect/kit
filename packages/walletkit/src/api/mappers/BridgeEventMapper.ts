/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BridgeEventBase } from "../../types/internal";
import type { BridgeEvent } from "../models/bridge/BridgeEvent";
import { Mapper } from "./Mapper";

/**
 * Maps BridgeEventBase to API BridgeEvent model.
 */
export class BridgeEventMapper extends Mapper<BridgeEventBase, BridgeEvent> {
  map(input: BridgeEventBase): BridgeEvent {
    return {
      id: input.id,
      from: input.from,
      walletAddress: input.walletAddress,
      domain: input.domain,
      isJsBridge: input.isJsBridge,
      tabId: input.tabId,
      sessionId: input.sessionId,
      isLocal: input.isLocal,
      messageId: input.messageId,
      traceId: input.traceId,
    };
  }
}
