import type { BrowserContext } from '@playwright/test';

export abstract class WalletExtension {
    /**
     * Creates an instance of Wallet
     *
     * @param context - The Playwright BrowserContext in which the extension is running
     * @param extensionId - The ID of the extension
     * @param password - The password for the Wallet
     */
    constructor(
        readonly context: BrowserContext,
        readonly extensionId: string,
        readonly password: string = 'tester@1234',
    ) {
        this.context = context;
        this.extensionId = extensionId;
        this.password = password;
    }

    /**
     * Imports a wallet using the given seed phrase
     *
     * @param mnemonic - The seed phrase to import
     */
    abstract importWallet(mnemonic: string): Promise<void>;

    abstract connect(confirm?: boolean): Promise<void>;

    abstract connectBy(url: string): Promise<void>;

    abstract accept(confirm?: boolean): Promise<void>;

    abstract signData(confirm?: boolean): Promise<void>;
}
