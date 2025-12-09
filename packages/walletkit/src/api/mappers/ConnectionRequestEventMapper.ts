/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventConnectRequest } from "../../types/events";
import type {
  ConnectionRequestEvent,
  ConnectionRequestEventPreview,
  ConnectionRequestEventPreviewRequestedItem,
  ConnectionRequestEventPreviewPermission,
} from "../models/bridge/ConnectionRequestEvent";
import { Mapper } from "./Mapper";
import { DAppInfoMapper } from "./DAppInfoMapper";

/**
 * Maps EventConnectRequest to API ConnectionRequestEvent model.
 */
export class ConnectionRequestEventMapper extends Mapper<
  EventConnectRequest,
  ConnectionRequestEvent
> {
  private dAppInfoMapper = new DAppInfoMapper();

  map(input: EventConnectRequest): ConnectionRequestEvent {
    const requestedItems: ConnectionRequestEventPreviewRequestedItem[] =
      input.preview.requestedItems?.map((item) => ({
        name: item.name,
        payload: "payload" in item ? (item.payload ?? undefined) : undefined,
      })) ?? [];

    const permissions: ConnectionRequestEventPreviewPermission[] =
      input.preview.permissions?.map((perm) => ({
        name: perm.name,
        description: perm.description,
      })) ?? [];

    const preview: ConnectionRequestEventPreview = {
      requestedItems,
      permissions,
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
