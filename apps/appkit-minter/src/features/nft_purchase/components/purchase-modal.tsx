/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';
import { AlertCircle, Image as ImageIcon, ShoppingCart } from 'lucide-react';
import { Button, Modal, Send, useSendGaslessTransaction } from '@ton/appkit-react';
import type { TransactionRequest, TransactionRequestMessage } from '@ton/appkit';
import { getErrorMessage } from '@ton/appkit';
import { toast } from 'sonner';

export interface GaslessPurchaseConfig {
    feeJettonMaster: string;
    messages: TransactionRequestMessage[];
}

export interface PurchaseDetails {
    nftName: string;
    nftImage?: string | null;
    priceAmount: string;
    priceCurrency: string;
    networkFeeTon: string;
    tx: TransactionRequest;
    gasless?: GaslessPurchaseConfig;
}

interface PurchaseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    details: PurchaseDetails;
    onPurchased: () => void;
}

export const PurchaseModal: FC<PurchaseModalProps> = ({ open, onOpenChange, details, onPurchased }) => {
    const [confirmed, setConfirmed] = useState(false);
    const { mutateAsync: sendGasless, isPending: isGaslessSending } = useSendGaslessTransaction();

    const isGasless = !!details.gasless;

    const handleGaslessBuy = async () => {
        if (!details.gasless) return;
        try {
            await sendGasless({
                feeJettonMaster: details.gasless.feeJettonMaster,
                messages: details.gasless.messages,
            });
            toast.success('Purchase sent');
            onPurchased();
            onOpenChange(false);
        } catch (error) {
            toast.error(getErrorMessage(error instanceof Error ? error : new Error(String(error))));
        }
    };

    return (
        <Modal open={open} onOpenChange={onOpenChange} title="Buy NFT">
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-background/60 flex items-center justify-center shrink-0">
                        {details.nftImage ? (
                            <img src={details.nftImage} alt={details.nftName} className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                    </div>
                    <p className="font-semibold text-foreground truncate">{details.nftName}</p>
                </div>

                <div className="bg-muted rounded-lg divide-y divide-border">
                    <div className="p-3 flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold">NFT price</p>
                            <p className="text-xs text-muted-foreground">Includes service fee and royalties</p>
                        </div>
                        <p className="text-sm font-semibold shrink-0">
                            {details.priceAmount} {details.priceCurrency}
                        </p>
                    </div>
                    <div className="p-3 flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold">Network fee</p>
                            <p className="text-xs text-muted-foreground">
                                {isGasless
                                    ? `Paid in ${details.priceCurrency} via gasless relayer`
                                    : 'Unused part will be refunded to your wallet'}
                            </p>
                        </div>
                        <p className="text-sm font-semibold shrink-0">
                            {isGasless ? `Gasless` : `${details.networkFeeTon} TON`}
                        </p>
                    </div>
                </div>

                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-destructive">Warning</p>
                            <p className="text-xs text-foreground mt-1">
                                You are buying an NFT without a verification mark. It may be a counterfeit item.
                                Double-check the NFT before purchase.
                            </p>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className="text-sm">I understand the risks</span>
                    </label>
                </div>

                {isGasless ? (
                    <Button
                        size="m"
                        variant="fill"
                        className="w-full"
                        onClick={handleGaslessBuy}
                        disabled={!confirmed || isGaslessSending}
                        loading={isGaslessSending}
                        icon={<ShoppingCart className="w-4 h-4" />}
                    >
                        Buy for {details.priceAmount} {details.priceCurrency} (Gasless)
                    </Button>
                ) : (
                    <Send
                        request={details.tx}
                        onSuccess={() => {
                            toast.success('Purchase sent');
                            onPurchased();
                            onOpenChange(false);
                        }}
                        onError={(error: Error) => toast.error(getErrorMessage(error))}
                        disabled={!confirmed}
                    >
                        {({ isLoading, onSubmit, disabled }) => (
                            <Button
                                size="m"
                                variant="fill"
                                className="w-full"
                                onClick={onSubmit}
                                disabled={disabled}
                                loading={isLoading}
                                icon={<ShoppingCart className="w-4 h-4" />}
                            >
                                Buy for {details.priceAmount} {details.priceCurrency}
                            </Button>
                        )}
                    </Send>
                )}
            </div>
        </Modal>
    );
};
