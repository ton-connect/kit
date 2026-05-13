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
});
