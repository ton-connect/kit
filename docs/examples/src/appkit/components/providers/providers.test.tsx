/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

import { I18nProviderExample } from './i18n-provider';

describe('Providers Component Examples', () => {
    afterEach(() => cleanup());

    it('I18nProviderExample renders', () => {
        const { container } = render(<I18nProviderExample />);
        expect(container.textContent).toContain('My App');
    });
});
