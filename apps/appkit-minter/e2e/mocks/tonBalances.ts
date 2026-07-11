/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Page, Route } from '@playwright/test';

/**
 * Route mocks for the account-state + jetton-balance reads the minter issues for
 * the connected wallet. Without these the gate depends on a live, *funded* wallet
 * (real USDT) and the live indexer to populate the transfer asset list — the same
 * class of external dependency the relayer mocks remove for `/v2/gasless/*`.
 *
 * The minter picks its indexer backend from `VITE_TON_API_PROVIDER` (default
 * `toncenter`; `tonapi` when set), so both contracts are mocked and the gate is
 * hermetic either way:
 *   - Toncenter: `GET /api/v3/addressInformation`, `GET /api/v3/jetton/wallets`
 *   - TonAPI:    `GET /v2/blockchain/accounts/{a}`, `GET /v2/accounts/{a}/jettons`
 *
 * Not installed for `@real-send` specs — those broadcast on-chain and must read the
 * wallet's real balances (see the fixture).
 */

/** USDT (Tether) mainnet master. The Toncenter jetton mapper keys metadata by the
 * raw master and the minter's asset-row testid uses the friendly master, so both
 * forms are pinned here and must resolve to the same address. */
const USDT_MASTER_FRIENDLY = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const USDT_MASTER_RAW = '0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE';
/** A valid, parseable stand-in jetton-wallet address. Never broadcast (the relayer
 * send is mocked); used only so the address mappers can normalize it. */
const JETTON_WALLET_RAW = '0:7C873E096984BCEB6F2169BE1C99FD6614C1C5C86B39E2A8A66C764648DC81F9';

const IMAGE = 'https://tether.to/images/logoCircle.png';

const json = (route: Route, body: unknown) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

export interface BalancesOpts {
    /** Raw TON/GRAM balance in nanotons. Default 5 GRAM — comfortably above any gas floor. */
    tonBalanceNano?: string;
    /** Raw USDT balance (6 decimals). Default 5 USDT. `'0'` ⇒ no spendable USDT. */
    usdtBalanceRaw?: string;
}

/**
 * Mock account state + jetton balances so a connected wallet always shows a funded
 * TON balance and a spendable USDT jetton, regardless of the wallet's real holdings.
 */
export async function mockTonBalances(page: Page, opts: BalancesOpts = {}): Promise<void> {
    const ton = opts.tonBalanceNano ?? '5000000000';
    const usdt = opts.usdtBalanceRaw ?? '5000000';

    // --- Toncenter (default backend) ---
    await page.route(/\/api\/v3\/addressInformation/, (route) =>
        json(route, {
            balance: ton,
            status: 'active',
            code: null,
            data: null,
            // Non-null tx id: the mapper parses these, so mirror the wire shape
            // (base64 hash + numeric-string lt) rather than nulls.
            last_transaction_hash: 'uToBwqQdeCqUK79AwRofY+YhWt/CjPRxm0UN2bxrJeA=',
            last_transaction_lt: '1',
            frozen_hash: null,
            extra_currencies: [],
        }),
    );
    await page.route(/\/api\/v3\/jetton\/wallets/, (route) =>
        json(route, {
            jetton_wallets: [
                {
                    address: JETTON_WALLET_RAW,
                    balance: usdt,
                    owner: JETTON_WALLET_RAW,
                    jetton: USDT_MASTER_RAW,
                    last_transaction_lt: '0',
                    code_hash: '',
                    data_hash: '',
                },
            ],
            address_book: {},
            // Toncenter carries jetton name/symbol/decimals in `metadata`, not on the
            // wallet row — the mapper reads them from here, so it must be present.
            metadata: {
                [USDT_MASTER_RAW]: {
                    is_indexed: true,
                    token_info: [
                        {
                            type: 'jetton_masters',
                            name: 'Tether USD',
                            symbol: 'USDT',
                            description: '',
                            image: IMAGE,
                            extra: { decimals: '6' },
                        },
                    ],
                },
            },
        }),
    );

    // --- TonAPI (only reached when VITE_TON_API_PROVIDER=tonapi) ---
    await page.route(/\/v2\/blockchain\/accounts\/[^/]+$/, (route) =>
        json(route, {
            address: USDT_MASTER_FRIENDLY,
            balance: Number(ton),
            status: 'active',
            code: null,
            data: null,
            last_transaction_lt: 0,
            last_transaction_hash: null,
            frozen_hash: null,
        }),
    );
    await page.route(/\/v2\/accounts\/[^/]+\/jettons/, (route) =>
        json(route, {
            balances: [
                {
                    balance: usdt,
                    wallet_address: { address: JETTON_WALLET_RAW, is_scam: false, is_wallet: false },
                    jetton: {
                        address: USDT_MASTER_FRIENDLY,
                        name: 'Tether USD',
                        symbol: 'USDT',
                        decimals: 6,
                        image: IMAGE,
                        verification: 'whitelist',
                        score: 100,
                    },
                },
            ],
        }),
    );
}
