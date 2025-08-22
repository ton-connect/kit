import { useStore, type AppState } from './stores';

declare global {
    interface Window {
        __store: AppState;
    }
}

if (import.meta.hot) {
    useStore.subscribe((state) => {
        if (typeof window !== 'undefined') {
            window.__store = state;
        }
    });
    import.meta.hot!.accept((newModule) => {
        if (!newModule) return;
        const newStore = newModule.useStore;
        if (!newStore) return;
        if (window.__store) {
            newStore.setState(window.__store, true);
        }
    });
}
