/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { StakingWidget } from '@ton/appkit-react';

import { Layout } from '@/core/components';

export const StakingPage: React.FC = () => {
    return (
        <Layout title="Staking">
            <div className="w-full max-w-[434px] mx-auto">
                <StakingWidget />
            </div>
        </Layout>
    );
};
