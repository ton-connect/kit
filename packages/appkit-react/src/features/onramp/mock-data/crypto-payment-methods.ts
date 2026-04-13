/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoPaymentMethod } from '../types';

export const CRYPTO_PAYMENT_METHODS: CryptoPaymentMethod[] = [
    {
        id: 'ton',
        symbol: 'TON',
        name: 'Toncoin',
        network: 'TON',
        networkId: 'ton',
        logo: 'https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/c8d21a3d93f9b574381e0a8d8f16d48b325dd8f54ce172f599c1e9d6c62f03f7',
        depositAddress: 'EQC0000000000000000000000000000000000000000000000001',
    },
    {
        id: 'btc',
        symbol: 'BTC',
        name: 'Bitcoin',
        network: 'Bitcoin',
        networkId: 'bitcoin',
        logo: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png',
        depositAddress: 'bc1qgq026aa8sttge7afejvml5kkxhjk39x53fs58',
    },
    {
        id: 'usdt-tron',
        symbol: 'USDT',
        name: 'Tether',
        network: 'Tron',
        networkId: 'tron',
        logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
        networkLogo: 'https://coin-images.coingecko.com/coins/images/22471/large/xOesRfpN_400x400.jpg',
        depositAddress: 'TXyz1234567890abcdefghijklmnopqrstuvwxy',
    },
    {
        id: 'usdt-eth',
        symbol: 'USDT',
        name: 'Tether',
        network: 'Ethereum',
        networkId: 'ethereum',
        logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
        networkLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
        depositAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    },
    {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        network: 'Ethereum',
        networkId: 'ethereum',
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
        depositAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    },
    {
        id: 'usdc',
        symbol: 'USDC',
        name: 'USD Coin',
        network: 'Ethereum',
        networkId: 'ethereum',
        logo: 'https://assets.coingecko.com/coins/images/6319/standard/USDC.png?1769615602',
        networkLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
        depositAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    },
    {
        id: 'sol',
        symbol: 'SOL',
        name: 'Solana',
        network: 'Solana',
        networkId: 'solana',
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
        depositAddress: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
    },
];
