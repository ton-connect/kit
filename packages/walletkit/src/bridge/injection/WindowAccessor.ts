import type { TonConnectBridge } from '../core/TonConnectBridge';

/**
 * Type-safe accessor for window object manipulation
 */
export class WindowAccessor {
    private readonly window: Window;
    private readonly bridgeKey: string;
    private readonly injectTonKey: boolean;

    constructor(window: Window, { bridgeKey, injectTonKey }: { bridgeKey: string; injectTonKey?: boolean }) {
        this.window = window;
        this.bridgeKey = bridgeKey;
        this.injectTonKey = injectTonKey ?? true;
    }

    /**
     * Check if bridge already exists
     */
    exists(): boolean {
        const windowObj = this.window as unknown as Record<string, unknown>;
        return !!(windowObj[this.bridgeKey] && (windowObj[this.bridgeKey] as Record<string, unknown>).tonconnect);
    }

    /**
     * Get bridge key name
     */
    getBridgeKey(): string {
        return this.bridgeKey;
    }

    get tonKey(): string {
        return 'ton';
    }

    /**
     * Ensure wallet object exists on window
     */
    private ensureWalletObject(): void {
        const windowObj = this.window as unknown as Record<string, unknown>;
        if (!windowObj[this.bridgeKey]) {
            windowObj[this.bridgeKey] = {};
        }

        if (this.injectTonKey) {
            if (!windowObj[this.tonKey]) {
                windowObj[this.tonKey] = {};
            }
        }
    }

    /**
     * Inject bridge into window object
     */
    injectBridge(bridge: TonConnectBridge): void {
        this.ensureWalletObject();

        const windowObj = this.window as unknown as Record<string, Record<string, unknown>>;

        Object.defineProperty(windowObj[this.bridgeKey], 'tonconnect', {
            value: bridge,
            writable: false,
            enumerable: true,
            configurable: false,
        });

        if (this.injectTonKey) {
            Object.defineProperty(windowObj[this.tonKey], 'tonconnect', {
                value: bridge,
                writable: false,
                enumerable: true,
                configurable: false,
            });
        }
    }
}
