/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Balance } from '../components/balance';
import { Header } from '../components/header';

export default function Home() {
    return (
        <div className="flex flex-col gap-4 min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <Header />
            <Balance />
        </div>
    );
}
