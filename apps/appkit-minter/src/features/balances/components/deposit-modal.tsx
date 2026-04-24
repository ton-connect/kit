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
import { ArrowDown } from 'lucide-react';

import { TransactionStatus } from '@/features/transaction';
import { truncateAddress } from '@/core/utils/truncate-address';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/select';

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

const walletOptionLabel = (wallet: WalletInterface): string =>
    `${connectorLabel(wallet.connectorId)} — ${truncateAddress(wallet.getAddress(), 4, 4)}`;

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

    const handleFlip = () => {
        if (!destinationId) return;
        const nextSource = destinationId;
        const nextDestination = sourceId;
        setSourceId(nextSource);
        setDestinationId(nextDestination);
        setAssetKey(TON_ASSET_KEY);
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
                <div className="flex flex-col gap-4">
                    <TransactionStatus boc={txBoc} />
                    <Button fullWidth size="l" onClick={handleClose}>
                        Close
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <Input.Container size="m">
                        <Input.Header>
                            <Input.Title>From</Input.Title>
                        </Input.Header>
                        <Select value={sourceId} onValueChange={handleSourceChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select source wallet" />
                            </SelectTrigger>
                            <SelectContent>
                                {wallets.map((w) => (
                                    <SelectItem key={w.getWalletId()} value={w.getWalletId()}>
                                        {walletOptionLabel(w)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Input.Container>

                    <Input.Container size="s">
                        <Input.Header>
                            <Input.Title>To</Input.Title>
                        </Input.Header>
                        <Select value={destinationId} onValueChange={setDestinationId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select destination wallet" />
                            </SelectTrigger>
                            <SelectContent>
                                {destinationOptions.map((w) => (
                                    <SelectItem key={w.getWalletId()} value={w.getWalletId()}>
                                        {walletOptionLabel(w)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Input.Container>

                    <Input.Container size="s">
                        <Input.Header>
                            <Input.Title>Asset</Input.Title>
                        </Input.Header>
                        <Select value={assetKey} onValueChange={setAssetKey}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TON_ASSET_KEY}>TON</SelectItem>
                                {sourceJettons.map((j) => {
                                    const info = getFormattedJettonInfo(j);
                                    return (
                                        <SelectItem key={j.address} value={j.address}>
                                            {info.symbol ?? 'Jetton'} ({j.balance})
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </Input.Container>

                    <Input.Container size="s" error={Boolean(error)}>
                        <Input.Header>
                            <Input.Title>Amount</Input.Title>
                        </Input.Header>
                        <Input.Field>
                            <Input.Input
                                type="number"
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                step="any"
                                min="0"
                            />
                        </Input.Field>
                    </Input.Container>

                    <Input.Container size="s">
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
                    </Input.Container>

                    {error && <p className="text-xs text-error">{error}</p>}

                    <Button
                        fullWidth
                        size="l"
                        loading={isSubmitting}
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                        className="mt-2"
                    >
                        Deposit
                    </Button>
                </div>
            )}
        </Modal>
    );
};
