/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MoneyFlow } from "../../utils/toncenterEmulation";
import type {
  TransactionMoneyFlow,
  TransactionMoneyFlowItem,
} from "../models/transactions/TransactionMoneyFlow";
import { AssetType } from "../models/core/AssetType";
import { Mapper } from "./Mapper";

/**
 * Maps MoneyFlow to API TransactionMoneyFlow model.
 */
export class TransactionMoneyFlowMapper extends Mapper<
  MoneyFlow,
  TransactionMoneyFlow
> {
  map(input: MoneyFlow): TransactionMoneyFlow {
    const incoming: TransactionMoneyFlowItem[] = [];
    const outgoing: TransactionMoneyFlowItem[] = [];

    // Map incoming TON
    if (input.inputs !== "0" && input.ourAddress) {
      incoming.push({
        assetType: AssetType.ton,
        amount: input.inputs,
        address: input.ourAddress,
      });
    }

    // Map outgoing TON
    if (input.outputs !== "0" && input.ourAddress) {
      outgoing.push({
        assetType: AssetType.ton,
        amount: input.outputs,
        address: input.ourAddress,
      });
    }

    // Map jetton transfers
    for (const transfer of input.allJettonTransfers) {
      const item: TransactionMoneyFlowItem = {
        assetType:
          transfer.type === "jetton" ? AssetType.jetton : AssetType.ton,
        amount: transfer.amount,
        tokenAddress: transfer.type === "jetton" ? transfer.jetton : undefined,
        address: transfer.to,
        symbol: undefined, // UNMAPPED_FIELD
        decimals: undefined, // UNMAPPED_FIELD
      };

      if (input.ourAddress === transfer.from) {
        outgoing.push(item);
      } else if (input.ourAddress === transfer.to) {
        incoming.push(item);
      }
    }

    return { incoming, outgoing };
  }
}
