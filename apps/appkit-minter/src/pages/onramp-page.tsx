/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { CryptoOnrampWidget } from '@ton/appkit-react';

import { Layout } from '@/core/components';
import {
    ONRAMP_DEFAULT_METHOD_ID,
    ONRAMP_DEFAULT_TOKEN_ID,
    ONRAMP_PAYMENT_METHODS,
    ONRAMP_TOKENS,
} from '@/core/configs/onramp';

export const OnrampPage: React.FC = () => {
    return (
        <Layout title="Buy">
            <div className="w-full max-w-[422px] mx-auto">
                <CryptoOnrampWidget
                    tokens={ONRAMP_TOKENS}
                    defaultTokenId={ONRAMP_DEFAULT_TOKEN_ID}
                    paymentMethods={ONRAMP_PAYMENT_METHODS}
                    defaultMethodId={ONRAMP_DEFAULT_METHOD_ID}
                />
            </div>
        </Layout>
    );
};
