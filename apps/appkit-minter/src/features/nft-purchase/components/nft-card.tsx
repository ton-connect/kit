/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { Button, useGaslessConfig, useSelectedWallet } from '@ton/appkit-react';
import type { Base64String, TransactionRequest, TransactionRequestMessage } from '@ton/appkit';
import { compareAddress, getJettonWalletAddress, Network } from '@ton/appkit';
import { beginCell, toNano } from '@ton/core';
import { Image as ImageIcon, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import { buildBuyTransaction, fetchNft } from '../api/getgems-client';
import { isFixPriceSale } from '../api/types';
import type { GetGemsNftFull, GetGemsNftOnSale } from '../api/types';
import { formatAmount, formatPrice, getCurrencyDecimals, safeBigInt } from '../lib/currency';
import { buildJettonTransferBody, getJettonMaster } from '../lib/jetton';
import { PurchaseModal } from './purchase-modal';
import type { GaslessPurchaseConfig, PurchaseDetails } from './purchase-modal';

import { appKit } from '@/core/configs/app-kit';

interface NftCardProps {
    nft: GetGemsNftOnSale;
}

const TON_DECIMALS = 9;

/** Gas attached to the jetton_transfer (matches what GetGems' own UI sends). */
const JETTON_BUY_GAS = toNano('0.5');
/** TON forwarded with jetton_notify to the sale contract. */
const JETTON_FORWARD_TON = toNano('0.35');

interface JettonBuyBuildResult {
    tx: TransactionRequest;
    jettonMaster: string;
}

async function buildJettonBuyTransaction(args: {
    nft: GetGemsNftFull;
    userAddress: string;
    currency: string;
    priceNano: bigint;
    saleContract: string;
}): Promise<JettonBuyBuildResult> {
    const master = getJettonMaster(args.currency);
    if (!master) {
        throw new Error(`Currency ${args.currency} is not supported yet`);
    }

    const userJettonWallet = await getJettonWalletAddress(appKit, {
        jettonAddress: master,
        ownerAddress: args.userAddress,
    });

    const commentCell = beginCell().storeUint(0, 32).storeStringTail('Bought on getgems.io').endCell();

    const payload = buildJettonTransferBody({
        queryId: BigInt(Date.now()),
        jettonAmount: args.priceNano,
        destination: args.saleContract,
        responseDestination: args.userAddress,
        forwardTonAmount: JETTON_FORWARD_TON,
        forwardPayload: commentCell,
    });

    const messages: TransactionRequestMessage[] = [
        {
            address: userJettonWallet,
            amount: JETTON_BUY_GAS.toString(),
            payload: payload as unknown as Base64String,
        },
    ];

    return {
        tx: {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages,
        },
        jettonMaster: master,
    };
}

export const NftCard: FC<NftCardProps> = ({ nft }) => {
    const [wallet] = useSelectedWallet();
    const { data: gaslessConfig } = useGaslessConfig();
    const [isLoadingBuy, setIsLoadingBuy] = useState(false);
    const [details, setDetails] = useState<PurchaseDetails | null>(null);

    const sale = isFixPriceSale(nft.sale) ? nft.sale : null;
    const priceLabel = sale ? `${formatPrice(sale.fullPrice, sale.currency)} ${sale.currency}` : null;

    const isMainnet = wallet?.getNetwork().chainId === Network.mainnet().chainId;

    const supportedGasJettons = useMemo(() => gaslessConfig?.supportedGasJettons ?? [], [gaslessConfig]);

    const isGaslessSupportedFor = (jettonMaster: string): boolean => {
        return supportedGasJettons.some((j) => compareAddress(j.jettonMaster, jettonMaster));
    };

    const handleBuyClick = async () => {
        if (isLoadingBuy || !wallet) return;
        setIsLoadingBuy(true);
        try {
            const fresh = await fetchNft(nft.address);
            if (!isFixPriceSale(fresh.sale)) {
                toast.error('This NFT is not on sale anymore');
                return;
            }

            const currency = fresh.sale.currency;
            const priceDecimals = getCurrencyDecimals(currency);
            const priceRaw = safeBigInt(fresh.sale.fullPrice);

            let tx: TransactionRequest;
            let networkFeeRaw: bigint;
            let gasless: GaslessPurchaseConfig | undefined;

            if (currency === 'TON') {
                const buy = await buildBuyTransaction(nft.address, fresh.sale.version);
                const messages: TransactionRequestMessage[] = buy.list.map((item) => {
                    const message: TransactionRequestMessage = { address: item.to, amount: item.amount };
                    if (item.payload) message.payload = item.payload as unknown as Base64String;
                    if (item.stateInit) message.stateInit = item.stateInit as unknown as Base64String;
                    return message;
                });
                tx = {
                    validUntil: Math.floor(new Date(buy.timeout).getTime() / 1000),
                    messages,
                };
                networkFeeRaw = buy.list.reduce((acc, item) => acc + safeBigInt(item.amount), 0n);
            } else {
                const saleContract = fresh.sale.contractAddress;
                if (!saleContract) {
                    throw new Error('Sale contract address is missing');
                }
                const built = await buildJettonBuyTransaction({
                    nft: fresh,
                    userAddress: wallet.getAddress(),
                    currency,
                    priceNano: priceRaw,
                    saleContract,
                });
                tx = built.tx;
                networkFeeRaw = JETTON_BUY_GAS;
                if (isGaslessSupportedFor(built.jettonMaster)) {
                    gasless = {
                        feeJettonMaster: built.jettonMaster,
                        messages: built.tx.messages,
                    };
                }
            }

            setDetails({
                nftName: fresh.name ?? nft.name ?? 'Untitled',
                nftImage: fresh.image ?? nft.image,
                priceAmount: formatAmount(priceRaw, priceDecimals),
                priceRaw,
                priceCurrency: currency,
                networkFeeTon: formatAmount(networkFeeRaw, TON_DECIMALS),
                tx,
                gasless,
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to prepare purchase');
        } finally {
            setIsLoadingBuy(false);
        }
    };

    return (
        <>
            <div className="flex flex-col rounded-lg border border-border bg-muted overflow-hidden">
                <div className="aspect-square bg-background/60 flex items-center justify-center">
                    {nft.image ? (
                        <img src={nft.image} alt={nft.name ?? ''} className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    )}
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{nft.name ?? 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">{priceLabel ?? 'Not for sale'}</p>
                    {sale && (
                        <div className="mt-auto">
                            {!wallet ? (
                                <Button size="s" variant="secondary" disabled className="w-full">
                                    Connect wallet
                                </Button>
                            ) : !isMainnet ? (
                                <Button size="s" variant="secondary" disabled className="w-full">
                                    Switch to mainnet
                                </Button>
                            ) : (
                                <Button
                                    size="s"
                                    variant="fill"
                                    className="w-full"
                                    onClick={handleBuyClick}
                                    loading={isLoadingBuy}
                                    icon={<ShoppingCart className="w-4 h-4" />}
                                >
                                    Buy
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {details && (
                <PurchaseModal
                    open={!!details}
                    onOpenChange={(open) => {
                        if (!open) setDetails(null);
                    }}
                    details={details}
                    onPurchased={() => setDetails(null)}
                />
            )}
        </>
    );
};
