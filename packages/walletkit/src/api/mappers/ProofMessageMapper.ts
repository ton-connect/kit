/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from "@ton/core";

import type { TonProofParsedMessage } from "../../utils/tonProof";
import { Uint8ArrayToHex } from "../../utils/base64";
import { asHex } from "../../types/primitive";
import type { ProofMessage } from "../models/core/ProofMessage";
import { Mapper } from "./Mapper";

/**
 * Maps API ProofMessage to internal TonProofParsedMessage.
 */
export class ProofMessageMapper extends Mapper<
  ProofMessage,
  TonProofParsedMessage
> {
  map(input: ProofMessage): TonProofParsedMessage {
    const address = Address.parse(input.address);

    return {
      workchain: input.workchain,
      address: Uint8ArrayToHex(address.hash), // ????
      timstamp: input.timestamp, // Note: typo in target type
      domain: input.domain
        ? {
            lengthBytes: input.domain.lengthBytes,
            value: input.domain.value,
          }
        : { lengthBytes: 0, value: "" },
      payload: input.payload,
      stateInit: input.stateInit,
      signature: input.signature ? asHex(input.signature) : undefined,
    };
  }
}
