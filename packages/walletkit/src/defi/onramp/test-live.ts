/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { OnrampManager } from './OnrampManager';
import { MoonpayProvider } from './moonpay/MoonpayProvider';
import { MercuryoProvider } from './mercuryo/MercuryoProvider';
import { Network } from '../../api/models';

async function run() {
    console.log('Initializing OnrampManager with Moonpay and Mercuryo...\n');
    const manager = new OnrampManager();

    const moonpay = new MoonpayProvider('pk_test_J3c52pXIbsTmzwUtYJKQEpKwxuGw8me');
    const mercuryo = new MercuryoProvider();

    manager.registerProvider(moonpay);
    manager.registerProvider(mercuryo);

    console.log('Fetching quotes for 100 USD to TON concurrently...\n');

    const params = {
        amount: '100',
        fiatCurrency: 'USD',
        cryptoCurrency: 'TON',
        network: Network.mainnet(),
    };

    const quotes = await manager.getQuotes(params);

    console.log('================ QUOTES RECEIVED ================');
    console.log(JSON.stringify(quotes, null, 2));
    console.log('=================================================\n');

    console.log('Building URLs for each quote...\n');
    for (const quote of quotes) {
        const url = await manager.buildOnrampUrl({
            userAddress: 'UQA3H_ugYmVZhL3hVobnMARSTUwIFKfGeyrN5Q0qI723ngyW',
            quote: quote,
        });
        console.log(`🔗 URL for [${quote.providerId}]:`);
        console.log(url);
        console.log('-------------------------------------------------\n');
    }
}

run().catch(console.error);
