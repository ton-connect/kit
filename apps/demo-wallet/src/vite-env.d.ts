/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BRIDGE_URL?: string;
    readonly VITE_TON_API_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
