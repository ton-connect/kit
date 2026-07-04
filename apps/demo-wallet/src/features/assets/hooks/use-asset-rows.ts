/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useMemo, useState } from 'react';
import { useJettons, useRates, useWallet, useWalletKit } from '@demo/wallet-core';
import type { JettonInfo } from '@ton/walletkit';

import type { AssetRowData } from '../components/asset-row';

import { getJettonsName, getJettonsSymbol } from '@/features/jettons';
import { findRate, formatRate, toDecimal, tokenImageUrls } from '@/core/utils';

const GRAM_DECIMALS = 9;

/**
 * Base tokens always surfaced on mainnet (for discoverability) even at a zero balance, so a
 * fresh wallet shows Gram + these below the native row. Held balances always win: if the user
 * holds one of these, its live row (with the real balance) replaces the zero-balance base row.
 * The hardcoded name/symbol are only a fallback shown until live metadata loads. Addresses are
 * the mainnet jetton masters and MUST match the on-chain contracts.
 */
const DEFAULT_JETTONS: { address: string; symbol: string; name: string }[] = [
    { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', symbol: 'USDT', name: 'Tether USD' },
    { address: 'EQA1R_LuQCLHlMgOo1S4G7Y7W1cd0FrAkbA10Zq7rddKxi9k', symbol: 'XAUT', name: 'Tether Gold' },
];

/** Candidate icon URLs (best-first), appending the inline base64 image as a last resort. */
export const imageSources = (urls: string[] | undefined, dataBase64?: string): string[] => [
    ...(urls ?? []),
    ...(dataBase64 ? [`data:image/png;base64,${dataBase64}`] : []),
];

interface AssetRows {
    tonRow: AssetRowData | null;
    /**
     * Jetton rows sorted by fiat value desc (verified first as a tiebreaker): every held jetton,
     * plus — on mainnet — the {@link DEFAULT_JETTONS} base tokens at a zero balance when not held.
     */
    jettonRows: AssetRowData[];
    assetsReady: boolean;
}

/**
 * Builds the TON row + a row per jetton. Shared by the dashboard preview and the full assets
 * page, so both surfaces show the SAME list (the preview renders its first N). On mainnet the
 * {@link DEFAULT_JETTONS} base tokens are always included (at a zero balance if not held) for
 * discoverability; held jettons are merged in and win on any address collision.
 */
export const useAssetRows = (): AssetRows => {
    const { balance, currentWallet, getActiveWallet } = useWallet();
    const { userJettons, lastJettonsUpdate } = useJettons();
    const { entries: rates, lastUpdated: ratesUpdated } = useRates();
    const walletKit = useWalletKit();

    const assetsReady = balance !== undefined && lastJettonsUpdate > 0 && ratesUpdated > 0;

    const isMainnet = getActiveWallet()?.network === 'mainnet';

    // Live metadata (name/icon) for the base tokens, fetched from the API — mainnet only. Until
    // it arrives the base rows fall back to the hardcoded def name/symbol.
    const [defaultInfos, setDefaultInfos] = useState<Record<string, JettonInfo>>({});
    useEffect(() => {
        if (!isMainnet || !walletKit || !currentWallet) return;
        const network = currentWallet.getNetwork();
        let cancelled = false;
        void Promise.all(
            DEFAULT_JETTONS.map((def) => walletKit.jettons.getJettonInfo(def.address, network).catch(() => null)),
        ).then((infos) => {
            if (cancelled) return;
            const next: Record<string, JettonInfo> = {};
            infos.forEach((info, i) => {
                if (info) next[DEFAULT_JETTONS[i].address] = info;
            });
            setDefaultInfos(next);
        });
        return () => {
            cancelled = true;
        };
    }, [isMainnet, walletKit, currentWallet]);

    const tonRow = useMemo<AssetRowData | null>(() => {
        if (!assetsReady) return null;
        const rateEntry = rates['GRAM'];
        const amount = toDecimal(balance, GRAM_DECIMALS);
        return {
            id: 'TON',
            icon: '/gram.svg',
            fallbackText: 'GR',
            name: 'Gram',
            symbol: 'GRAM',
            amount,
            rateLabel: rateEntry ? formatRate(rateEntry.rate) : undefined,
            fiat: rateEntry ? amount * rateEntry.rate : undefined,
        };
    }, [assetsReady, balance, rates]);

    const jettonRows = useMemo<AssetRowData[]>(() => {
        if (!assetsReady) return [];

        const held = userJettons.map((jetton) => {
            const rateEntry = findRate(rates, jetton.address);
            const decimals = jetton.decimalsNumber ?? 9;
            const amount = toDecimal(jetton.balance, decimals);
            const symbol = getJettonsSymbol(jetton) ?? '';
            return {
                row: {
                    id: jetton.address,
                    icon: imageSources(tokenImageUrls(jetton.info?.image), jetton.info?.image?.data),
                    fallbackText: symbol.slice(0, 2).toUpperCase() || '??',
                    name: getJettonsName(jetton) ?? symbol,
                    symbol,
                    amount,
                    rateLabel: rateEntry ? formatRate(rateEntry.rate) : undefined,
                    fiat: rateEntry ? amount * rateEntry.rate : undefined,
                } satisfies AssetRowData,
                isVerified: jetton.isVerified,
            };
        });

        // Mainnet: add each base token the wallet doesn't already hold as a zero-balance row
        // (dedupe against held jettons by address; held wins so its real balance is kept).
        const combined = [...held];
        if (isMainnet) {
            const heldByAddress = new Map(userJettons.map((jetton) => [jetton.address, jetton]));
            for (const def of DEFAULT_JETTONS) {
                if (heldByAddress.has(def.address)) continue;
                const info = defaultInfos[def.address];
                const rateEntry = findRate(rates, def.address);
                const amount = 0;
                combined.push({
                    row: {
                        id: def.address,
                        icon: imageSources(info?.image ? [info.image] : undefined, info?.image_data),
                        fallbackText: def.symbol.slice(0, 2).toUpperCase(),
                        name: info?.name || def.name,
                        symbol: info?.symbol || def.symbol,
                        amount,
                        rateLabel: rateEntry ? formatRate(rateEntry.rate) : undefined,
                        fiat: rateEntry ? amount * rateEntry.rate : undefined,
                    } satisfies AssetRowData,
                    // Canonical mainnet tokens are verified: keeps them above unverified junk in
                    // the sort, but below any held token that has a fiat value.
                    isVerified: true,
                });
            }
        }

        return combined
            .sort((a, b) => (b.row.fiat ?? 0) - (a.row.fiat ?? 0) || Number(b.isVerified) - Number(a.isVerified))
            .map((entry) => entry.row);
    }, [assetsReady, userJettons, rates, isMainnet, defaultInfos]);

    return { tonRow, jettonRows, assetsReady };
};
