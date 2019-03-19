declare interface WindowOrWorkerGlobalScope {
  /**
   * The manifest injected by [parcel-plugin-service-worker-manifest](https://github.com/nevir/parcel-plugin-service-worker-manifest).
   */
  __precacheManifest: { url: string; revision: string }[];
}
