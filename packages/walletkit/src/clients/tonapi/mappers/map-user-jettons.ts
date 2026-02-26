/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Jetton, JettonsResponse } from '../../../api/models';
import { asAddressFriendly } from '../../../utils/address';
import type { TonApiJettonsBalances } from '../types/jettons';

export function mapUserJettons(rawResponse: TonApiJettonsBalances): JettonsResponse {
    const userJettons: Jetton[] = rawResponse.balances.map((wallet) => {
        const isVerified = wallet.jetton.verification === 'whitelist';

        const jetton: Jetton = {
            address: asAddressFriendly(wallet.jetton.address),
            walletAddress: asAddressFriendly(wallet.wallet_address.address),
            balance: wallet.balance,
            info: {
                name: wallet.jetton.name,
                description: '', // TonApi does not provide description here
                image: {
                    url: wallet.jetton.image,
                },
                symbol: wallet.jetton.symbol,
            },
            decimalsNumber: wallet.jetton.decimals,
            prices: wallet.price
                ? Object.entries(wallet.price.prices).map(([currency, value]) => ({
                      value: value.toString(),
                      currency: currency.toUpperCase(),
                  }))
                : [
                      {
                          value: '0',
                          currency: 'USD',
                      },
                  ],
            isVerified: isVerified,
        };
        return jetton;
    });

    return {
        jettons: userJettons,
        addressBook: {},
    };
}
