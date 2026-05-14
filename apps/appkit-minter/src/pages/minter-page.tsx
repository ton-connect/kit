/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';

import { CardGenerator } from '@/features/mint';
import { Layout } from '@/core/components';

export const MinterPage: React.FC = () => {
    return (
        <Layout title="Mint NFT">
            <CardGenerator />
        </Layout>
    );
};
