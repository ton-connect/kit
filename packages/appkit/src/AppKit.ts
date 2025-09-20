// Main AppKit class that bridges TonConnect SDK to TonWalletKit

import TonConnect, { SendTransactionRequest, Wallet } from '@tonconnect/sdk';
import { TonWalletKit, ConnectTransactionParamContent, ApiClient } from '@ton/walletkit';

import { AppKit, AppKitConfig, TonConnectWalletWrapper } from './types';
import { TonConnectWalletWrapperImpl } from './TonConnectWalletWrapper';

/**
 * AppKit - Bridge between @tonconnect/sdk and TonWalletKit
 *
 * Usage:
 * ```typescript
 * import { TonWalletKit } from '@ton/walletkit';
 * import { AppKit } from '@ton/appkit';
 * import { Wallet } from '@tonconnect/sdk';
 *
 * // Initialize TonWalletKit (your wallet app)
 * const walletKit = new TonWalletKit({ ... });
 *
 * // Initialize AppKit
 * const appKit = new AppKit({ walletKit });
 *
 * // In your dApp, connect with TonConnect
 * const tonConnectWallet = new Wallet();
 * await tonConnectWallet.connect({ ... });
 *
 * // Wrap the TonConnect wallet to get TonWalletKit-compatible interface
 * const wrappedWallet = appKit.wrapWallet(tonConnectWallet);
 *
 * // Now you can use TonWalletKit wallet interface
 * const transaction = await wrappedWallet.createTransferTonTransaction({
 *   toAddress: 'EQC....',
 *   amount: '1000000000', // 1 TON in nanotons
 *   comment: 'Hello from AppKit!'
 * });
 *
 * // This will trigger confirmation in the actual wallet app via TonWalletKit
 * await walletKit.handleNewTransaction(wrappedWallet, transaction);
 * ```
 */
export class AppKitImpl implements AppKit {
    private readonly config: AppKitConfig;
    private readonly tonConnect: TonConnect;
    private readonly client: ApiClient;
    // private readonly walletKit: TonWalletKit;

    constructor(config: AppKitConfig, tonConnect: TonConnect, client: ApiClient) {
        this.config = config;
        this.tonConnect = tonConnect;
        this.client = client;
        // this.walletKit = config.walletKit;
    }

    /**
     * Create a TonWalletKit-compatible wrapper for a TonConnect wallet
     */
    wrapWallet(wallet: Wallet): TonConnectWalletWrapper {
        // if (!wallet.connected) {
        //     throw new Error('TonConnect wallet must be connected before wrapping');
        // }

        return new TonConnectWalletWrapperImpl({
            tonConnectWallet: wallet,
            tonConnect: this.tonConnect,
            client: this.client,
        });
    }

    async handleNewTransaction(
        wallet: TonConnectWalletWrapper,
        transaction: ConnectTransactionParamContent,
    ): Promise<{ boc: string }> {
        const tonConnectWallet = this.tonConnect.wallet;
        if (!tonConnectWallet) {
            throw new Error('TonConnect wallet is not connected');
        }
        if (tonConnectWallet.account.address !== wallet.getAddress()) {
            throw new Error('Wallet address does not match');
        }
        const result = await this.tonConnect.sendTransaction(transaction as SendTransactionRequest);
        return result;
    }

    /**
     * Get the underlying TonWalletKit instance
     */
    // getWalletKit(): TonWalletKit {
    //     return this.walletKit;
    // }

    /**
     * Helper method to send transaction through the wrapper
     * This will trigger confirmation in the actual wallet app
     */
    // async sendTransactionWithConfirmation(
    //     wrappedWallet: TonConnectWalletWrapper,
    //     transactionData: ConnectTransactionParamContent,
    // ): Promise<void> {
    //     // Use TonWalletKit to handle the transaction
    //     // This will trigger the confirmation flow in the actual wallet
    //     await this.walletKit.handleNewTransaction(wrappedWallet, transactionData);
    // }
}
