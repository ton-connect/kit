/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Watches for iframe creation in the DOM and triggers callbacks
 * Separated from bridge injection for better separation of concerns
 */
export class IframeWatcher {
    private readonly onIframeDetected: () => void;
    private observer: MutationObserver | null = null;

    constructor(onIframeDetected: () => void) {
        this.onIframeDetected = onIframeDetected;
    }

    /**
     * Start watching for iframes
     */
    start(): void {
        if (this.observer) {
            return; // Already watching
        }

        this.observer = new MutationObserver((mutations) => {
            this.handleMutations(mutations);
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * Stop watching for iframes
     */
    stop(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    /**
     * Handle DOM mutations
     */
    private handleMutations(mutations: MutationRecord[]): void {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') {
                continue;
            }

            for (const node of mutation.addedNodes) {
                this.handleAddedNode(node);
            }
        }
    }

    /**
     * Handle a single added node
     */
    private handleAddedNode(node: Node): void {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        const element = node as Element;

        // Check if this is an iframe
        if (element.tagName === 'IFRAME') {
            this.setupIframeListeners(element);
            this.onIframeDetected();
            return;
        }

        // Check if any child elements are iframes
        const iframes = element.querySelectorAll('iframe');
        if (iframes.length > 0) {
            iframes.forEach((iframe) => {
                this.setupIframeListeners(iframe);
            });
            this.onIframeDetected();
        }
    }

    /**
     * Setup event listeners for iframe
     */
    private setupIframeListeners(iframe: Element): void {
        const handleIframeEvent = () => {
            this.onIframeDetected();
        };

        // Remove existing listeners to avoid duplicates
        iframe.removeEventListener('load', handleIframeEvent);
        iframe.removeEventListener('error', handleIframeEvent);

        // Add listeners
        iframe.addEventListener('load', handleIframeEvent);
        iframe.addEventListener('error', handleIframeEvent);
    }
}
