/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CHAIN } from "@tonconnect/protocol";

import type {
  ConnectTransactionParamContent,
  ConnectTransactionParamMessage,
  ConnectExtraCurrency,
} from "../../types/internal";
import type {
  TransactionRequest,
  TransactionRequestMessage,
} from "../models/transactions/TransactionRequest";
import { Mapper } from "./Mapper";
import { NetworkMapper } from "./NetworkMapper";
import { SendModeMapper } from "./SendModeMapper";

/**
 * Maps API TransactionRequest to internal ConnectTransactionParamContent.
 */
export class TransactionRequestMapper extends Mapper<
  TransactionRequest,
  ConnectTransactionParamContent
> {
  private networkMapper = new NetworkMapper();
  private sendModeMapper = new SendModeMapper();

  private mapExtraCurrency(
    input: Record<string, string> | undefined,
  ): ConnectExtraCurrency | undefined {
    if (!input) return undefined;
    const result: ConnectExtraCurrency = {};
    for (const [key, value] of Object.entries(input)) {
      result[Number(key)] = value;
    }
    return result;
  }

  map(input: TransactionRequest): ConnectTransactionParamContent {
    const messages: ConnectTransactionParamMessage[] = input.messages.map(
      (msg: TransactionRequestMessage) => ({
        address: msg.recipientAddress,
        amount: msg.transferAmount,
        payload: msg.payload,
        stateInit: msg.stateInit,
        extraCurrency: this.mapExtraCurrency(msg.extraCurrency),
        mode: msg.mode ? this.sendModeMapper.reverse(msg.mode) : undefined,
      }),
    );

    return {
      messages,
      network: input.network
        ? this.networkMapper.reverse(input.network)
        : undefined,
      valid_until: input.validUntil,
      from: input.fromAddress,
    };
  }

  /**
   * Reverse mapping from ConnectTransactionParamContent to TransactionRequest.
   */
  reverse(input: ConnectTransactionParamContent): TransactionRequest {
    const messages: TransactionRequestMessage[] = input.messages.map(
      (msg: ConnectTransactionParamMessage) => ({
        recipientAddress: msg.address,
        transferAmount: msg.amount,
        payload: msg.payload,
        stateInit: msg.stateInit,
        extraCurrency: this.reverseExtraCurrency(msg.extraCurrency),
        mode: msg.mode ? this.sendModeMapper.map(msg.mode) : undefined,
      }),
    );

    return {
      messages,
      network: input.network
        ? this.networkMapper.map(input.network as CHAIN)
        : undefined,
      validUntil: input.valid_until,
      fromAddress: input.from,
    };
  }

  private reverseExtraCurrency(
    input: ConnectExtraCurrency | undefined,
  ): Record<string, string> | undefined {
    if (!input) return undefined;
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      result[String(key)] = value;
    }
    return result;
  }
}
