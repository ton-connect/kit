/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo, useState } from 'react';
import type { ComponentProps, FC } from 'react';
import {
    Button,
    TonConnectButton,
    useConnect,
    useConnectedWallets,
    useDisconnect,
    useSelectedWallet,
} from '@ton/appkit-react';
import { TONCONNECT_DEFAULT_CONNECTOR_ID } from '@ton/appkit';
import { ChevronDown, Plus, Wallet } from 'lucide-react';

import { WalletCard } from './wallet-card';

import { cn } from '@/core/lib/utils';
import { truncateAddress } from '@/core/utils/truncate-address';
import { Popover, PopoverContent, PopoverTrigger } from '@/core/components/popover';

export const HeaderWallet: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
    const wallets = useConnectedWallets();
    const [selectedWallet, setWalletId] = useSelectedWallet();
    const { mutate: disconnect, isPending: isDisconnecting } = useDisconnect();
    const { mutate: connect, isPending: isConnecting } = useConnect();

    const [isOpen, setIsOpen] = useState(false);
    const [copiedWalletId, setCopiedWalletId] = useState<string | null>(null);

    const selectedWalletId = selectedWallet?.getWalletId() ?? null;
    const selectedAddress = selectedWallet?.getAddress() ?? '';

    const hasTonConnect = useMemo(
        () => wallets.some((w) => w.connectorId === TONCONNECT_DEFAULT_CONNECTOR_ID),
        [wallets],
    );

    const handleCopy = useCallback(async (walletId: string, address: string) => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopiedWalletId(walletId);
        setTimeout(() => setCopiedWalletId((prev) => (prev === walletId ? null : prev)), 2000);
    }, []);

    const handleSelect = useCallback(
        (walletId: string) => {
            if (walletId !== selectedWalletId) setWalletId(walletId);
            setIsOpen(false);
        },
        [selectedWalletId, setWalletId],
    );

    const handleDisconnect = useCallback(
        (connectorId: string) => {
            disconnect({ connectorId });
        },
        [disconnect],
    );

    const handleAddTonConnect = useCallback(() => {
        connect({ connectorId: TONCONNECT_DEFAULT_CONNECTOR_ID });
        setIsOpen(false);
    }, [connect]);

    if (wallets.length === 0) {
        return (
            <div className={className} {...props}>
                <TonConnectButton />
            </div>
        );
    }

    const canAddTonConnect = !hasTonConnect;
    const isMultiWallet = wallets.length > 1;

    return (
        <div className={className} {...props}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="secondary" size="s" aria-haspopup="menu" icon={<Wallet className="size-4" />}>
                        <span>{truncateAddress(selectedAddress)}</span>
                        <ChevronDown className={cn('size-3.5 transition-transform', isOpen && 'rotate-180')} />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-80" align="center">
                    <div className="flex flex-col gap-1">
                        {wallets.map((wallet) => {
                            const walletId = wallet.getWalletId();
                            return (
                                <WalletCard
                                    key={walletId}
                                    wallet={wallet}
                                    isActive={walletId === selectedWalletId}
                                    selectable={isMultiWallet}
                                    isCopied={copiedWalletId === walletId}
                                    isDisconnecting={isDisconnecting}
                                    onSelect={() => handleSelect(walletId)}
                                    onCopy={() => void handleCopy(walletId, wallet.getAddress())}
                                    onDisconnect={() => handleDisconnect(wallet.connectorId)}
                                />
                            );
                        })}
                    </div>

                    {canAddTonConnect && (
                        <div className="mx-auto">
                            <Button
                                variant="ghost"
                                size="s"
                                onClick={handleAddTonConnect}
                                disabled={isConnecting}
                                loading={isConnecting}
                                icon={<Plus className="size-3.5" />}
                                className="px-2 py-1 text-xs"
                            >
                                Add TonConnect Wallet
                            </Button>
                        </div>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    );
};
