/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { CryptoOnrampStatus } from '@ton/appkit';
import { formatLargeValue, truncateDecimals } from '@ton/appkit';

import { Modal } from '../../../../../components/modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/tabs';
import { Skeleton } from '../../../../../components/skeleton';
import { useI18n } from '../../../../settings/hooks/use-i18n';
import styles from './crypto-onramp-deposit-modal.module.css';
import { Button } from '../../../../../components/button';

type QrTab = 'address' | 'memo';

export interface CryptoOnrampDepositModalProps {
    open: boolean;
    onClose: () => void;
    /** Deposit address to display as QR code */
    address: string;
    /** Amount to send */
    amount: string;
    /** Token symbol, e.g. "BTC" */
    symbol: string;
    /** Deposit status */
    depositStatus: CryptoOnrampStatus | null;
    /** Optional memo / tag / comment */
    memo?: string;
    /** URL of the token logo to embed in the QR code center */
    tokenLogo?: string;
    /** Optional network-specific warning message */
    networkWarning?: string;
    /** Symbol of the target token the user is buying */
    targetSymbol?: string;
    /** User's formatted balance of the target token */
    targetBalance?: string;
    /** Decimals of the target token */
    targetDecimals?: number;
    /** Whether the target balance is loading */
    isLoadingTargetBalance?: boolean;
}

const CopyIcon: FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path
            d="M3.5 10.5H3a1.5 1.5 0 0 1-1.5-1.5V3A1.5 1.5 0 0 1 3 1.5h6A1.5 1.5 0 0 1 10.5 3v.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
        />
    </svg>
);

const CheckIcon: FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M3 8l3.5 3.5L13 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const WarningIcon: FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M6.86 2.31a1.3 1.3 0 0 1 2.28 0l5.27 9.13A1.3 1.3 0 0 1 13.27 13H2.73a1.3 1.3 0 0 1-1.14-1.56L6.86 2.31Z"
            stroke="currentColor"
            strokeWidth="1.2"
        />
        <path d="M8 6v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);

const useCopy = (text: string): [boolean, () => void] => {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return [copied, copy];
};

const truncateAddress = (address: string): string => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
};

const formatBalance = (amount?: string, decimals?: number) => {
    const trimmed = truncateDecimals(amount || '0', Math.min(5, decimals || 9));
    return formatLargeValue(trimmed, decimals);
};

export const CryptoOnrampDepositModal: FC<CryptoOnrampDepositModalProps> = ({
    open,
    onClose,
    address,
    amount,
    symbol,
    memo,
    tokenLogo,
    networkWarning,
    depositStatus,
    targetSymbol,
    targetBalance,
    targetDecimals,
    isLoadingTargetBalance,
}) => {
    const { t } = useI18n();
    const [amountCopied, copyAmount] = useCopy(`${amount} ${symbol}`);
    const [addressCopied, copyAddress] = useCopy(address);
    const [memoCopied, copyMemo] = useCopy(memo ?? '');
    const [qrTab, setQrTab] = useState<QrTab>('address');

    const qrImageSettings = tokenLogo ? { src: tokenLogo, width: 40, height: 40, excavate: true } : undefined;

    const qrValue = memo && qrTab === 'memo' ? memo : address;

    return (
        <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title={t('cryptoOnramp.depositModalTitle')}>
            <div className={styles.content}>
                {memo ? (
                    <Tabs value={qrTab} onValueChange={(v) => setQrTab(v as QrTab)}>
                        <TabsList className={styles.tabsList}>
                            <TabsTrigger value="address">{t('cryptoOnramp.addressTab')}</TabsTrigger>
                            <TabsTrigger value="memo">{t('cryptoOnramp.memoTab')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="address">
                            <div className={styles.qrWrapper}>
                                <QRCodeSVG
                                    value={address}
                                    size={200}
                                    level="H"
                                    bgColor="transparent"
                                    fgColor="var(--ta-color-text)"
                                    imageSettings={qrImageSettings}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="memo">
                            <div className={styles.qrWrapper}>
                                <QRCodeSVG
                                    value={memo}
                                    size={200}
                                    level="H"
                                    bgColor="transparent"
                                    fgColor="var(--ta-color-text)"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className={styles.qrWrapper}>
                        <QRCodeSVG
                            value={qrValue}
                            size={200}
                            level="H"
                            bgColor="transparent"
                            fgColor="var(--ta-color-text)"
                            imageSettings={qrImageSettings}
                        />
                    </div>
                )}

                <p className={styles.infoTitle}>{t('cryptoOnramp.sendExactAmount')}</p>

                <div className={styles.infoCard}>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>{t('cryptoOnramp.youNeedToSend')}</span>
                        <div className={styles.infoValueRow}>
                            <span className={styles.infoValue}>
                                {amount} {symbol}
                            </span>
                            <button
                                type="button"
                                className={styles.copyButton}
                                onClick={copyAmount}
                                aria-label="Copy amount"
                            >
                                {amountCopied ? <CheckIcon /> : <CopyIcon />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>{t('cryptoOnramp.toThisAddress')}</span>
                        <div className={styles.infoValueRow}>
                            <span className={styles.infoValue}>{truncateAddress(address)}</span>
                            <button
                                type="button"
                                className={styles.copyButton}
                                onClick={copyAddress}
                                aria-label="Copy address"
                            >
                                {addressCopied ? <CheckIcon /> : <CopyIcon />}
                            </button>
                        </div>
                    </div>

                    {memo && (
                        <>
                            <div className={styles.divider} />
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>{t('cryptoOnramp.memoTag')}</span>
                                <div className={styles.infoValueRow}>
                                    <span className={styles.infoValue}>{memo}</span>
                                    <button
                                        type="button"
                                        className={styles.copyButton}
                                        onClick={copyMemo}
                                        aria-label="Copy memo"
                                    >
                                        {memoCopied ? <CheckIcon /> : <CopyIcon />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {networkWarning && (
                    <div className={styles.warning}>
                        <span className={styles.warningIcon}>
                            <WarningIcon />
                        </span>
                        <p className={styles.warningText}>{networkWarning}</p>
                    </div>
                )}

                {targetSymbol && (
                    <div className={styles.infoCard}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>{t('cryptoOnramp.yourBalance')}</span>
                            <div className={styles.infoValueRow}>
                                {isLoadingTargetBalance ? (
                                    <Skeleton width={80} height={16} />
                                ) : (
                                    <span className={styles.infoValue}>
                                        {formatBalance(targetBalance || '0', targetDecimals)} {targetSymbol}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <Button variant={depositStatus === 'success' ? 'fill' : 'gray'} size="l" fullWidth onClick={onClose}>
                    {depositStatus === 'success' ? 'Done' : 'Close'}
                </Button>

                {depositStatus && (
                    <p className={styles.statusText}>
                        {depositStatus === 'success' && t('cryptoOnramp.statusSuccess')}
                        {depositStatus === 'pending' && t('cryptoOnramp.statusPending')}
                        {depositStatus === 'failed' && t('cryptoOnramp.statusFailed')}
                    </p>
                )}
            </div>
        </Modal>
    );
};
