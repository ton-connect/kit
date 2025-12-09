/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SendMode } from "@ton/core";

import type { IWallet, TonTransferParams } from "../../types/wallet";
import type { JettonTransferParams } from "../../types/jettons";
import type { NftTransferParamsHuman } from "../../types/nfts";
import type { Network } from "../models/core/Network";
import type {
  Hex,
  UserFriendlyAddress,
  Base64String,
} from "../models/core/Primitives";
import type { JettonsRequest } from "../models/jettons/JettonsRequest";
import type { JettonsResponse } from "../models/jettons/JettonsResponse";
import type { JettonsTransferRequest } from "../models/jettons/JettonsTransferRequest";
import type { NFT } from "../models/nfts/NFT";
import type { NFTsRequest } from "../models/nfts/NFTsRequest";
import type { NFTsResponse } from "../models/nfts/NFTsResponse";
import type { NFTTransferRequest } from "../models/nfts/NFTTransferRequest";
import type { TONTransferRequest } from "../models/tons/TONTransferRequest";
import type { TransactionRequest } from "../models/transactions/TransactionRequest";
import type { TransactionApprovalResponse } from "../models/bridge/TransactionApprovalResponse";
import { NetworkMapper } from "../mappers/NetworkMapper";
import { JettonMapper } from "../mappers/JettonMapper";
import { NFTMapper } from "../mappers/NftMapper";
import { SendModeMapper } from "../mappers/SendModeMapper";
import { TransactionRequestMapper } from "../mappers/TransactionRequestMapper";
import { TransactionApprovalResponseMapper } from "../mappers/TransactionApprovalResponseMapper";
import { HexMapper } from "../mappers/HexMapper";

/**
 * Wallet class that wraps IWallet and exposes api/models types.
 * This provides a clean public API for wallet operations using
 * the standardized model types with proper mapping.
 */
export class Wallet {
  private readonly internalWallet: IWallet;

  // Mappers
  private readonly networkMapper = new NetworkMapper();
  private readonly jettonMapper = new JettonMapper();
  private readonly nftMapper = new NFTMapper();
  private readonly sendModeMapper = new SendModeMapper();
  private readonly transactionRequestMapper = new TransactionRequestMapper();
  private readonly transactionApprovalResponseMapper =
    new TransactionApprovalResponseMapper();
  private readonly hexMapper = new HexMapper();

  constructor(wallet: IWallet) {
    this.internalWallet = wallet;
  }

  // === Identity ===

  /**
   * Get the wallet's public key
   */
  getPublicKey(): Hex {
    return this.hexMapper.map(this.internalWallet.getPublicKey());
  }

  /**
   * Get the network the wallet is connected to
   */
  getNetwork(): Network {
    return this.networkMapper.map(this.internalWallet.getNetwork());
  }

  /**
   * Get the wallet address
   */
  getAddress(options?: { testnet?: boolean }): UserFriendlyAddress {
    return this.internalWallet.getAddress(options);
  }

  /**
   * Get the wallet ID (network:address format)
   */
  getWalletId(): string {
    return this.internalWallet.getWalletId();
  }

  /**
   * Get state init for wallet deployment (base64 encoded BOC)
   */
  async getStateInit(): Promise<Base64String> {
    return this.internalWallet.getStateInit();
  }

  // === TON Operations ===

  /**
   * Get wallet balance in nanotons
   */
  async getBalance(): Promise<string> {
    return this.internalWallet.getBalance();
  }

  /**
   * Create a TON transfer transaction
   */
  async createTransferTonTransaction(
    request: TONTransferRequest,
  ): Promise<TransactionRequest> {
    const internalParams = this.mapTonTransferRequest(request);
    const result =
      await this.internalWallet.createTransferTonTransaction(internalParams);
    // Use reverse() since TransactionRequestMapper.map goes TransactionRequest -> Connect
    return this.transactionRequestMapper.reverse(result);
  }

  /**
   * Create a multi-message TON transfer transaction
   */
  async createTransferMultiTonTransaction(
    requests: TONTransferRequest[],
  ): Promise<TransactionRequest> {
    const internalParams = {
      messages: requests.map((r) => this.mapTonTransferRequest(r)),
    };
    const result =
      await this.internalWallet.createTransferMultiTonTransaction(
        internalParams,
      );
    return this.transactionRequestMapper.reverse(result);
  }

  /**
   * Send a transaction and return the signed BOC
   */
  async sendTransaction(
    request: TransactionRequest,
  ): Promise<TransactionApprovalResponse> {
    // Use map() since TransactionRequestMapper.map goes TransactionRequest -> Connect
    const internalRequest = this.transactionRequestMapper.map(request);
    const result = await this.internalWallet.sendTransaction(internalRequest);
    return this.transactionApprovalResponseMapper.map(result);
  }

  // === Jetton Operations ===

  /**
   * Create a Jetton transfer transaction
   */
  async createTransferJettonTransaction(
    request: JettonsTransferRequest,
  ): Promise<TransactionRequest> {
    const internalParams = this.mapJettonTransferRequest(request);
    const result =
      await this.internalWallet.createTransferJettonTransaction(internalParams);
    return this.transactionRequestMapper.reverse(result);
  }

  /**
   * Get Jetton balance for a specific Jetton
   */
  async getJettonBalance(jettonAddress: UserFriendlyAddress): Promise<string> {
    return this.internalWallet.getJettonBalance(jettonAddress);
  }

  /**
   * Get Jetton wallet address for a specific Jetton
   */
  async getJettonWalletAddress(
    jettonAddress: UserFriendlyAddress,
  ): Promise<UserFriendlyAddress> {
    return this.internalWallet.getJettonWalletAddress(jettonAddress);
  }

  /**
   * Get all Jettons owned by this wallet
   */
  async getJettons(params?: JettonsRequest): Promise<JettonsResponse> {
    const result = await this.internalWallet.getJettons({
      limit: params?.pagination?.limit,
      offset: params?.pagination?.offset,
    });

    return {
      jettons: result.jettons.map((j) => this.jettonMapper.map(j)),
    };
  }

  // === NFT Operations ===

  /**
   * Create an NFT transfer transaction
   */
  async createTransferNftTransaction(
    request: NFTTransferRequest,
  ): Promise<TransactionRequest> {
    const internalParams = this.mapNftTransferRequest(request);
    const result =
      await this.internalWallet.createTransferNftTransaction(internalParams);
    return this.transactionRequestMapper.reverse(result);
  }

  /**
   * Get all NFTs owned by this wallet
   */
  async getNfts(params?: NFTsRequest): Promise<NFTsResponse> {
    const result = await this.internalWallet.getNfts({
      limit: params?.pagination?.limit,
      offset: params?.pagination?.offset,
    });

    return {
      nfts: result.items.map((nft) => this.nftMapper.map(nft)),
    };
  }

  /**
   * Get a specific NFT by address
   */
  async getNft(address: UserFriendlyAddress): Promise<NFT | null> {
    const result = await this.internalWallet.getNft(address);
    if (!result) {
      return null;
    }
    return this.nftMapper.map(result);
  }

  // === Signing Operations ===

  /**
   * Get a signed transaction for sending
   */
  async getSignedSendTransaction(
    request: TransactionRequest,
    options?: { fakeSignature?: boolean },
  ): Promise<Base64String> {
    const internalRequest = this.transactionRequestMapper.map(request);
    return this.internalWallet.getSignedSendTransaction(internalRequest, {
      fakeSignature: options?.fakeSignature ?? false,
    });
  }

  // === Internal Access ===

  /**
   * Get the underlying IWallet instance for advanced operations.
   * Use with caution - this bypasses the model/mapper layer.
   */
  getInternalWallet(): IWallet {
    return this.internalWallet;
  }

  // === Private Mapping Helpers ===

  /**
   * Map TONTransferRequest to internal TonTransferParams
   */
  private mapTonTransferRequest(
    request: TONTransferRequest,
  ): TonTransferParams {
    const base = {
      toAddress: request.recipientAddress,
      amount: request.transferAmount,
      mode: request.mode
        ? (this.sendModeMapper.reverse(request.mode) as SendMode)
        : undefined,
      extraCurrency: request.extraCurrency,
      stateInit: request.stateInit,
    };

    // TonTransferMessage requires exclusive body OR comment (not both)
    if (request.payload) {
      return {
        ...base,
        body: request.payload,
        comment: undefined,
      };
    }

    return {
      ...base,
      body: undefined,
      comment: request.comment,
    };
  }

  /**
   * Map JettonsTransferRequest to internal JettonTransferParams
   */
  private mapJettonTransferRequest(
    request: JettonsTransferRequest,
  ): JettonTransferParams {
    return {
      toAddress: request.recipientAddress,
      jettonAddress: request.jettonAddress,
      amount: request.transferAmount,
      comment: request.comment,
    };
  }

  /**
   * Map NFTTransferRequest to internal NftTransferParamsHuman
   */
  private mapNftTransferRequest(
    request: NFTTransferRequest,
  ): NftTransferParamsHuman {
    return {
      nftAddress: request.nftAddress,
      transferAmount: request.transferAmount ?? "100000000", // Default 0.1 TON
      toAddress: request.recipientAddress,
      comment: request.comment,
    };
  }
}
