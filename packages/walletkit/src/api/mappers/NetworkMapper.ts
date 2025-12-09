/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CHAIN } from "@tonconnect/protocol";

import type { Network } from "../models/core/Network";
import { Network as NetworkFactory } from "../models/core/Network";
import { Mapper } from "./Mapper";

/**
 * Maps CHAIN to API Network model and vice versa.
 */
export class NetworkMapper extends Mapper<CHAIN, Network> {
  map(input: CHAIN): Network {
    switch (input) {
      case CHAIN.MAINNET:
        return NetworkFactory.mainnet();
      case CHAIN.TESTNET:
        return NetworkFactory.testnet();
      default:
        return { chainId: String(input) };
    }
  }

  /**
   * Reverse mapping: Network -> CHAIN
   */
  reverse(input: Network): CHAIN {
    switch (input.chainId) {
      case CHAIN.MAINNET:
        return CHAIN.MAINNET;
      case CHAIN.TESTNET:
        return CHAIN.TESTNET;
      default:
        // Default to mainnet for unknown chains
        // ????
        return CHAIN.MAINNET;
    }
  }
}
