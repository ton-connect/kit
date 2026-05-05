/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { useJettons } from '@demo/wallet-core';

import { Button } from './Button';
import { Card } from './Card';
import { JettonRow } from './JettonRow';
import { createComponentLogger } from '../utils/logger';

import { getJettonsName } from '@/utils/jetton';

const log = createComponentLogger('JettonsCard');

interface JettonsCardProps {
    className?: string;
    embedded?: boolean;
}

export const JettonsCard: React.FC<JettonsCardProps> = ({ className = '', embedded = false }) => {
    const { userJettons, error, loadUserJettons } = useJettons();

    const formatAddress = (address: string): string => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const topJettons = userJettons.slice(0, 3);
    const totalJettons = userJettons.length;

    const errorContent = (
        <div className="text-center py-4">
            <div className="text-red-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>
            <p className="text-sm text-red-600 mb-3">Failed to load jettons</p>
            <Button size="sm" variant="secondary" onClick={() => loadUserJettons()}>
                Try Again
            </Button>
        </div>
    );

    if (error) {
        return embedded ? (
            <div className={className}>{errorContent}</div>
        ) : (
            <Card title="Jettons" className={className}>
                {errorContent}
            </Card>
        );
    }

    const mainContent =
        totalJettons === 0 ? (
            <div className="text-center py-4">
                <p className="text-sm text-gray-500">No jettons yet</p>
            </div>
        ) : (
            <div className="space-y-2">
                {topJettons.map((jetton) => (
                    <JettonRow
                        key={jetton.address}
                        jetton={jetton}
                        formatAddress={formatAddress}
                        onClick={() => log.info('Jetton clicked:', getJettonsName(jetton))}
                        inline
                    />
                ))}
                {totalJettons > 3 && <p className="text-xs text-gray-500 text-center pt-1">+{totalJettons - 3} more</p>}
            </div>
        );

    const wrapper = (children: React.ReactNode) =>
        embedded ? (
            <div className={`border-t border-gray-100 pt-3 mt-3 ${className}`}>{children}</div>
        ) : (
            <Card title="Jettons" className={className}>
                {children}
            </Card>
        );

    return wrapper(mainContent);
};
