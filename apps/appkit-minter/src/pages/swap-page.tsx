/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { Network } from '@ton/appkit';
import { SwapWidget } from '@ton/appkit-react';
import type { AppkitUIToken } from '@ton/appkit-react';

import { Card, Layout } from '@/core/components';

const TOKENS: AppkitUIToken[] = [
    {
        id: 'ton',
        symbol: 'TON',
        name: 'Toncoin',
        decimals: 9,
        address: 'ton',
        network: Network.mainnet(),
        logo: 'https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/c8d21a3d93f9b574381e0a8d8f16d48b325dd8f54ce172f599c1e9d6c62f03f7',
    },
    {
        id: 'usdt',
        symbol: 'USD₮',
        name: 'Tether USD',
        decimals: 6,
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        network: Network.mainnet(),
        rate: '1',
        logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
    },
    {
        id: 'ston',
        symbol: 'STON',
        name: 'STON',
        decimals: 9,
        address: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO',
        network: Network.mainnet(),
        logo: 'https://asset.ston.fi/img/EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO/7c9798ce1e64707fb4cb8f025d4060f66b386ed381b50498e3b88731cedeffe8',
    },
    {
        id: 'xaut',
        symbol: 'XAUt0',
        name: 'Tether Gold',
        decimals: 6,
        address: 'EQA1R_LuQCLHlMgOo1S4G7Y7W1cd0FrAkbA10Zq7rddKxi9k',
        network: Network.mainnet(),
        logo: 'https://asset.ston.fi/img/EQA1R_LuQCLHlMgOo1S4G7Y7W1cd0FrAkbA10Zq7rddKxi9k/4aaaa7c30d7811bced81ded6bc116dcc82a78c6aea53d6012fd586a5826963ad',
    },
    {
        id: 'usde',
        symbol: 'USDe',
        name: 'Ethena USDe',
        decimals: 6,
        address: 'EQAIb6KmdfdDR7CN1GBqVJuP25iCnLKCvBlJ07Evuu2dzP5f',
        network: Network.mainnet(),
        rate: '1',
        logo: 'https://asset.ston.fi/img/EQAIb6KmdfdDR7CN1GBqVJuP25iCnLKCvBlJ07Evuu2dzP5f/dbcc67993cd4aad4845a97a4a9722c6cb618123997c8112c29d4932b2739c4cd',
    },
    {
        id: 'tston',
        symbol: 'tsTON',
        name: 'Tonstakers TON',
        decimals: 9,
        address: 'EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav',
        network: Network.mainnet(),
        logo: 'https://asset.ston.fi/img/EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav/38f530facb209e4696b8aef17af51df94d16bd879926c517b07d25841da287b7',
    },
    {
        id: 'gemston',
        symbol: 'GEMSTON',
        name: 'GEMSTON',
        decimals: 9,
        address: 'EQBX6K9aXVl3nXINCyPPL86C4ONVmQ8vK360u6dykFKXpHCa',
        network: Network.mainnet(),
        logo: 'https://asset.ston.fi/img/EQBX6K9aXVl3nXINCyPPL86C4ONVmQ8vK360u6dykFKXpHCa/c6ab1e58e3b9b58a7429d38b7feab731afae2f66dc301a6c42041fdf7e9d7c9c',
    },
    {
        id: 'utya',
        symbol: 'UTYA',
        name: 'Utya',
        decimals: 9,
        address: 'EQBaCgUwOoc6gHCNln_oJzb0mVs79YG7wYoavh-o1ItaneLA',
        network: Network.mainnet(),
        logo: 'https://asset.ston.fi/img/EQBaCgUwOoc6gHCNln_oJzb0mVs79YG7wYoavh-o1ItaneLA/727e6cc971afdfa8ed9c698d0909eee9de344a0b6766ff5e4ddcc3323449d6f6',
    },
    {
        id: 'weth',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        address: 'EQBTkLAhEteZCRgRe_xMs5ZE0bMrduYxKbyzGCpXXW8dRWOT',
        network: Network.mainnet(),
        logo: 'https://asset.ston.fi/img/EQBTkLAhEteZCRgRe_xMs5ZE0bMrduYxKbyzGCpXXW8dRWOT/6267787665c30c2500dbde048e2f8a6a6d7ec58633ea038723f4ce1fab337ccb',
    },
];

export const SwapPage: React.FC = () => {
    return (
        <Layout title="Swap">
            <Card className="w-fit mx-auto">
                <SwapWidget
                    tokens={TOKENS}
                    network={Network.mainnet()}
                    fiatSymbol="$"
                    defaultFromSymbol="TON"
                    defaultToSymbol="USDT"
                />
            </Card>
        </Layout>
    );
};
