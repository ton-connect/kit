/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import rosetta from 'rosetta';
import en from '../locales/en';
export declare const i18n: rosetta.Rosetta<{
    readonly wallet: {
        readonly connect: "Connect";
        readonly disconnect: "Disconnect";
        readonly connectWallet: "Connect Wallet";
        readonly noWalletsFound: "No wallets found";
    };
    readonly transaction: {
        readonly sendTransaction: "Send Transaction";
        readonly processing: "Processing...";
    };
    readonly balances: {
        readonly sendTon: "Send {{ amount }} TON";
        readonly sendJetton: "Send {{ amount }} TON";
        readonly sendJettonWithAmount: "Send {{ amount }} {{ symbol }}";
    };
    readonly nft: {
        readonly onSale: "On Sale";
    };
}>;
export { en };
export declare const defaultLanguage = "en";
export type I18n = typeof i18n;
export type Dict = typeof en;
//# sourceMappingURL=i18n.d.ts.map