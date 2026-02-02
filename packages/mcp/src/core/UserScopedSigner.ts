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
 * access User B's wallets. Returns generic "not found" error for both
 * missing and unauthorized wallets to prevent enumeration attacks.
 */

import type { ISignerAdapter, WalletInfo, CreateWalletParams, ImportWalletParams } from '../types/signer.js';

/**
 * User-scoped signer wrapper.
 * Ensures all operations are scoped to the authenticated user.
 */
export class UserScopedSigner {
    private readonly signer: ISignerAdapter;
    private readonly userId: string;
    private readonly userPrefix: string;

    constructor(signer: ISignerAdapter, userId: string) {
        this.signer = signer;
        this.userId = userId;
        this.userPrefix = `${userId}:`;
    }

    /**
     * Get the user ID this signer is scoped to
     */
    getUserId(): string {
        return this.userId;
    }

    /**
     * Build user-scoped wallet ID from wallet name
     */
    private scopedId(walletName: string): string {
        return `${this.userPrefix}${walletName}`;
    }

    /**
     * Extract wallet name from scoped ID
     */
    private extractName(scopedId: string): string {
        if (scopedId.startsWith(this.userPrefix)) {
            return scopedId.slice(this.userPrefix.length);
        }
        return scopedId;
    }

    /**
     * Check if a wallet ID belongs to this user
     */
    private isOwnedByUser(walletId: string): boolean {
        return walletId.startsWith(this.userPrefix);
    }

    /**
     * Transform wallet info to expose wallet name instead of internal ID
     */
    private transformWalletInfo(info: WalletInfo): WalletInfo & { name: string } {
        return {
            ...info,
            name: this.extractName(info.walletId),
        };
    }

    /**
     * Create a new wallet (user-scoped)
     */
    async createWallet(
        params: Omit<CreateWalletParams, 'walletId'> & { name: string },
    ): Promise<WalletInfo & { name: string }> {
        const result = await this.signer.createWallet({
            walletId: this.scopedId(params.name),
            version: params.version,
            network: params.network,
        });
        return this.transformWalletInfo(result);
    }

    /**
     * Import a wallet from mnemonic (user-scoped)
     * Note: Mnemonic is passed to signer and stored securely, never returned
     */
    async importWallet(
        params: Omit<ImportWalletParams, 'walletId'> & { name: string },
    ): Promise<WalletInfo & { name: string }> {
        const result = await this.signer.importWallet({
            walletId: this.scopedId(params.name),
            mnemonic: params.mnemonic,
            version: params.version,
            network: params.network,
        });
        return this.transformWalletInfo(result);
    }

    /**
     * Get wallet by name (user-scoped)
     * Returns null for both "not found" and "not owned" to prevent enumeration
     */
    async getWallet(walletName: string): Promise<(WalletInfo & { name: string }) | null> {
        const walletId = this.scopedId(walletName);
        const wallet = await this.signer.getWallet(walletId);

        if (!wallet) {
            return null;
        }

        // Verify ownership (should always match due to scoped ID, but double-check)
        if (!this.isOwnedByUser(wallet.walletId)) {
            return null;
        }

        return this.transformWalletInfo(wallet);
    }

    /**
     * List all wallets for this user
     */
    async listWallets(): Promise<(WalletInfo & { name: string })[]> {
        const allIds = await this.signer.listWalletIds();
        const userIds = allIds.filter((id) => this.isOwnedByUser(id));

        const wallets = await Promise.all(
            userIds.map(async (id) => {
                const wallet = await this.signer.getWallet(id);
                return wallet ? this.transformWalletInfo(wallet) : null;
            }),
        );

        return wallets.filter((w): w is WalletInfo & { name: string } => w !== null);
    }

    /**
     * Delete a wallet (user-scoped)
     * Returns false for both "not found" and "not owned"
     */
    async deleteWallet(walletName: string): Promise<boolean> {
        const walletId = this.scopedId(walletName);

        // Verify ownership before deletion
        const wallet = await this.signer.getWallet(walletId);
        if (!wallet || !this.isOwnedByUser(wallet.walletId)) {
            return false;
        }

        return this.signer.deleteWallet(walletId);
    }

    /**
     * Sign a transaction (user-scoped)
     * Verifies ownership before signing
     */
    async signTransaction(walletName: string, unsignedBoc: string): Promise<string> {
        const walletId = this.scopedId(walletName);

        // Verify ownership before signing
        const wallet = await this.signer.getWallet(walletId);
        if (!wallet || !this.isOwnedByUser(wallet.walletId)) {
            throw new Error('Wallet not found');
        }

        return this.signer.signTransaction(walletId, unsignedBoc);
    }

    /**
     * Sign a message (user-scoped)
     * Verifies ownership before signing
     */
    async signMessage(walletName: string, message: Buffer): Promise<Buffer> {
        const walletId = this.scopedId(walletName);

        // Verify ownership before signing
        const wallet = await this.signer.getWallet(walletId);
        if (!wallet || !this.isOwnedByUser(wallet.walletId)) {
            throw new Error('Wallet not found');
        }

        return this.signer.signMessage(walletId, message);
    }

    /**
     * Get the underlying signer adapter.
     * Use with caution - bypasses user isolation.
     */
    getUnderlyingSigner(): ISignerAdapter {
        return this.signer;
    }
}
