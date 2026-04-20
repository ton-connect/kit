/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useRef } from 'react';
import { usePrivy, useLoginWithTelegram } from '@privy-io/react-auth';
import type { WalletWithMetadata } from '@privy-io/react-auth';
import { useCreateWallet } from '@privy-io/react-auth/extended-chains';

type TelegramWebApp = {
    initData?: string;
    ready?: () => void;
    expand?: () => void;
    disableVerticalSwipes?: () => void;
};

function getTelegramWebApp(): TelegramWebApp | undefined {
    if (typeof window === 'undefined') return undefined;
    return (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
}

function hasMiniAppInitData(): boolean {
    const initData = getTelegramWebApp()?.initData;
    return typeof initData === 'string' && initData.length > 0;
}

export const TelegramPrivyAutoConnect = () => {
    const { ready, authenticated, user } = usePrivy();
    const { login } = useLoginWithTelegram();
    const { createWallet } = useCreateWallet();

    useEffect(() => {
        const tg = getTelegramWebApp();
        tg?.ready?.();
        tg?.expand?.();
        tg?.disableVerticalSwipes?.();
    }, []);

    const loginStarted = useRef(false);
    useEffect(() => {
        if (!ready || authenticated || loginStarted.current) return;
        if (!hasMiniAppInitData()) return;
        loginStarted.current = true;
        void login().catch(() => {
            loginStarted.current = false;
        });
    }, [ready, authenticated, login]);

    const walletStarted = useRef(false);
    useEffect(() => {
        if (!authenticated || walletStarted.current) return;
        const hasTon = user?.linkedAccounts?.some(
            (a): a is WalletWithMetadata => a.type === 'wallet' && 'chainType' in a && a.chainType === 'ton',
        );
        if (hasTon) return;
        walletStarted.current = true;
        void createWallet({ chainType: 'ton' }).catch(() => {
            walletStarted.current = false;
        });
    }, [authenticated, user, createWallet]);

    return null;
};
