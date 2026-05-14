/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

import { LogoExample } from './logo';
import { LogoWithNetworkExample } from './logo-with-network';
import { ModalExample } from './modal';
import { BlockExample } from './block';
import { ButtonExample } from './button';
import { CenteredAmountInputExample } from './centered-amount-input';
import { CollapsibleExample } from './collapsible';
import { SkeletonExample } from './skeleton';
import { TabsExample } from './tabs';
import { InputExample } from './input';
import { SelectExample } from './select';
import { InfoBlockExample } from './info-block';

describe('UI Component Examples', () => {
    afterEach(() => cleanup());

    it('LogoExample renders the logo wrapper', () => {
        const { container } = render(<LogoExample />);
        // Logo shows a placeholder until the image loads in the browser; in JSDOM the
        // placeholder span is what we can assert on.
        expect(container.firstElementChild).not.toBeNull();
    });

    it('LogoWithNetworkExample renders both the main logo and the network badge wrappers', () => {
        const { container } = render(<LogoWithNetworkExample />);
        // Two nested logo wrappers: the main one and the badge overlay.
        const logos = container.querySelectorAll('span > span');
        expect(logos.length).toBeGreaterThanOrEqual(2);
    });

    it('ModalExample exposes a trigger that opens the modal', () => {
        render(<ModalExample />);
        const trigger = screen.getByRole('button', { name: /open modal/i });
        expect(trigger).toBeDefined();
        act(() => trigger.click());
        expect(screen.getByText(/Are you sure/)).toBeDefined();
    });

    it('BlockExample renders both children', () => {
        render(<BlockExample />);
        expect(screen.getByText('Left')).toBeDefined();
        expect(screen.getByText('Right')).toBeDefined();
    });

    it('ButtonExample renders a clickable button', () => {
        render(<ButtonExample />);
        expect(screen.getByRole('button', { name: /Send transaction/ })).toBeDefined();
    });

    it('CenteredAmountInputExample renders an input with the ticker', () => {
        render(<CenteredAmountInputExample />);
        // The component duplicates the ticker in a hidden measurement span, so
        // there can be more than one match.
        expect(screen.getAllByText('TON').length).toBeGreaterThanOrEqual(1);
    });

    it('CollapsibleExample toggles details on click', () => {
        render(<CollapsibleExample />);
        const trigger = screen.getByRole('button', { name: /Show details/ });
        expect(trigger).toBeDefined();
        act(() => trigger.click());
        expect(screen.getByRole('button', { name: /Hide details/ })).toBeDefined();
    });

    it('SkeletonExample renders a placeholder element', () => {
        const { container } = render(<SkeletonExample />);
        expect(container.firstElementChild).not.toBeNull();
    });

    it('TabsExample renders both triggers and the active panel', () => {
        render(<TabsExample />);
        expect(screen.getByRole('tab', { name: /Stake/ })).toBeDefined();
        expect(screen.getByRole('tab', { name: /Unstake/ })).toBeDefined();
        expect(screen.getByText(/Stake your TON/)).toBeDefined();
    });

    it('InputExample renders the title and field', () => {
        render(<InputExample />);
        expect(screen.getByText('Recipient')).toBeDefined();
        expect(screen.getByPlaceholderText(/EQ\.\.\./)).toBeDefined();
    });

    it('SelectExample renders the current label inside the trigger', () => {
        render(<SelectExample />);
        expect(screen.getByText('Mainnet')).toBeDefined();
    });

    it('InfoBlockExample renders label/value rows', () => {
        render(<InfoBlockExample />);
        expect(screen.getByText('Rate')).toBeDefined();
        expect(screen.getByText('1 TON ≈ $5.43')).toBeDefined();
    });
});
