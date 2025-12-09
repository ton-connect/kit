/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SignDataPayload } from "@tonconnect/protocol";

import type { SignDataParams } from "../../utils/signData/sign";
import type { PreparedSignData } from "../models/core/PreparedSignData";
import { Mapper } from "./Mapper";
import { NetworkMapper } from "./NetworkMapper";

/**
 * Maps API PreparedSignData to internal SignDataParams.
 */
export class PreparedSignDataMapper extends Mapper<
  PreparedSignData,
  SignDataParams
> {
  private networkMapper = new NetworkMapper();

  map(input: PreparedSignData): SignDataParams {
    // Convert SignData to SignDataPayload
    let payload: SignDataPayload;
    const data = input.payload.data;

    if (!data) {
      // Default to empty text payload
      payload = { type: "text", text: "" };
    } else if (data.type === "text") {
      payload = { type: "text", text: data.value.content };
    } else if (data.type === "binary") {
      payload = { type: "binary", bytes: data.value.content };
    } else {
      payload = {
        type: "cell",
        schema: data.value.schema,
        cell: data.value.content,
      };
    }

    return {
      payload,
      domain: input.domain,
      address: input.address,
    };
  }
}
