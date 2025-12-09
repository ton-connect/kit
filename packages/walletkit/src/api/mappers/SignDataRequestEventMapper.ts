/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventSignDataRequest, SignDataPreview } from "../../types/events";
import type {
  SignDataRequestEvent,
  SignDataRequestEventPreview,
} from "../models/bridge/SignDataRequestEvent";
import type { SignData } from "../models/core/SignData";
import { Mapper } from "./Mapper";
import { DAppInfoMapper } from "./DAppInfoMapper";
import { Base64StringMapper } from "./Base64StringMapper";

/**
 * Maps EventSignDataRequest to API SignDataRequestEvent model.
 */
export class SignDataRequestEventMapper extends Mapper<
  EventSignDataRequest,
  SignDataRequestEvent
> {
  private dAppInfoMapper = new DAppInfoMapper();
  private base64Mapper = new Base64StringMapper();

  private mapSignDataPreview(preview: SignDataPreview): SignData {
    switch (preview.kind) {
      case "text":
        return { type: "text", value: { content: preview.content } };
      case "binary":
        return {
          type: "binary",
          value: { content: this.base64Mapper.map(preview.content) },
        };
      case "cell":
        return {
          type: "cell",
          value: {
            schema: preview.schema ?? "",
            content: this.base64Mapper.map(preview.content),
          },
        };
    }
  }

  map(input: EventSignDataRequest): SignDataRequestEvent {
    const preview: SignDataRequestEventPreview = {
      dAppInfo: input.dAppInfo
        ? this.dAppInfoMapper.map(input.dAppInfo)
        : undefined,
      data: this.mapSignDataPreview(input.preview),
    };

    return {
      preview,
    };
  }
}
