/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import { useJettons } from '@demo/wallet-core';
import type { Jetton } from '@ton/walletkit';
import type { SwapToken } from '@ton/walletkit';

import { cn } from '@/lib/utils';
import { USDT_ADDRESS } from '@/constants/swap';
import { getJettonsImage, getJettonsSymbol } from '@/utils/jetton';
import { CircleLogo } from '@/components/CircleLogo';

interface TokenSelectorProps {
    selectedToken: SwapToken;
    onTokenSelect: (token: SwapToken) => void;
    excludeToken?: SwapToken;
    placeholder?: string;
    className?: string;
}

const getTokenSymbol = (token: SwapToken, jetton?: Jetton): string => {
    if (token.type === 'ton') return 'TON';
    if (token.type === 'jetton' && token.value === USDT_ADDRESS) return 'USDT';

    if (jetton) {
        const symbol = getJettonsSymbol(jetton);
        return symbol || 'Unknown';
    }

    return 'Unknown';
};

export const TokenSelector: FC<TokenSelectorProps> = ({
    selectedToken,
    // onTokenSelect,
    // excludeToken,
    placeholder = 'Select token',
    className,
}) => {
    const { userJettons } = useJettons();

    // const [open, setOpen] = useState(false);

    // const handleTokenSelect = (tokenAddress: string) => {
    //     onTokenSelect(tokenAddress);
    //     setOpen(false);
    // };

    const selectedTokenInfo = useMemo(() => {
        const symbol = getTokenSymbol(selectedToken);

        if (selectedToken.type === 'jetton') {
            const jetton = userJettons.find((j) => j.address === selectedToken.value);
            const icon = jetton ? getJettonsImage(jetton) : undefined;

            return { symbol, icon };
        }

        return {
            symbol,
            icon: '/ton.svg',
        };
    }, [selectedToken]);

    return (
        <>
            <button
                className={cn(
                    'flex h-9 items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-md',
                    // 'hover:bg-gray-50',
                    !!selectedToken && 'px-2',
                    className,
                )}
                // onClick={() => setOpen(true)}
                disabled
            >
                {selectedTokenInfo ? (
                    <div className="flex items-center gap-2">
                        <CircleLogo.Container className="size-6">
                            <CircleLogo.Image src={selectedTokenInfo.icon} />
                            <CircleLogo.Fallback>{selectedTokenInfo.symbol[0]}</CircleLogo.Fallback>
                        </CircleLogo.Container>

                        <div className="text-left">
                            <p className="font-semibold text-sm">{selectedTokenInfo.symbol}</p>
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-500 text-sm">{placeholder}</span>
                )}
                {/*<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
                {/*    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />*/}
                {/*</svg>*/}
            </button>

            {/*<Modal.Container isOpen={open} onClose={() => setOpen(false)}>*/}
            {/*    <Modal.Header onClose={() => setOpen(false)}>*/}
            {/*        <Modal.Title>Select a token</Modal.Title>*/}
            {/*    </Modal.Header>*/}

            {/*    <Modal.Body className="space-y-2">*/}
            {/*        {availableTokens.map((token) => (*/}
            {/*            <button*/}
            {/*                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-100"*/}
            {/*                key={token.address}*/}
            {/*                onClick={() => handleTokenSelect(token.address)}*/}
            {/*            >*/}
            {/*                <div className="flex w-10 h-10 items-center justify-center rounded-full bg-blue-100">*/}
            {/*                    <span className="text-lg">{token.icon}</span>*/}
            {/*                </div>*/}
            {/*                <div className="flex-1 text-left">*/}
            {/*                    <p className="font-semibold text-sm">{token.symbol}</p>*/}
            {/*                    <p className="text-gray-500 text-xs">{token.name}</p>*/}
            {/*                </div>*/}
            {/*            </button>*/}
            {/*        ))}*/}
            {/*    </Modal.Body>*/}
            {/*</Modal.Container>*/}
        </>
    );
};
