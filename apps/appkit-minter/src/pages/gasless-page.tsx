/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import {
    useGaslessConfig,
    useSendGaslessTransaction,
    useAddress,
    useJettonBalanceByAddress,
    useJettonWalletAddress,
} from '@ton/appkit-react';
import type { Base64String } from '@ton/appkit-react';
import { parseUnits, createJettonTransferPayload, compareAddress } from '@ton/appkit';
import { toast } from 'sonner';

import { Card, Layout } from '@/core/components';

const USDT_MASTER_MAINNET = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

export const GaslessPage: FC = () => {
    const address = useAddress();
    const { data: gaslessConfig, isLoading: isConfigLoading } = useGaslessConfig();
    const { mutateAsync: sendGasless, isPending: isSending } = useSendGaslessTransaction();

    const [amount, setAmount] = useState('0.1');
    const [recipient, setRecipient] = useState('');

    const { data: usdtBalance } = useJettonBalanceByAddress({
        jettonAddress: USDT_MASTER_MAINNET,
        ownerAddress: address,
        jettonDecimals: 6,
    });

    const { data: usdtWalletAddress } = useJettonWalletAddress({
        jettonAddress: USDT_MASTER_MAINNET,
        ownerAddress: address,
    });

    // Set own address as default recipient
    useEffect(() => {
        if (address && !recipient) {
            setRecipient(address);
        }
    }, [address, recipient]);

    const isUsdtSupported = useMemo(() => {
        return gaslessConfig?.supportedGasJettons.some((j) => compareAddress(j.jettonMaster, USDT_MASTER_MAINNET));
    }, [gaslessConfig]);

    const handleSend = async () => {
        if (!address || !usdtWalletAddress) {
            toast.error(!address ? 'Wallet not connected' : 'Could not resolve USDT wallet address');
            return;
        }

        try {
            const payload = createJettonTransferPayload({
                amount: parseUnits(amount, 6), // USDT has 6 decimals
                destination: recipient,
                responseDestination: address,
            });

            await sendGasless({
                feeJettonMaster: USDT_MASTER_MAINNET,
                messages: [
                    {
                        address: usdtWalletAddress,
                        amount: parseUnits('0.06', 9).toString(),
                        payload: payload.toBoc().toString('base64') as Base64String,
                    },
                ],
            });

            toast.success('Gasless transaction submitted!');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Gasless error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to send gasless transaction');
        }
    };

    return (
        <Layout title="Gasless Transfer">
            <Card className="w-full max-w-[434px] mx-auto p-6 space-y-6">
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Send USDT (Gasless)</h2>
                    <p className="text-sm text-muted-foreground">
                        Send USDT without having TON for gas. The fee will be paid in USDT.
                    </p>
                </div>

                {!address && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 text-sm">
                        Please connect your wallet first.
                    </div>
                )}

                {address && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium uppercase text-muted-foreground">
                                Your USDT Balance
                            </label>
                            <div className="text-lg font-mono">
                                {usdtBalance ? Number(usdtBalance).toFixed(2) : '0.00'} USDT
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Recipient Address</label>
                            <input
                                className="w-full p-2 bg-secondary rounded-md border border-border"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="Address"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Amount (USDT)</label>
                            <input
                                className="w-full p-2 bg-secondary rounded-md border border-border"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <button
                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50"
                            onClick={handleSend}
                            disabled={isSending || isConfigLoading || !isUsdtSupported}
                        >
                            {isSending ? 'Sending...' : isUsdtSupported ? 'Send Gasless' : 'USDT Not Supported'}
                        </button>

                        {!isConfigLoading && !isUsdtSupported && (
                            <p className="text-xs text-red-500 text-center">
                                Relayer does not support USDT for gas fees on this network.
                            </p>
                        )}
                    </div>
                )}
            </Card>
        </Layout>
    );
};
