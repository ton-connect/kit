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
    ButtonWithConnect,
    InfoBlock,
    Input,
    useAddress,
    useGaslessConfig,
    useJettonBalanceByAddress,
    useJettonWalletAddress,
    useSendGaslessTransaction,
} from '@ton/appkit-react';
import type { Base64String } from '@ton/appkit-react';
import { compareAddress, createJettonTransferPayload, parseUnits } from '@ton/appkit';
import { toast } from 'sonner';

import { Layout } from '@/core/components';

const USDT_MASTER_MAINNET = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const USDT_DECIMALS = 6;

export const GaslessPage: FC = () => {
    const address = useAddress();
    const { data: gaslessConfig, isLoading: isConfigLoading } = useGaslessConfig();
    const { mutateAsync: sendGasless, isPending: isSending } = useSendGaslessTransaction();

    const [amount, setAmount] = useState('0.1');
    const [recipient, setRecipient] = useState('');

    const { data: usdtBalance, isLoading: isBalanceLoading } = useJettonBalanceByAddress({
        jettonAddress: USDT_MASTER_MAINNET,
        ownerAddress: address,
        jettonDecimals: USDT_DECIMALS,
    });

    const { data: usdtWalletAddress } = useJettonWalletAddress({
        jettonAddress: USDT_MASTER_MAINNET,
        ownerAddress: address,
    });

    useEffect(() => {
        if (address && !recipient) setRecipient(address);
    }, [address, recipient]);

    const isUsdtSupported = useMemo(
        () => gaslessConfig?.supportedGasJettons.some((j) => compareAddress(j.jettonMaster, USDT_MASTER_MAINNET)),
        [gaslessConfig],
    );

    const buttonText = useMemo(() => {
        if (isSending) return 'Sending…';
        if (isConfigLoading) return 'Loading…';
        if (!isUsdtSupported) return 'USDT Not Supported';
        return 'Send Gasless';
    }, [isSending, isConfigLoading, isUsdtSupported]);

    const canSubmit =
        Boolean(address) &&
        Boolean(usdtWalletAddress) &&
        Boolean(isUsdtSupported) &&
        Boolean(recipient) &&
        Number(amount) > 0;

    const handleSend = async () => {
        if (!address || !usdtWalletAddress) {
            toast.error(!address ? 'Wallet not connected' : 'Could not resolve USDT wallet address');
            return;
        }

        try {
            const payload = createJettonTransferPayload({
                amount: parseUnits(amount, USDT_DECIMALS),
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
        <Layout title="Gasless">
            <div className="w-full max-w-[440px] mx-auto flex flex-col gap-4">
                <p className="text-sm text-tertiary-foreground mb-3">
                    Send USDT without TON for gas — the fee is paid in USDT.
                </p>

                <Input.Container size="s">
                    <Input.Header>
                        <Input.Title>Recipient</Input.Title>
                    </Input.Header>
                    <Input.Field>
                        <Input.Input
                            placeholder="UQ… or EQ…"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                        />
                    </Input.Field>
                </Input.Container>

                <Input.Container size="s">
                    <Input.Header>
                        <Input.Title>Amount (USDT)</Input.Title>
                    </Input.Header>
                    <Input.Field>
                        <Input.Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </Input.Field>
                </Input.Container>

                <InfoBlock.Container>
                    <InfoBlock.Row>
                        <InfoBlock.Label>Your USDT balance</InfoBlock.Label>
                        {isBalanceLoading ? (
                            <InfoBlock.ValueSkeleton />
                        ) : (
                            <InfoBlock.Value>
                                {usdtBalance ? Number(usdtBalance).toFixed(2) : '0.00'} USDT
                            </InfoBlock.Value>
                        )}
                    </InfoBlock.Row>
                    <InfoBlock.Row>
                        <InfoBlock.Label>Gas fee</InfoBlock.Label>
                        <InfoBlock.Value>Paid in USDT</InfoBlock.Value>
                    </InfoBlock.Row>
                </InfoBlock.Container>

                <ButtonWithConnect
                    variant="fill"
                    size="l"
                    fullWidth
                    disabled={!canSubmit || isSending || isConfigLoading}
                    loading={isSending}
                    onClick={handleSend}
                >
                    {buttonText}
                </ButtonWithConnect>

                {!isConfigLoading && !isUsdtSupported && (
                    <p className="text-xs text-error text-center">
                        Relayer does not support USDT for gas fees on this network.
                    </p>
                )}
            </div>
        </Layout>
    );
};
