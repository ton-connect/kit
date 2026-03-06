/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReactNode } from 'react';

import { DashboardHeader } from './dashboard-header';

export function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <DashboardHeader />
            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </div>
    );
}
