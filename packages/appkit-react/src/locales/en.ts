/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default {
    // Wallet connection
    wallet: {
        connect: 'Connect',
        disconnect: 'Disconnect',
        connectWallet: 'Connect Wallet',
        noWalletsFound: 'No wallets found',
    },

    // Transaction
    transaction: {
        sendTransaction: 'Send Transaction',
        processing: 'Processing...',
        status: {
            pending: 'Processing...',
            completed: 'Success',
            failed: 'Failed',
        },
    },

    // Balances
    balances: {
        sendTon: 'Send {{ amount }} TON',
        sendJetton: 'Send {{ amount }} TON',
        sendJettonWithAmount: 'Send {{ amount }} {{ symbol }}',
    },

    // NFT
    nft: {
        onSale: 'On Sale',
    },

    // Swap
    swap: {
        title: 'Swap',
        pay: 'Pay',
        receive: 'Receive',
        max: 'MAX',
        continue: 'Continue',
        enterAmount: 'Enter an amount',
        insufficientBalance: 'Insufficient balance',
        tooManyDecimals: 'Too many decimal places',
        quoteError: 'Unable to get a quote',
        selectToken: 'Select Token',
        searchToken: 'Search...',
        settings: 'Settings',
        slippage: 'Slippage',
        slippageError: 'The maximum slippage tolerance cannot be more than 50%. The recommended range is 1%',
        slippageWarning: 'High slippage tolerance increases the risk of an unfavorable trade',
        provider: 'Provider',
    },

    // Token select
    tokenSelect: {
        otherTokens: 'Other Tokens',
        otherCurrencies: 'Other Currencies',
    },

    // Onramp
    onramp: {
        continue: 'Continue',
        selectToken: 'Token to buy',
        searchToken: 'Search tokens',
        selectCurrency: 'Select currency',
        searchCurrency: 'Search currencies',
        checkout: 'Checkout',
        buyToken: 'Buy {{ symbol }}',
        forCurrency: 'for {{ symbol }}',
        noQuotesFound: 'No quotes found',
    },

    // Staking
    staking: {
        stake: 'Stake',
        unstake: 'Unstake',
        continue: 'Stake',
        insufficientBalance: 'Insufficient balance',
        tooManyDecimals: 'Too many decimal places',
        quoteError: 'Unable to get a quote',
        youGet: 'You get',
        currentApy: 'Current APY',
        max: 'MAX',
        exchangeRate: 'Exchange rate',
        stakedBalance: 'Staked balance',
        unstakeType: 'Unstake type',
        maximumReward: 'Maximum reward',
        instant: 'Instant',
        instantLimit: 'Limit: {{ limit }}',
        maximumRewardLimit: 'Next cycle',
        whenAvailable: 'When available',
        whenAvailableLimit: 'No limits',
        yourBalance: 'Your balance',
    },
} as const;
