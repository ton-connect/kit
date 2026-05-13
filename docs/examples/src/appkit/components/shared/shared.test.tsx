/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { Network } from '@ton/walletkit';

import { createWrapper } from '../../../__tests__/test-utils';
import { TokenSelectorExample } from './token-selector';
import { TokenSelectModalExample } from './token-select-modal';
import { LowBalanceModalExample } from './low-balance-modal';
import { CopyButtonExample } from './copy-button';
import { SettingsButtonExample } from './settings-button';
import { AmountPresetsExample } from './amount-presets';
import { OptionSwitcherExample } from './option-switcher';

describe('Shared Component Examples', () => {
    let mockAppKit: any;

    beforeEach(() => {
        mockAppKit = {
            getDefaultNetwork: () => Network.mainnet(),
            connectors: [],
            walletsManager: { selectedWallet: null },
            networkManager: { getClient: () => ({}) },
            emitter: { on: () => () => {}, off: () => {} },
        };
    });

    afterEach(() => cleanup());

    it('TokenSelectorExample renders', () => {
        render(<TokenSelectorExample />, { wrapper: createWrapper(mockAppKit) });
        expect(screen.getByRole('button')).toBeDefined();
    });

    it('TokenSelectModalExample renders with a list of tokens', () => {
        render(<TokenSelectModalExample />, { wrapper: createWrapper(mockAppKit) });
        expect(screen.getAllByText(/USDT|TON/).length).toBeGreaterThan(0);
    });

    it('LowBalanceModalExample renders the required TON amount', () => {
        render(<LowBalanceModalExample />, { wrapper: createWrapper(mockAppKit) });
        expect(screen.getByText(/0\.423/)).toBeDefined();
    });

    it('CopyButtonExample renders an accessible copy button', () => {
        render(<CopyButtonExample />);
        expect(screen.getByLabelText('Copy wallet address')).toBeDefined();
    });

    it('SettingsButtonExample renders', () => {
        render(<SettingsButtonExample />, { wrapper: createWrapper(mockAppKit) });
        expect(screen.getByRole('button')).toBeDefined();
    });

    it('AmountPresetsExample renders all preset buttons', () => {
        render(<AmountPresetsExample />);
        const buttons = screen.getAllByRole('button');
        const labels = buttons.map((b) => b.textContent);
        expect(labels).toEqual(expect.arrayContaining(['$10', '$50', '$100']));
    });

    it('OptionSwitcherExample renders the active option label', () => {
        render(<OptionSwitcherExample />);
        expect(screen.getByText(/All tokens/)).toBeDefined();
    });
});
