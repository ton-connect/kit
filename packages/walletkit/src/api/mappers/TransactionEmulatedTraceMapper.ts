/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  ToncenterEmulationResponse,
  EmulationAddressMetadata,
  EmulationTokenInfo,
  EmulationAction,
  EmulationTraceNode,
} from "../../types/toncenter/emulation";
import type { TransactionEmulatedTrace } from "../models/transactions/emulation/TransactionEmulatedTrace";
import type {
  TransactionAddressMetadata,
  TransactionAddressMetadataEntry,
  TransactionTokenInfo,
  TransactionTokenInfoJettonWallets,
  TransactionTokenInfoJettonMasters,
  TransactionTokenInfoBase,
} from "../models/transactions/TransactionMetadata";
import type {
  TransactionTraceNode,
  TransactionTraceAction,
  TransactionTraceActionDetails,
  TransactionTraceActionJettonSwapDetails,
  TransactionTraceActionCallContractDetails,
  TransactionTraceActionTonTransferDetails,
  TransactionTraceActionJettonTransfer,
} from "../models/transactions/TransactionTrace";
import type { TokenImage } from "../models/core/TokenImage";
import type { Transaction } from "../models/transactions/Transaction";
import { Mapper } from "./Mapper";
import { AddressBookMapper } from "./AddressBookMapper";
import { UserFriendlyAddressMapper } from "./UserFriendlyAddressMapper";
import { TransactionMapper } from "./TransactionMapper";

/**
 * Maps ToncenterEmulationResponse to API TransactionEmulatedTrace model.
 */
export class TransactionEmulatedTraceMapper extends Mapper<
  ToncenterEmulationResponse,
  TransactionEmulatedTrace
> {
  private addressBookMapper = new AddressBookMapper();
  private addressMapper = new UserFriendlyAddressMapper();
  private transactionMapper = new TransactionMapper();

  private mapTokenInfo(info: EmulationTokenInfo): TransactionTokenInfo {
    const baseInfo: TransactionTokenInfoBase = {
      isValid: info.valid,
      type: info.type,
      extra: "extra" in info ? (info.extra as Record<string, unknown>) : {},
    };

    if (info.type === "jetton_wallets" && "extra" in info) {
      const extra = info.extra as {
        balance: string;
        jetton: string;
        owner: string;
      };
      const jettonWallets: TransactionTokenInfoJettonWallets = {
        ...baseInfo,
        balance: extra.balance,
        jetton: this.addressMapper.map(extra.jetton) ?? extra.jetton,
        owner: this.addressMapper.map(extra.owner) ?? extra.owner,
      };
      return { type: "jetton_wallets", value: jettonWallets };
    }

    if (info.type === "jetton_masters" && "name" in info) {
      const typedInfo = info as {
        name: string;
        symbol: string;
        description: string;
        image?: string;
        extra: {
          _image_big?: string;
          _image_medium?: string;
          _image_small?: string;
          decimals: string;
          image_data?: string;
          social?: string[];
          uri?: string;
          websites?: string[];
        };
      };
      const image: TokenImage | undefined = typedInfo.image
        ? {
            url: typedInfo.image,
            smallUrl: typedInfo.extra._image_small,
            mediumUrl: typedInfo.extra._image_medium,
            largeUrl: typedInfo.extra._image_big,
            data: typedInfo.extra.image_data,
          }
        : undefined;
      const jettonMasters: TransactionTokenInfoJettonMasters = {
        ...baseInfo,
        name: typedInfo.name,
        symbol: typedInfo.symbol,
        description: typedInfo.description,
        decimalsCount: parseInt(typedInfo.extra.decimals, 10) || 0,
        image,
        social: typedInfo.extra.social ?? [],
        uri: typedInfo.extra.uri ?? "",
        websites: typedInfo.extra.websites ?? [],
      };
      return { type: "jetton_masters", value: jettonMasters };
    }

    return { type: "unknown", value: baseInfo };
  }

  private mapMetadataEntry(
    entry: EmulationAddressMetadata,
  ): TransactionAddressMetadataEntry {
    return {
      tokenInfo: entry.token_info?.map((info) => this.mapTokenInfo(info)),
    };
  }

  private mapMetadata(
    metadata: Record<string, EmulationAddressMetadata>,
  ): TransactionAddressMetadata {
    const result: TransactionAddressMetadata = {};
    for (const [rawAddress, entry] of Object.entries(metadata)) {
      const userFriendlyAddress = this.addressMapper.map(rawAddress);
      if (userFriendlyAddress !== undefined) {
        result[userFriendlyAddress] = this.mapMetadataEntry(entry);
      }
    }
    return result;
  }

  private mapAddress(address: string): string {
    return this.addressMapper.map(address) ?? address;
  }

  private mapTraceNode(node: EmulationTraceNode): TransactionTraceNode {
    return {
      txHash: node.tx_hash ?? undefined,
      inMsgHash: node.in_msg_hash ?? undefined,
      children: node.children?.map((child) => this.mapTraceNode(child)),
    };
  }

  private mapJettonTransfer(transfer: {
    asset: string;
    source: string;
    destination: string;
    source_jetton_wallet: string | null;
    destination_jetton_wallet: string | null;
    amount: string;
  }): TransactionTraceActionJettonTransfer {
    return {
      asset: this.mapAddress(transfer.asset),
      source: this.mapAddress(transfer.source),
      destination: this.mapAddress(transfer.destination),
      sourceJettonWallet: transfer.source_jetton_wallet
        ? this.mapAddress(transfer.source_jetton_wallet)
        : undefined,
      destinationJettonWallet: transfer.destination_jetton_wallet
        ? this.mapAddress(transfer.destination_jetton_wallet)
        : undefined,
      amount: transfer.amount,
    };
  }

  private mapActionDetails(
    actionType: string,
    details: EmulationAction["details"],
  ): TransactionTraceActionDetails {
    if (actionType === "jetton_swap" && "dex" in details) {
      const swapDetails = details as {
        dex: string;
        sender: string;
        dex_incoming_transfer?: {
          asset: string;
          source: string;
          destination: string;
          source_jetton_wallet: string | null;
          destination_jetton_wallet: string | null;
          amount: string;
        };
        dex_outgoing_transfer?: {
          asset: string;
          source: string;
          destination: string;
          source_jetton_wallet: string | null;
          destination_jetton_wallet: string | null;
          amount: string;
        };
        peer_swaps: unknown[];
      };
      const value: TransactionTraceActionJettonSwapDetails = {
        dex: swapDetails.dex,
        sender: this.mapAddress(swapDetails.sender),
        dexIncomingTransfer: swapDetails.dex_incoming_transfer
          ? this.mapJettonTransfer(swapDetails.dex_incoming_transfer)
          : undefined,
        dexOutgoingTransfer: swapDetails.dex_outgoing_transfer
          ? this.mapJettonTransfer(swapDetails.dex_outgoing_transfer)
          : undefined,
        peerSwaps: swapDetails.peer_swaps,
      };
      return { type: "jetton_swap", value };
    }

    if (actionType === "call_contract" && "opcode" in details) {
      const callDetails = details as {
        opcode: string;
        source: string;
        destination: string;
        value: string;
        extra_currencies: Record<string, string> | null;
      };
      const value: TransactionTraceActionCallContractDetails = {
        opcode: callDetails.opcode,
        source: this.mapAddress(callDetails.source),
        destination: this.mapAddress(callDetails.destination),
        value: callDetails.value,
        valueExtraCurrencies: callDetails.extra_currencies ?? undefined,
      };
      return { type: "call_contract", value };
    }

    if (actionType === "ton_transfer" && "source" in details) {
      const tonDetails = details as {
        source: string;
        destination: string;
        value: string;
        value_extra_currencies: Record<string, string>;
        comment: string | null;
        encrypted: boolean;
      };
      const value: TransactionTraceActionTonTransferDetails = {
        source: this.mapAddress(tonDetails.source),
        destination: this.mapAddress(tonDetails.destination),
        value: tonDetails.value,
        valueExtraCurrencies: tonDetails.value_extra_currencies ?? undefined,
        comment: tonDetails.comment ?? undefined,
        isEncrypted: tonDetails.encrypted,
      };
      return { type: "ton_transfer", value };
    }

    return { type: "unknown", value: details as Record<string, unknown> };
  }

  private mapAction(action: EmulationAction): TransactionTraceAction {
    return {
      traceId: action.trace_id ?? undefined,
      actionId: action.action_id,
      startLt: action.start_lt,
      endLt: action.end_lt,
      startUtime: action.start_utime,
      endUtime: action.end_utime,
      traceEndLt: action.trace_end_lt,
      traceEndUtime: action.trace_end_utime,
      traceMcSeqnoEnd: action.trace_mc_seqno_end,
      transactions: action.transactions,
      isSuccess: action.success,
      traceExternalHash: action.trace_external_hash,
      accounts: action.accounts.map((addr) => this.mapAddress(addr)),
      details: this.mapActionDetails(action.type, action.details),
    };
  }

  map(input: ToncenterEmulationResponse): TransactionEmulatedTrace {
    // Map transactions
    const transactions: { [key: string]: Transaction } = {};
    for (const [hash, tx] of Object.entries(input.transactions)) {
      transactions[hash] = this.transactionMapper.map(tx);
    }

    return {
      mcBlockSeqno: input.mc_block_seqno,
      trace: this.mapTraceNode(input.trace),
      transactions,
      actions: input.actions.map((action) => this.mapAction(action)),
      randSeed: input.rand_seed,
      isIncomplete: input.is_incomplete,
      codeCells: input.code_cells,
      dataCells: input.data_cells,
      metadata: this.mapMetadata(input.metadata),
      addressBook: this.addressBookMapper.map(input.address_book),
    };
  }
}
