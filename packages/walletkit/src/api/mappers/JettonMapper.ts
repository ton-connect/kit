/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AddressJetton } from "../../types/jettons";
import type { Jetton } from "../models/jettons/Jetton";
import { Mapper } from "./Mapper";
import { TokenInfoMapper } from "./TokenInfoMapper";

/**
 * Maps internal AddressJetton to API Jetton model.
 */
export class JettonMapper extends Mapper<AddressJetton, Jetton> {
  private tokenInfoMapper = new TokenInfoMapper();

  map(input: AddressJetton): Jetton {
    return {
      address: input.address,
      walletAddress: input.jettonWalletAddress,
      balance: input.balance,
      info: this.tokenInfoMapper.map(input),
      decimalsNumber: input.decimals,
      extra: input.metadata,
    };
  }
}
