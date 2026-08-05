export interface BrowserInformation {
  name: string;
  version: string | null;
}

export interface PrivacySafeUrl {
  origin: string;
  pathnameTemplate: string;
  pathSegmentCount: number;
  queryPresent: boolean;
  fragmentPresent: boolean;
}

export interface PageTitleInformation {
  available: boolean;
  text: string | null;
  redacted: boolean;
  length: number;
}

export interface EnvironmentReport {
  browser: BrowserInformation;
  platform: string;
  userAgent: string;
  currentUrl: PrivacySafeUrl;
  pageTitle: PageTitleInformation;
  documentVisibility: string;
}

export interface WebApiAvailability {
  abortController: boolean;
  broadcastChannel: boolean;
  cacheStorage: boolean;
  eventSource: boolean;
  fetch: boolean;
  htmlAudioElement: boolean;
  indexedDb: boolean;
  intersectionObserver: boolean;
  mediaSession: boolean;
  mutationObserver: boolean;
  performanceObserver: boolean;
  resizeObserver: boolean;
  serviceWorker: boolean;
  sharedWorker: boolean;
  webAssembly: boolean;
  webSocket: boolean;
  worker: boolean;
  xmlHttpRequest: boolean;
}

export interface RuntimeReport {
  webApis: WebApiAvailability;
  navigatorMediaSession: boolean;
  htmlAudioElement: boolean;
  audioElementCount: number;
  broadcastChannel: boolean;
  sharedWorker: boolean;
  serviceWorker: boolean;
  indexedDb: boolean;
  cacheStorage: boolean;
  webSocket: boolean;
}

export interface AudioElementSnapshot {
  paused: boolean;
  muted: boolean;
  playbackRate: number | null;
  duration: number | null;
  currentTime: number | null;
  readyState: number;
}

export interface MediaReport {
  totalElementCount: number;
  inspectedElementCount: number;
  truncated: boolean;
  elements: AudioElementSnapshot[];
}

export interface StorageNameCollection {
  accessible: boolean;
  totalCount: number;
  redactedCount: number;
  names: string[];
}

export interface IndexedDbCollection extends StorageNameCollection {
  enumerationSupported: boolean;
}

export interface StorageReport {
  localStorage: StorageNameCollection;
  sessionStorage: StorageNameCollection;
  indexedDb: IndexedDbCollection;
}

export interface WorkerReport {
  dedicatedWorker: boolean;
  sharedWorker: boolean;
  serviceWorker: boolean;
  serviceWorkerControlled: boolean;
  broadcastChannel: boolean;
}

export interface PerformanceReport {
  loadedScriptCount: number;
  scriptElementCount: number;
  stylesheetCount: number;
  resourceCount: number;
  resourceCountsByInitiatorType: Record<string, number>;
}

export interface NetworkReport {
  fetch: boolean;
  xmlHttpRequest: boolean;
  webSocket: boolean;
  eventSource: boolean;
}

export interface DomReport {
  rootElement: string | null;
  customElementCount: number;
  audioElementCount: number;
}

export interface SummaryReport {
  readOnly: true;
  audioElementCount: number;
  customElementCount: number;
  resourceCount: number;
  storageNameCount: number;
  redactedStorageNameCount: number;
}

export interface InspectionReport {
  schemaVersion: '1.0.0';
  environment: EnvironmentReport;
  runtime: RuntimeReport;
  media: MediaReport;
  storage: StorageReport;
  workers: WorkerReport;
  performance: PerformanceReport;
  network: NetworkReport;
  dom: DomReport;
  summary: SummaryReport;
}
