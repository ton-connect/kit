/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';

import { Button } from '../../../../components/button';
import { SwapField } from '../swap-field';
import { SwapFlipButton } from '../swap-flip-button';
import { SwapInfo } from '../swap-info';
import { SwapSettingsButton } from '../swap-settings-button';
import styles from './swap-widget.module.css';

const TOKENS = {
    TON: {
        symbol: 'TON',
        name: 'Toncoin',
        price: 1.4474,
        balance: '500',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_40000635_2620)">
                    <path
                        d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37257 18.6274 0 12 0C5.37257 0 0 5.37257 0 12C0 18.6274 5.37257 24 12 24Z"
                        fill="#0098EA"
                    />
                    <path
                        d="M16.0977 6.69763H7.90266C6.39588 6.69763 5.44086 8.32299 6.19891 9.63695L11.2566 18.4033C11.5866 18.9757 12.4137 18.9757 12.7438 18.4033L17.8024 9.63695C18.5595 8.32509 17.6044 6.69763 16.0987 6.69763H16.0977ZM11.2525 15.7744L10.151 13.6426L7.49324 8.88922C7.31791 8.58497 7.53447 8.1951 7.90163 8.1951H11.2514V15.7754L11.2525 15.7744ZM16.505 8.88819L13.8483 13.6437L12.7468 15.7744V8.19407H16.0966C16.4638 8.19407 16.6804 8.58395 16.505 8.88819Z"
                        fill="white"
                    />
                </g>
                <defs>
                    <clipPath id="clip0_40000635_2620">
                        <rect width="24" height="24" fill="white" />
                    </clipPath>
                </defs>
            </svg>
        ),
    },
    USDT: {
        symbol: 'USDT',
        name: 'Tether USD',
        price: 1.0,
        balance: '12 843',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_40000635_2635)">
                    <path d="M0 0H24V24H0V0Z" fill="#009393" />
                    <path
                        d="M11.9976 20.1425L3.42618 11.6868L6.69618 6.42822H17.299L20.569 11.6868L11.9976 20.1425ZM12.8547 12.4282V11.3825C14.3976 11.4597 15.8376 11.7597 16.2833 12.1497C15.7647 12.6039 13.909 12.9339 11.9976 12.9339C10.0862 12.9339 8.23046 12.6039 7.71189 12.1497C8.15332 11.7597 9.59761 11.4639 11.1405 11.3782V12.4282H12.8547ZM7.71189 12.1454V12.7754C8.15332 13.1654 9.59332 13.4611 11.1405 13.5468V15.8568H12.8547V13.5425C14.3976 13.4654 15.8419 13.1654 16.2833 12.7754V11.5197C15.8419 11.1297 14.3976 10.8297 12.8547 10.7482V9.85679H15.4262V8.57108H8.56903V9.85679H11.1405V10.7482C9.59332 10.8297 8.15332 11.1297 7.71189 11.5197V12.1454Z"
                        fill="white"
                    />
                </g>
                <defs>
                    <clipPath id="clip0_40000635_2635">
                        <rect width="24" height="24" rx="12" fill="white" />
                    </clipPath>
                </defs>
            </svg>
        ),
    },
};

export const SwapWidget: FC = () => {
    const [payToken, setPayToken] = useState<keyof typeof TOKENS>('TON');
    const [receiveToken, setReceiveToken] = useState<keyof typeof TOKENS>('USDT');
    const [payAmount, setPayAmount] = useState('100');
    const [slippage] = useState(0.5);
    const [rotated, setRotated] = useState(false);

    const payTokenData = TOKENS[payToken];
    const receiveTokenData = TOKENS[receiveToken];

    const payNum = parseFloat(payAmount) || 0;
    const payUSD = (payNum * payTokenData.price).toFixed(2);
    const receiveNum = (payNum * payTokenData.price) / receiveTokenData.price;
    const receiveDisplay = receiveNum > 0 ? (receiveNum >= 1 ? receiveNum.toFixed(2) : receiveNum.toFixed(6)) : '0';
    const receiveUSD = (receiveNum * receiveTokenData.price).toFixed(2);

    const handleFlip = () => {
        setRotated(!rotated);
        const prevPay = payToken;
        const prevReceive = receiveToken;
        setPayToken(prevReceive);
        setReceiveToken(prevPay);
        setPayAmount(receiveDisplay);
    };

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <h2 className={styles.headerTitle}>Swap</h2>
                <SwapSettingsButton />
            </div>

            <div className={styles.fieldsContainer}>
                <SwapField
                    type="pay"
                    tokenSymbol={payTokenData.symbol}
                    tokenIcon={payTokenData.icon}
                    amount={payAmount}
                    onAmountChange={setPayAmount}
                    usdValue={payUSD}
                    balance={payTokenData.balance}
                    onMaxClick={() => setPayAmount(payTokenData.balance.replace(/\s/g, ''))}
                />

                <div className={styles.flipButtonWrapper}>
                    <SwapFlipButton onClick={handleFlip} rotated={rotated} />
                </div>

                <SwapField
                    type="receive"
                    tokenSymbol={receiveTokenData.symbol}
                    tokenIcon={receiveTokenData.icon}
                    amount={receiveDisplay}
                    onAmountChange={() => {}} // Read-only for now
                    usdValue={receiveUSD}
                    balance={receiveTokenData.balance}
                />
            </div>

            {payNum > 0 && (
                <SwapInfo
                    rows={[
                        { label: 'Provider', value: 'STON.fi' },
                        { label: 'Price', value: `1 ${payToken} ≈ $${payTokenData.price.toFixed(4)}` },
                        { label: 'Fees', value: `$ ${(payNum * 0.01).toFixed(2)}` },
                        { label: 'Price impact', value: '0.01%' },
                        { label: 'Slippage', value: `${slippage}%` },
                    ]}
                />
            )}

            <Button variant="fill" size="l" fullWidth style={{ marginTop: '8px' }} disabled={payNum <= 0}>
                {payNum <= 0 ? 'Enter an amount' : 'Continue'}
            </Button>
        </div>
    );
};
