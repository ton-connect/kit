/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventDisconnect } from "../../types/events";
import type {
  DisconnectionEvent,
  DisconnectionEventPreview,
} from "../models/bridge/DisconnectionEvent";
import { Mapper } from "./Mapper";
import { DAppInfoMapper } from "./DAppInfoMapper";

/**
 * Maps EventDisconnect to API DisconnectionEvent model.
 */
export class DisconnectionEventMapper extends Mapper<
  EventDisconnect,
  DisconnectionEvent
> {
  private dAppInfoMapper = new DAppInfoMapper();

  map(input: EventDisconnect): DisconnectionEvent {
    const preview: DisconnectionEventPreview = {
      reason: input.reason,
      dAppInfo: input.dAppInfo
        ? this.dAppInfoMapper.map(input.dAppInfo)
        : undefined,
    };

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
      preview,
    };
  }
}
