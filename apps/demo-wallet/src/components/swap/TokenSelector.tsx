/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useState } from 'react';

import { Modal } from '../Modal';

import { cn } from '@/lib/utils';
import { USDT_ADDRESS } from '@/constants/swap';

interface Token {
    address: string;
    symbol: string;
    name: string;
    icon: string;
}

const AVAILABLE_TOKENS: Token[] = [
    {
        address: 'TON',
        symbol: 'TON',
        name: 'Toncoin',
        icon: '💎',
    },
    {
        address: USDT_ADDRESS,
        symbol: 'USDT',
        name: 'Tether USD',
        icon: '💵',
    },
];

interface TokenSelectorProps {
    selectedToken: string;
    onTokenSelect: (token: string) => void;
    excludeToken?: string;
    placeholder?: string;
    className?: string;
}

export const TokenSelector: FC<TokenSelectorProps> = ({
    selectedToken,
    onTokenSelect,
    excludeToken,
    placeholder = 'Select token',
    className,
}) => {
    const [open, setOpen] = useState(false);

    const selectedTokenInfo = AVAILABLE_TOKENS.find((t) => t.address === selectedToken);
    const availableTokens = AVAILABLE_TOKENS.filter((token) => token.address !== excludeToken);

    const handleTokenSelect = (tokenAddress: string) => {
        onTokenSelect(tokenAddress);
        setOpen(false);
    };

    return (
        <>
            <button
                className={cn(
                    'flex h-9 items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50',
                    !!selectedToken && 'px-2',
                    className,
                )}
                onClick={() => setOpen(true)}
                disabled
            >
                {selectedTokenInfo ? (
                    <div className="flex items-center gap-2">
                        <div className="flex w-6 h-6 items-center justify-center rounded-full bg-blue-100">
                            <span className="text-sm">{selectedTokenInfo.icon}</span>
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-sm">{selectedTokenInfo.symbol}</p>
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-500 text-sm">{placeholder}</span>
                )}
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <Modal.Container isOpen={open} onClose={() => setOpen(false)}>
                <Modal.Header onClose={() => setOpen(false)}>
                    <Modal.Title>Select a token</Modal.Title>
                </Modal.Header>

                <Modal.Body className="space-y-2">
                    {availableTokens.map((token) => (
                        <button
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-100"
                            key={token.address}
                            onClick={() => handleTokenSelect(token.address)}
                        >
                            <div className="flex w-10 h-10 items-center justify-center rounded-full bg-blue-100">
                                <span className="text-lg">{token.icon}</span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-sm">{token.symbol}</p>
                                <p className="text-gray-500 text-xs">{token.name}</p>
                            </div>
                        </button>
                    ))}
                </Modal.Body>
            </Modal.Container>
        </>
    );
};
