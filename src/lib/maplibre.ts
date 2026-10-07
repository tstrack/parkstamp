import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

// MapLibre v6 workers don't resolve under Vite without this.
setWorkerUrl(workerUrl);
