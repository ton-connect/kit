/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import type { Jetton } from '@ton/walletkit';

import { useFormattedJetton } from '@/hooks/useFormattedJetton';

interface JettonRowProps {
    jetton: Jetton;
    formatAddress?: (address: string) => string;
    onClick?: () => void;
    className?: string;
}

export const JettonRow: React.FC<JettonRowProps> = ({
    jetton,
    formatAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`,
    onClick,
    className = '',
}) => {
    const jettonInfo = useFormattedJetton(jetton);

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
            parent.innerHTML = jettonInfo?.symbol?.slice(0, 2)?.toUpperCase() || '';
            parent.className = parent.className.replace('bg-gray-100', 'bg-gradient-to-br from-blue-500 to-purple-600');
            parent.className += ' text-xs font-bold text-white flex items-center justify-center';
        }
    };

    if (!jettonInfo) {
        return null;
    }

    return (
        <div
            className={`group flex items-center p-4 border border-gray-200 rounded-xl 
                hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer
                bg-white hover:bg-gray-50/50 min-w-0 select-none ${className}`}
            onClick={onClick}
        >
            {/* Left Section - Icon and Info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Token Icon */}
                <div className="relative flex-shrink-0 select-none">
                    <div
                        className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden
                        ring-2 ring-gray-100 group-hover:ring-gray-200 transition-all duration-200"
                    >
                        {jettonInfo.image ? (
                            <img
                                src={jettonInfo.image}
                                alt={jettonInfo.name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={handleImageError}
                            />
                        ) : (
                            <div
                                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full
                                flex items-center justify-center"
                            >
                                <span className="text-sm font-bold text-white">
                                    {jettonInfo.symbol?.slice(0, 2).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    {/* Verification Badge */}
                    {/*{jetton.verification?.verified && (*/}
                    {/*    <div*/}
                    {/*        className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full*/}
                    {/*        flex items-center justify-center ring-2 ring-white select-none"*/}
                    {/*    >*/}
                    {/*        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">*/}
                    {/*            <path*/}
                    {/*                fillRule="evenodd"*/}
                    {/*                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"*/}
                    {/*                clipRule="evenodd"*/}
                    {/*            />*/}
                    {/*        </svg>*/}
                    {/*    </div>*/}
                    {/*)}*/}
                </div>

                {/* Token Info */}
                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center space-x-2 min-w-0">
                        <h3 className="text-left text-base font-semibold text-gray-900 truncate">
                            {jettonInfo.name || jettonInfo.symbol}
                        </h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md flex-shrink-0 select-none">
                            {jettonInfo.symbol && jettonInfo.symbol?.length > 6
                                ? `${jettonInfo.symbol.slice(0, 6)}...`
                                : jettonInfo.symbol}
                        </span>
                    </div>
                    <div className="mt-1">
                        <p className="text-left text-sm text-gray-500 font-mono truncate">
                            {formatAddress(jetton.address)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Section - Balance and Value */}
            <div className="text-right flex-shrink-0 ml-4 min-w-0 max-w-[140px] select-none">
                <div className="space-y-1">
                    <p className="text-base font-semibold text-gray-900 truncate">{jettonInfo.balance}</p>
                    {/*{jetton.usdValue && (*/}
                    {/*    <p className="text-sm text-gray-500 font-medium truncate">*/}
                    {/*        ≈ $*/}
                    {/*        {parseFloat(jetton.usdValue).toLocaleString('en-US', {*/}
                    {/*            minimumFractionDigits: 2,*/}
                    {/*            maximumFractionDigits: 2,*/}
                    {/*        })}*/}
                    {/*    </p>*/}
                    {/*)}*/}
                </div>

                {/* Hover Arrow */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 select-none">
                    <svg
                        className="w-4 h-4 text-gray-400 ml-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
