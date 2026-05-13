/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ton/appkit-react';

export const TabsExample = () => {
    const [tab, setTab] = useState('stake');
    // SAMPLE_START: TABS
    return (
        <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
                <TabsTrigger value="stake">Stake</TabsTrigger>
                <TabsTrigger value="unstake">Unstake</TabsTrigger>
            </TabsList>
            <TabsContent value="stake">
                <p>Stake your TON to earn rewards.</p>
            </TabsContent>
            <TabsContent value="unstake">
                <p>Withdraw your staked TON.</p>
            </TabsContent>
        </Tabs>
    );
    // SAMPLE_END: TABS
};
