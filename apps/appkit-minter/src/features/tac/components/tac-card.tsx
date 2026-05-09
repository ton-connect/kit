/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';
import { useSmartAccountAddress } from '@tac/appkit-provider';

import { Card } from '@/core/components';

export const TacCard: FC = () => {
    const [applicationAddress, setApplicationAddress] = useState('');

    const { data: smartAccountAddress, isLoading, isError, error } = useSmartAccountAddress(applicationAddress);

    return (
        <Card title="TAC Smart Account">
            <div className="flex flex-col gap-3">
                <div>
                    <label
                        className="mb-1 block text-sm font-medium text-muted-foreground"
                        htmlFor="tac-application-address"
                    >
                        EVM Application Address
                    </label>
                    <input
                        id="tac-application-address"
                        type="text"
                        value={applicationAddress}
                        onChange={(e) => setApplicationAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div className="space-y-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Smart Account Address</span>
                        <span className="font-medium text-foreground">
                            {isLoading && '…'}
                            {isError && <span className="text-destructive">{error?.message ?? '—'}</span>}
                            {!isLoading && !isError && (smartAccountAddress ?? '—')}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
};
