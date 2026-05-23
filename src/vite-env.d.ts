/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NEWS_PROXY_URL: string;
  readonly VITE_GALLERY_PROXY_URL: string;
  readonly VITE_AUTH_PROXY_URL: string;
  readonly VITE_MEMBER_CALENDAR_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
