import type { AuthSliceCreator, SetState } from '../../types/store';

export const createAuthSlice: AuthSliceCreator = (set: SetState, get) => ({
    // Initial state
    auth: {
        isPasswordSet: false,
        isUnlocked: false,
        currentPassword: undefined,
        passwordHash: undefined,
    },

    // Actions
    setPassword: async (password: string) => {
        try {
            // Create a simple hash for password verification
            const passwordHashBuffer = await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(password + 'wallet_salt'),
            );

            const passwordHash = Array.from(new Uint8Array(passwordHashBuffer));

            set({
                auth: {
                    isPasswordSet: true,
                    isUnlocked: true,
                    currentPassword: password,
                    passwordHash,
                },
            });
        } catch (error) {
            console.error('Error setting password:', error);
            throw new Error('Failed to set password');
        }
    },

    unlock: async (password: string) => {
        try {
            const state = get();
            if (!state.auth.passwordHash) return false;

            // Verify password
            const passwordHashBuffer = await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(password + 'wallet_salt'),
            );

            const currentHash = Array.from(new Uint8Array(passwordHashBuffer));
            const isValid = state.auth.passwordHash.every((byte: number, index: number) => byte === currentHash[index]);

            if (isValid) {
                set((state) => {
                    state.auth.isUnlocked = true;
                    state.auth.currentPassword = password;
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error unlocking wallet:', error);
            return false;
        }
    },

    lock: () => {
        // const state = get();
        set({
            auth: {
                // ...state.auth,
                isUnlocked: false,
                currentPassword: undefined,
            },
        });
    },

    reset: () => {
        // const state = get();
        set({
            auth: {
                // ...state.auth,
                isPasswordSet: false,
                isUnlocked: false,
                currentPassword: undefined, // Clear password
                passwordHash: undefined, // Clear password hash
            },
        });
    },
});
