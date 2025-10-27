/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppRouter } from './components';
import './App.css';
import './storePatch';

import { Toaster } from '@/components/ui/sonner';

function App() {
    return (
        <>
            <AppRouter />
            <Toaster />
        </>
    );
}

export default App;
