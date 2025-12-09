/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JettonsResponse } from "../models/jettons/JettonsResponse";
import { Mapper } from "./Mapper";
import { JettonMapper } from "./JettonMapper";
import { ResponseUserJettons } from "../../types/export/responses/jettons";

/**
 * Maps array of AddressJetton to API JettonsResponse model.
 */
export class JettonsResponseMapper extends Mapper<
  ResponseUserJettons,
  JettonsResponse
> {
  private jettonMapper = new JettonMapper();

  map(input: ResponseUserJettons): JettonsResponse {
    return {
      jettons: input.jettons.map((jetton) => this.jettonMapper.map(jetton)),
    };
  }
}
