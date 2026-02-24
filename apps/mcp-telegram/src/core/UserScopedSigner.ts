/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * UserScopedSigner - Wraps ISignerAdapter with user ownership verification
 *
 * All wallet IDs are prefixed with userId to ensure User A cannot
 * access User B's wallets.
 */

import type { ISignerAdapter, WalletInfo, CreateWalletParams, ImportWalletParams } from '../adapters/index.js';

/**
 * User-scoped signer wrapper.
 * Ensures all operations are scoped to the authenticated user.
 */
export class UserScopedSigner implements ISignerAdapter {
    private readonly signer: ISignerAdapter;
    private readonly userId: string;
    private readonly userPrefix: string;

    constructor(signer: ISignerAdapter, userId: string) {
        this.signer = signer;
        this.userId = userId;
        this.userPrefix = `${userId}:`;
    }

    getUserId(): string {
        return this.userId;
    }

    private scopedId(walletName: string): string {
        return `${this.userPrefix}${walletName}`;
    }

    private extractName(scopedId: string): string {
        if (scopedId.startsWith(this.userPrefix)) {
            return scopedId.slice(this.userPrefix.length);
        }
        return scopedId;
    }

    private isOwnedByUser(walletId: string): boolean {
        return walletId.startsWith(this.userPrefix);
    }

    async createWallet(params: CreateWalletParams): Promise<WalletInfo> {
        return this.signer.createWallet({
            ...params,
            walletId: this.scopedId(params.walletId),
        });
    }

    async importWallet(params: ImportWalletParams): Promise<WalletInfo> {
        return this.signer.importWallet({
            ...params,
            walletId: this.scopedId(params.walletId),
        });
    }

    async getWallet(walletId: string): Promise<WalletInfo | null> {
        const result = await this.signer.getWallet(this.scopedId(walletId));
        if (!result || !this.isOwnedByUser(result.walletId)) {
            return null;
        }
        return { ...result, walletId: this.extractName(result.walletId) };
    }

    async listWalletIds(): Promise<string[]> {
        const allIds = await this.signer.listWalletIds();
        return allIds.filter((id) => this.isOwnedByUser(id)).map((id) => this.extractName(id));
    }

    async deleteWallet(walletId: string): Promise<boolean> {
        const scoped = this.scopedId(walletId);
        const wallet = await this.signer.getWallet(scoped);
        if (!wallet || !this.isOwnedByUser(wallet.walletId)) {
            return false;
        }
        return this.signer.deleteWallet(scoped);
    }

    async signTransaction(walletId: string, unsignedBoc: string): Promise<string> {
        const scoped = this.scopedId(walletId);
        const wallet = await this.signer.getWallet(scoped);
        if (!wallet || !this.isOwnedByUser(wallet.walletId)) {
            throw new Error('Wallet not found');
        }
        return this.signer.signTransaction(scoped, unsignedBoc);
    }

    async signMessage(walletId: string, message: Buffer): Promise<Buffer> {
        const scoped = this.scopedId(walletId);
        const wallet = await this.signer.getWallet(scoped);
        if (!wallet || !this.isOwnedByUser(wallet.walletId)) {
            throw new Error('Wallet not found');
        }
        return this.signer.signMessage(scoped, message);
    }

    /**
     * Get the underlying signer adapter (bypasses user isolation).
     */
    getUnderlyingSigner(): ISignerAdapter {
        return this.signer;
    }
}
