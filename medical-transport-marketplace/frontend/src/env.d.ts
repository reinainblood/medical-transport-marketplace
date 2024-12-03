// frontend/src/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WS_URL: string
    readonly VITE_API_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
