/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url" {
  const workerUrl: string;
  export default workerUrl;
}
