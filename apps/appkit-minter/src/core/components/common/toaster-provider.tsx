/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { Toaster } from 'sonner';

import { useTheme } from '@/core/hooks';

export const ToasterProvider: React.FC = () => {
    const { calculatedTheme } = useTheme();

    return (
        <Toaster
            position="bottom-right"
            theme={calculatedTheme}
            richColors
            toastOptions={{
                style: {
                    background: 'var(--card)',
                    color: 'var(--card-foreground)',
                    border: '1px solid var(--border)',
                },
                descriptionClassName: 'text-muted-foreground',
            }}
        />
    );
};
