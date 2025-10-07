import { type Page } from '@playwright/test';

interface TonConnectSelector {
    title: string;
    secondTitle: string;
    connectButton: string;
    connectButtonText: string;
    connectUrlButton: string;
    connectDropdown: string;
}

function createTonConnectSelector(): TonConnectSelector {
    return {
        title: '#tc-widget-root h1',
        secondTitle: '#tc-widget-root h2',
        connectButton: '[data-tc-button]',
        connectButtonText: '[data-tc-button] [data-tc-text]',
        connectUrlButton: '[data-tc-wallets-modal-universal-desktop] > button',
        connectDropdown: '[data-tc-dropdown-container]',
    };
}

export class TonConnectWidget {
    private page: Page;
    private selector: TonConnectSelector;

    constructor(page: Page) {
        this.page = page;
        this.selector = createTonConnectSelector();
    }

    get title() {
        return this.page.locator(this.selector.title);
    }

    get secondTitle() {
        return this.page.locator(this.selector.secondTitle);
    }

    get connectButton() {
        return this.page.locator(this.selector.connectButton);
    }

    get connectButtonText() {
        return this.page.locator(this.selector.connectButtonText);
    }

    get connectUrlButton() {
        return this.page.locator(this.selector.connectUrlButton);
    }

    get connectDropdown() {
        return this.page.locator(this.selector.connectDropdown);
    }

    private clickButton(name: string) {
        return this.page.getByRole('button', { name }).click();
    }

    async connectWallet(name: string) {
        await this.connect();
        await this.clickButton(name);
        await this.clickButton('Browser Extension');
    }

    async connect() {
        await this.connectButton.waitFor({ state: 'visible' });
        await this.connectButton.click();
        await this.title.waitFor({ state: 'visible' });
    }

    async disconnect() {
        await this.connectButton.waitFor({ state: 'visible' });
        await this.connectButton.click();
        await this.connectDropdown.locator('li:nth-child(2) > button').click();
    }

    async connectUrl() {
        await this.connect();
        await this.connectUrlButton.waitFor({ state: 'visible' });
        await this.connectUrlButton.click();
        const handle = await this.page.evaluateHandle(() => navigator.clipboard.readText());
        return await handle.jsonValue();
    }
}
