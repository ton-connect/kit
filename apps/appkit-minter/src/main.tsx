/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import './polyfills';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { AppPrivyProvider } from './privyProvider';

const root = (
    <AppPrivyProvider>
        <App />
    </AppPrivyProvider>
);

createRoot(document.getElementById('root')!).render(<StrictMode>{root}</StrictMode>);
