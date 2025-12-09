/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CONNECT_EVENT_ERROR_CODES,
  SendTransactionRpcResponseError,
} from "@tonconnect/protocol";

import { TonWalletKit } from "../../core/TonWalletKit";
import type { IWalletAdapter } from "../../types/wallet";
import type {
  EventConnectRequest,
  EventTransactionRequest,
  EventSignDataRequest,
  EventDisconnect,
  EventRequestError,
} from "../../types/events";
import type { SessionInfo } from "../../types/kit";
import type { Network } from "../models/core/Network";
import type { TransactionRequest } from "../models/transactions/TransactionRequest";
import type { ConnectionRequestEvent } from "../models/bridge/ConnectionRequestEvent";
import type { TransactionRequestEvent } from "../models/bridge/TransactionRequestEvent";
import type { SignDataRequestEvent } from "../models/bridge/SignDataRequestEvent";
import type { DisconnectionEvent } from "../models/bridge/DisconnectionEvent";
import type { TransactionApprovalResponse } from "../models/bridge/TransactionApprovalResponse";
import type { SignDataApprovalResponse } from "../models/bridge/SignDataApprovalResponse";
import type { WalletKitConfiguration } from "./WalletKitConfiguration";
import { Wallet } from "./Wallet";
import { NetworkMapper } from "../mappers/NetworkMapper";
import { ConnectionRequestEventMapper } from "../mappers/ConnectionRequestEventMapper";
import { TransactionRequestEventMapper } from "../mappers/TransactionRequestEventMapper";
import { SignDataRequestEventMapper } from "../mappers/SignDataRequestEventMapper";
import { DisconnectionEventMapper } from "../mappers/DisconnectionEventMapper";
import { TransactionApprovalResponseMapper } from "../mappers/TransactionApprovalResponseMapper";
import { SignDataApprovalResponseMapper } from "../mappers/SignDataApprovalResponseMapper";
import { TransactionRequestMapper } from "../mappers/TransactionRequestMapper";

/**
 * WalletKit is a public API wrapper around TonWalletKit.
 * It provides the same functionality but uses standardized api/models types
 * with proper mapping between internal and external representations.
 */
export class WalletKit {
  private readonly internalKit: TonWalletKit;

  // Mappers
  private readonly networkMapper = new NetworkMapper();
  private readonly connectionRequestEventMapper =
    new ConnectionRequestEventMapper();
  private readonly transactionRequestEventMapper =
    new TransactionRequestEventMapper();
  private readonly signDataRequestEventMapper =
    new SignDataRequestEventMapper();
  private readonly disconnectionEventMapper = new DisconnectionEventMapper();
  private readonly transactionApprovalResponseMapper =
    new TransactionApprovalResponseMapper();
  private readonly signDataApprovalResponseMapper =
    new SignDataApprovalResponseMapper();
  private readonly transactionRequestMapper = new TransactionRequestMapper();

  constructor(configuration: WalletKitConfiguration) {
    this.internalKit = new TonWalletKit(configuration);
  }

  // === Initialization ===

  /**
   * Check if kit is ready for use
   */
  isReady(): boolean {
    return this.internalKit.isReady();
  }

  /**
   * Wait for initialization to complete
   */
  async waitForReady(): Promise<void> {
    return this.internalKit.waitForReady();
  }

  /**
   * Get initialization status
   */
  getStatus(): { initialized: boolean; ready: boolean } {
    return this.internalKit.getStatus();
  }

  // === Network ===

  /**
   * Get all configured networks
   */
  getConfiguredNetworks(): Network[] {
    const chains = this.internalKit.getConfiguredNetworks();
    return chains.map((chain) => this.networkMapper.map(chain));
  }

  // === Wallet Management ===

  /**
   * Get all registered wallets
   */
  getWallets(): Wallet[] {
    const wallets = this.internalKit.getWallets();
    return wallets.map((w) => new Wallet(w));
  }

  /**
   * Get wallet by wallet ID (network:address format)
   */
  getWallet(walletId: string): Wallet | undefined {
    const wallet = this.internalKit.getWallet(walletId);
    return wallet ? new Wallet(wallet) : undefined;
  }

  /**
   * Get wallet by address and network
   */
  getWalletByAddressAndNetwork(
    address: string,
    network: Network,
  ): Wallet | undefined {
    const chain = this.networkMapper.reverse(network);
    const wallet = this.internalKit.getWalletByAddressAndNetwork(
      address,
      chain,
    );
    return wallet ? new Wallet(wallet) : undefined;
  }

  /**
   * Add a new wallet
   */
  async addWallet(adapter: IWalletAdapter): Promise<Wallet | undefined> {
    const wallet = await this.internalKit.addWallet(adapter);
    return wallet ? new Wallet(wallet) : undefined;
  }

  /**
   * Remove a wallet by wallet ID or adapter
   */
  async removeWallet(
    walletIdOrAdapter: string | IWalletAdapter,
  ): Promise<void> {
    return this.internalKit.removeWallet(walletIdOrAdapter);
  }

  /**
   * Clear all wallets
   */
  async clearWallets(): Promise<void> {
    return this.internalKit.clearWallets();
  }

  // === Session Management ===

  /**
   * Disconnect session(s)
   */
  async disconnect(sessionId?: string): Promise<void> {
    return this.internalKit.disconnect(sessionId);
  }

  /**
   * List all active sessions
   */
  async listSessions(): Promise<SessionInfo[]> {
    return this.internalKit.listSessions();
  }

  // === URL Processing ===

  /**
   * Handle pasted TON Connect URL/link
   */
  async handleTonConnectUrl(url: string): Promise<void> {
    return this.internalKit.handleTonConnectUrl(url);
  }

  /**
   * Handle new transaction
   */
  async handleNewTransaction(
    wallet: Wallet,
    request: TransactionRequest,
  ): Promise<void> {
    const internalData = this.transactionRequestMapper.map(request);
    return this.internalKit.handleNewTransaction(
      wallet.getInternalWallet(),
      internalData,
    );
  }

  // === Event Handlers ===

  /**
   * Register connect request handler
   */
  onConnectRequest(cb: (event: ConnectionRequestEvent) => void): void {
    this.internalKit.onConnectRequest((event: EventConnectRequest) => {
      cb(this.connectionRequestEventMapper.map(event));
    });
  }

  /**
   * Register transaction request handler
   */
  onTransactionRequest(cb: (event: TransactionRequestEvent) => void): void {
    this.internalKit.onTransactionRequest((event: EventTransactionRequest) => {
      cb(this.transactionRequestEventMapper.map(event));
    });
  }

  /**
   * Register sign data request handler
   */
  onSignDataRequest(cb: (event: SignDataRequestEvent) => void): void {
    this.internalKit.onSignDataRequest((event: EventSignDataRequest) => {
      cb(this.signDataRequestEventMapper.map(event));
    });
  }

  /**
   * Register disconnect handler
   */
  onDisconnect(cb: (event: DisconnectionEvent) => void): void {
    this.internalKit.onDisconnect((event: EventDisconnect) => {
      cb(this.disconnectionEventMapper.map(event));
    });
  }

  /**
   * Register error handler
   * Note: Error events are passed through without mapping
   */
  onRequestError(cb: (event: EventRequestError) => void): void {
    this.internalKit.onRequestError(cb);
  }

  // === Request Processing ===

  /**
   * Approve a connect request
   * Note: Uses internal event type since approval requires the original event
   */
  async approveConnectRequest(event: EventConnectRequest): Promise<void> {
    return this.internalKit.approveConnectRequest(event);
  }

  /**
   * Reject a connect request
   */
  async rejectConnectRequest(
    event: EventConnectRequest,
    reason?: string,
    errorCode?: CONNECT_EVENT_ERROR_CODES,
  ): Promise<void> {
    return this.internalKit.rejectConnectRequest(event, reason, errorCode);
  }

  /**
   * Approve a transaction request
   */
  async approveTransactionRequest(
    event: EventTransactionRequest,
  ): Promise<TransactionApprovalResponse> {
    const result = await this.internalKit.approveTransactionRequest(event);
    return this.transactionApprovalResponseMapper.map(result);
  }

  /**
   * Reject a transaction request
   */
  async rejectTransactionRequest(
    event: EventTransactionRequest,
    reason?: string | SendTransactionRpcResponseError["error"],
  ): Promise<void> {
    return this.internalKit.rejectTransactionRequest(event, reason);
  }

  /**
   * Approve a sign data request
   */
  async signDataRequest(
    event: EventSignDataRequest,
  ): Promise<SignDataApprovalResponse> {
    const result = await this.internalKit.signDataRequest(event);
    return this.signDataApprovalResponseMapper.map(result);
  }

  /**
   * Reject a sign data request
   */
  async rejectSignDataRequest(
    event: EventSignDataRequest,
    reason?: string,
  ): Promise<void> {
    return this.internalKit.rejectSignDataRequest(event, reason);
  }

  // === Lifecycle Management ===

  /**
   * Clean shutdown
   */
  async close(): Promise<void> {
    return this.internalKit.close();
  }

  // === Internal Access ===

  /**
   * Get the underlying TonWalletKit instance for advanced operations.
   * Use with caution - this bypasses the model/mapper layer.
   */
  getInternalKit(): TonWalletKit {
    return this.internalKit;
  }
}
