/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { TonConnectButton } from '@ton/appkit-react';

import Balance from '../balance';

export const dynamic = 'force-dynamic';

export default function Home() {
    return (
        <div className="flex flex-col gap-4 min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <TonConnectButton />
            <Balance />
        </div>
    );
}
