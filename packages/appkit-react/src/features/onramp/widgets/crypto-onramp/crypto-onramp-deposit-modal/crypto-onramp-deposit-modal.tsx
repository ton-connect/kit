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

import { Button } from '../../../../../components/ui/button';
import { CopyButton } from '../../../../../components/copy-button';
import { Modal } from '../../../../../components/ui/modal';
import { Skeleton } from '../../../../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/ui/tabs';
import { useI18n } from '../../../../settings/hooks/use-i18n';
import { formatOnrampAmount } from '../utils/format-onramp-amount';
import { truncateAddress } from '../utils/truncate-address';
import styles from './crypto-onramp-deposit-modal.module.css';

type QrTab = 'address' | 'memo';

const QR_SIZE = 200;
const QR_LOGO_SIZE = 40;
const BALANCE_SKELETON_WIDTH = 80;
const BALANCE_SKELETON_HEIGHT = 16;

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
    /** Optional chain-specific warning message */
    chainWarning?: string;
    /** Symbol of the target token the user is buying */
    targetSymbol?: string;
    /** User's formatted balance of the target token */
    targetBalance?: string;
    /** Decimals of the target token */
    targetDecimals?: number;
    /** Whether the target balance is loading */
    isLoadingTargetBalance?: boolean;
}

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

export const CryptoOnrampDepositModal: FC<CryptoOnrampDepositModalProps> = ({
    open,
    onClose,
    address,
    amount,
    symbol,
    memo,
    tokenLogo,
    chainWarning,
    depositStatus,
    targetSymbol,
    targetBalance,
    targetDecimals,
    isLoadingTargetBalance,
}) => {
    const { t } = useI18n();
    const [qrTab, setQrTab] = useState<QrTab>('address');

    const qrImageSettings = tokenLogo
        ? { src: tokenLogo, width: QR_LOGO_SIZE, height: QR_LOGO_SIZE, excavate: true }
        : undefined;
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
                                    size={QR_SIZE}
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
                                    size={QR_SIZE}
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
                            size={QR_SIZE}
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
                            <CopyButton value={`${amount} ${symbol}`} aria-label="Copy amount" />
                        </div>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>{t('cryptoOnramp.toThisAddress')}</span>
                        <div className={styles.infoValueRow}>
                            <span className={styles.infoValue}>{truncateAddress(address)}</span>
                            <CopyButton value={address} aria-label="Copy address" />
                        </div>
                    </div>

                    {memo && (
                        <>
                            <div className={styles.divider} />
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>{t('cryptoOnramp.memoTag')}</span>
                                <div className={styles.infoValueRow}>
                                    <span className={styles.infoValue}>{memo}</span>
                                    <CopyButton value={memo} aria-label="Copy memo" />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {chainWarning && (
                    <div className={styles.warning}>
                        <span className={styles.warningIcon}>
                            <WarningIcon />
                        </span>
                        <p className={styles.warningText}>{chainWarning}</p>
                    </div>
                )}

                {targetSymbol && (
                    <div className={styles.infoCard}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>{t('cryptoOnramp.yourBalance')}</span>
                            <div className={styles.infoValueRow}>
                                {isLoadingTargetBalance ? (
                                    <Skeleton width={BALANCE_SKELETON_WIDTH} height={BALANCE_SKELETON_HEIGHT} />
                                ) : (
                                    <span className={styles.infoValue}>
                                        {formatOnrampAmount(targetBalance || '0', targetDecimals)} {targetSymbol}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <Button variant={depositStatus === 'success' ? 'fill' : 'gray'} size="l" fullWidth onClick={onClose}>
                    {depositStatus === 'success' ? t('cryptoOnramp.done') : t('cryptoOnramp.close')}
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
