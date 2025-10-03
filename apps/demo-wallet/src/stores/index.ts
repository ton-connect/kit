// Main app store with combined slices
export * from './appStore';

// Export main store
export { useStore } from './appStore';

// Individual slice creators (for testing or advanced usage)
export { createAuthSlice } from './slices/authSlice';
export { createWalletSlice } from './slices/walletSlice';
export { createNftsSlice } from './slices/nftsSlice';

// Types
export type { AppState, AuthSlice, WalletSlice, NftsSlice } from '../types/store';
