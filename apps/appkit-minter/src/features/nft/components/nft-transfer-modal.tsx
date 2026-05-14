/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { NFT } from '@ton/appkit';
import { getFormattedNftInfo, createTransferNftTransaction, getErrorMessage } from '@ton/appkit';
import { Send, useAppKit, Button, Input, Modal } from '@ton/appkit-react';
import { toast } from 'sonner';
import { Image as ImageIcon } from 'lucide-react';

interface NftTransferModalProps {
    nft: NFT;
    isOpen: boolean;
    onClose: () => void;
}

export const NftTransferModal: React.FC<NftTransferModalProps> = ({ nft, isOpen, onClose }) => {
    const [recipientAddress, setRecipientAddress] = useState('');
    const [comment, setComment] = useState('');
    const [transferError, setTransferError] = useState<string | null>(null);

    const appKit = useAppKit();

    const nftInfo = useMemo(() => getFormattedNftInfo(nft), [nft]);

    const createTransferTransaction = useCallback(async () => {
        return createTransferNftTransaction(appKit, {
            nftAddress: nft.address,
            recipientAddress,
            comment,
        });
    }, [appKit, nft.address, recipientAddress, comment]);

    const handleClose = () => {
        setRecipientAddress('');
        setComment('');
        setTransferError(null);
        onClose();
    };

    return (
        <Modal title="Transfer NFT" open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            {/* NFT Preview */}
            <div className="mb-4">
                <div className="w-full h-48 bg-tertiary rounded-lg flex items-center justify-center overflow-hidden mb-3">
                    {nftInfo.image ? (
                        <img src={nftInfo.image} alt={nftInfo.name} className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="w-16 h-16 text-tertiary-foreground" />
                    )}
                </div>
                <h4 className="font-medium text-foreground">{nftInfo.name}</h4>
                <p className="text-sm text-tertiary-foreground">{nftInfo.collectionName}</p>
                {nftInfo.description && (
                    <p className="text-xs text-tertiary-foreground/70 mt-1">{nftInfo.description}</p>
                )}
            </div>

            <div className="space-y-4">
                <Input size="s">
                    <Input.Header>
                        <Input.Title>Recipient Address</Input.Title>
                    </Input.Header>
                    <Input.Field>
                        <Input.Input
                            type="text"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            placeholder="Enter TON address"
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

                {transferError && (
                    <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
                        <p className="text-sm text-error">{transferError}</p>
                    </div>
                )}
            </div>

            <div className="flex mt-6 gap-3">
                <Send
                    request={createTransferTransaction}
                    onSuccess={() => {
                        handleClose();
                        toast.success('NFT transferred successfully');
                    }}
                    onError={(error: Error) => {
                        setTransferError(getErrorMessage(error));
                    }}
                    disabled={!recipientAddress}
                >
                    {({ isLoading, onSubmit, disabled, text }) => (
                        <Button loading={isLoading} onClick={onSubmit} disabled={disabled} className="flex-1">
                            {text}
                        </Button>
                    )}
                </Send>

                <Button variant="secondary" onClick={handleClose} className="flex-1">
                    Cancel
                </Button>
            </div>
        </Modal>
    );
};
