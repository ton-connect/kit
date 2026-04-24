/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import type { FC } from 'react';
import {
    Button,
    Input,
    Modal,
    useAppKit,
    useConnectedWallets,
    useJettonsByAddress,
    useSelectedWallet,
} from '@ton/appkit-react';
import {
    createTransferJettonTransactionForWallet,
    createTransferTonTransactionForWallet,
    getErrorMessage,
    getFormattedJettonInfo,
    PRIVY_DEFAULT_CONNECTOR_ID,
    TONCONNECT_DEFAULT_CONNECTOR_ID,
} from '@ton/appkit';
import type { WalletInterface } from '@ton/appkit';
import { getBalanceByAddressQueryKey, getJettonsByAddressQueryKey } from '@ton/appkit/queries';
import { useQueryClient } from '@tanstack/react-query';

import { TransactionStatus } from '@/features/transaction';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TON_ASSET_KEY = '__ton__';

const connectorLabel = (connectorId: string): string => {
    if (connectorId === TONCONNECT_DEFAULT_CONNECTOR_ID) return 'TonConnect';
    if (connectorId === PRIVY_DEFAULT_CONNECTOR_ID) return 'Privy';
    return connectorId;
};

const truncateAddress = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 4)}…${address.slice(-4)}`;
};

const walletOptionLabel = (wallet: WalletInterface): string =>
    `${connectorLabel(wallet.connectorId)} — ${truncateAddress(wallet.getAddress())}`;

export const DepositModal: FC<DepositModalProps> = ({ isOpen, onClose }) => {
    const appKit = useAppKit();
    const queryClient = useQueryClient();
    const wallets = useConnectedWallets();
    const [selectedWallet] = useSelectedWallet();

    const defaultSourceId = selectedWallet?.getWalletId() ?? wallets[0]?.getWalletId() ?? '';
    const [sourceId, setSourceId] = useState<string>(defaultSourceId);
    const [destinationId, setDestinationId] = useState<string>(
        wallets.find((w) => w.getWalletId() !== defaultSourceId)?.getWalletId() ?? '',
    );
    const [assetKey, setAssetKey] = useState<string>(TON_ASSET_KEY);
    const [amount, setAmount] = useState('');
    const [comment, setComment] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [txBoc, setTxBoc] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sourceWallet = useMemo(() => wallets.find((w) => w.getWalletId() === sourceId), [wallets, sourceId]);
    const destinationWallet = useMemo(
        () => wallets.find((w) => w.getWalletId() === destinationId),
        [wallets, destinationId],
    );

    const destinationOptions = useMemo(() => wallets.filter((w) => w.getWalletId() !== sourceId), [wallets, sourceId]);

    const { data: sourceJettonsData } = useJettonsByAddress({
        address: sourceWallet?.getAddress(),
        network: sourceWallet?.getNetwork(),
    });
    const sourceJettons = sourceJettonsData?.jettons ?? [];

    const resetForm = () => {
        setAmount('');
        setComment('');
        setError(null);
        setTxBoc(null);
        setAssetKey(TON_ASSET_KEY);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSourceChange = (walletId: string) => {
        setSourceId(walletId);
        setAssetKey(TON_ASSET_KEY);
        if (walletId === destinationId) {
            const nextDest = wallets.find((w) => w.getWalletId() !== walletId)?.getWalletId() ?? '';
            setDestinationId(nextDest);
        }
    };

    const invalidateBalances = async () => {
        if (!sourceWallet || !destinationWallet) return;
        const sourceNetwork = sourceWallet.getNetwork();
        const destinationNetwork = destinationWallet.getNetwork();
        const keys = [
            getBalanceByAddressQueryKey({ address: sourceWallet.getAddress(), network: sourceNetwork }),
            getBalanceByAddressQueryKey({ address: destinationWallet.getAddress(), network: destinationNetwork }),
            getJettonsByAddressQueryKey({ address: sourceWallet.getAddress(), network: sourceNetwork }),
            getJettonsByAddressQueryKey({ address: destinationWallet.getAddress(), network: destinationNetwork }),
        ];
        await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    };

    const handleSubmit = async () => {
        if (!sourceWallet || !destinationWallet || !amount) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const recipientAddress = destinationWallet.getAddress();
            let request;

            if (assetKey === TON_ASSET_KEY) {
                request = createTransferTonTransactionForWallet(sourceWallet, {
                    recipientAddress,
                    amount,
                    comment: comment || undefined,
                });
            } else {
                const jetton = sourceJettons.find((j) => j.address === assetKey);
                if (!jetton) throw new Error('Selected jetton not found in source wallet');
                const info = getFormattedJettonInfo(jetton);
                if (!info.decimals) throw new Error('Jetton decimals unavailable');

                request = await createTransferJettonTransactionForWallet(appKit, sourceWallet, {
                    jettonAddress: jetton.address,
                    jettonDecimals: info.decimals,
                    recipientAddress,
                    amount,
                    comment: comment || undefined,
                });
            }

            const { boc } = await sourceWallet.sendTransaction(request);
            setTxBoc(boc);
            void invalidateBalances();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = !!sourceWallet && !!destinationWallet && !!amount && !isSubmitting && sourceId !== destinationId;

    return (
        <Modal title="Deposit between wallets" open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            {txBoc ? (
                <div className="space-y-6">
                    <TransactionStatus boc={txBoc} />
                    <Button fullWidth onClick={handleClose}>
                        Close
                    </Button>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">From</label>
                            <select
                                value={sourceId}
                                onChange={(e) => handleSourceChange(e.target.value)}
                                className="mt-1 w-full rounded-md border border-border bg-card p-2 text-sm text-foreground"
                            >
                                {wallets.map((w) => (
                                    <option key={w.getWalletId()} value={w.getWalletId()}>
                                        {walletOptionLabel(w)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">To</label>
                            <select
                                value={destinationId}
                                onChange={(e) => setDestinationId(e.target.value)}
                                className="mt-1 w-full rounded-md border border-border bg-card p-2 text-sm text-foreground"
                            >
                                {destinationOptions.map((w) => (
                                    <option key={w.getWalletId()} value={w.getWalletId()}>
                                        {walletOptionLabel(w)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Asset</label>
                            <select
                                value={assetKey}
                                onChange={(e) => setAssetKey(e.target.value)}
                                className="mt-1 w-full rounded-md border border-border bg-card p-2 text-sm text-foreground"
                            >
                                <option value={TON_ASSET_KEY}>TON</option>
                                {sourceJettons.map((j) => {
                                    const info = getFormattedJettonInfo(j);
                                    return (
                                        <option key={j.address} value={j.address}>
                                            {info.symbol ?? 'Jetton'} ({j.balance})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <Input size="s">
                            <Input.Header>
                                <Input.Title>Amount</Input.Title>
                            </Input.Header>
                            <Input.Field>
                                <Input.Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="any"
                                    min="0"
                                />
                            </Input.Field>
                        </Input>

                        <Input size="s">
                            <Input.Header>
                                <Input.Title>Comment (optional)</Input.Title>
                            </Input.Header>
                            <Input.Field>
                                <Input.Input
                                    type="text"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add a comment"
                                />
                            </Input.Field>
                        </Input>

                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex mt-6 gap-3">
                        <Button loading={isSubmitting} disabled={!canSubmit} onClick={handleSubmit} className="flex-1">
                            Deposit
                        </Button>
                        <Button variant="secondary" onClick={handleClose} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
};
