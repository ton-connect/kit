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

import { Modal } from '../../../../../components/modal';
import { useI18n } from '../../../../settings/hooks/use-i18n';
import styles from './crypto-onramp-deposit-modal.module.css';

export interface CryptoOnrampDepositModalProps {
    open: boolean;
    onClose: () => void;
    /** Deposit address to display as QR code */
    address: string;
    /** Amount to send */
    amount: string;
    /** Token symbol, e.g. "BTC" */
    symbol: string;
    /** URL of the token logo to embed in the QR code center */
    tokenLogo?: string;
    /** Optional network-specific warning message */
    networkWarning?: string;
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

const ChevronIcon: FC<{ open: boolean }> = ({ open }) => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}
    >
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

export const CryptoOnrampDepositModal: FC<CryptoOnrampDepositModalProps> = ({
    open,
    onClose,
    address,
    amount,
    symbol,
    tokenLogo,
    networkWarning,
}) => {
    const { t } = useI18n();
    const [amountCopied, copyAmount] = useCopy(`${amount} ${symbol}`);
    const [addressCopied, copyAddress] = useCopy(address);
    const [detailsOpen, setDetailsOpen] = useState(false);

    return (
        <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title={t('cryptoOnramp.sendExactAmount')}>
            <div className={styles.content}>
                <div className={styles.qrWrapper}>
                    <QRCodeSVG
                        value={address}
                        size={200}
                        level="M"
                        imageSettings={
                            tokenLogo
                                ? {
                                      src: tokenLogo,
                                      width: 40,
                                      height: 40,
                                      excavate: true,
                                  }
                                : undefined
                        }
                    />
                </div>

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
                </div>

                <button
                    type="button"
                    className={styles.detailsToggle}
                    onClick={() => setDetailsOpen((prev) => !prev)}
                    aria-expanded={detailsOpen}
                >
                    <span>{t('cryptoOnramp.transactionDetails')}</span>
                    <ChevronIcon open={detailsOpen} />
                </button>

                {networkWarning && (
                    <div className={styles.warning}>
                        <span className={styles.warningIcon}>
                            <WarningIcon />
                        </span>
                        <p className={styles.warningText}>{networkWarning}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};
