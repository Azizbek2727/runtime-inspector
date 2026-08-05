import type {
  BrowserInformation,
  IndexedDbCollection,
  InspectionReport,
  PageTitleInformation,
  PrivacySafeUrl,
  StorageNameCollection,
} from './report';

export async function inspectPage(): Promise<InspectionReport> {
  const maximumMediaElements = 100;

  function compareStrings(left: string, right: string): number {
    if (left < right) {
      return -1;
    }

    if (left > right) {
      return 1;
    }

    return 0;
  }

  function normalizeNumber(value: number): number | null {
    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.round(value * 1000) / 1000;
  }

  function parseBrowser(userAgent: string): BrowserInformation {
    const candidates: Array<{
      name: string;
      expression: RegExp;
    }> = [
      { name: 'Microsoft Edge', expression: /Edg\/([0-9.]+)/ },
      { name: 'Opera', expression: /OPR\/([0-9.]+)/ },
      { name: 'Google Chrome', expression: /Chrome\/([0-9.]+)/ },
      { name: 'Firefox', expression: /Firefox\/([0-9.]+)/ },
      { name: 'Safari', expression: /Version\/([0-9.]+).*Safari/ },
    ];

    for (const candidate of candidates) {
      const match = userAgent.match(candidate.expression);

      if (match?.[1]) {
        return {
          name: candidate.name,
          version: match[1],
        };
      }
    }

    return {
      name: 'Unknown',
      version: null,
    };
  }

  function createPrivacySafeUrl(): PrivacySafeUrl {
    const parsed = new URL(location.href);
    const pathSegmentCount = parsed.pathname
      .split('/')
      .filter(segment => segment.length > 0).length;

    const origin =
      parsed.origin === 'null' ? `${parsed.protocol}//` : parsed.origin;

    return {
      origin,
      pathnameTemplate:
        pathSegmentCount === 0
          ? '/'
          : `/${Array.from(
              { length: pathSegmentCount },
              () => ':segment',
            ).join('/')}`,
      pathSegmentCount,
      queryPresent: parsed.search.length > 0,
      fragmentPresent: parsed.hash.length > 0,
    };
  }

  function createPageTitleInformation(): PageTitleInformation {
    const normalized = document.title.trim().replace(/\s+/g, ' ');
    const available = normalized.length > 0;

    if (!available) {
      return {
        available: false,
        text: null,
        redacted: false,
        length: 0,
      };
    }

    const hostname = location.hostname.toLowerCase();
    const hostnameWithoutWww = hostname.replace(/^www\./, '');
    const firstHostnameLabel = hostnameWithoutWww.split('.')[0] ?? '';
    const normalizedLowercase = normalized.toLowerCase();
    const safeSiteTitles = new Set([
      hostname,
      hostnameWithoutWww,
      firstHostnameLabel,
    ]);
    const text = safeSiteTitles.has(normalizedLowercase) ? normalized : null;

    return {
      available: true,
      text,
      redacted: text === null,
      length: normalized.length,
    };
  }

  function isSensitiveName(value: string): boolean {
    const sensitiveWord =
      /(?:^|[._:/-])(?:account|api[-_]?key|auth|authorization|bearer|cookie|credential|email|pass(?:word|wd)?|phone|secret|session(?:id)?|token|user(?:id|name)?)(?:$|[._:/-])/i;
    const emailAddress = /@/;
    const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const longNumber = /\d{7,}/;
    const longHex = /^[0-9a-f]{24,}$/i;
    const longEncodedValue = /^[A-Za-z0-9+/_=-]{32,}$/;

    return (
      sensitiveWord.test(value) ||
      emailAddress.test(value) ||
      uuid.test(value) ||
      longNumber.test(value) ||
      longHex.test(value) ||
      longEncodedValue.test(value)
    );
  }

  function isSafeName(value: string): boolean {
    return (
      value.length > 0 &&
      value.length <= 80 &&
      /^[A-Za-z0-9._:/-]+$/.test(value) &&
      !isSensitiveName(value)
    );
  }

  function sanitizeNames(
    values: readonly string[],
  ): Omit<StorageNameCollection, 'accessible'> {
    const uniqueNames = Array.from(new Set(values)).sort(compareStrings);
    const names = uniqueNames.filter(value => isSafeName(value));

    return {
      totalCount: uniqueNames.length,
      redactedCount: uniqueNames.length - names.length,
      names,
    };
  }

  function collectStorageNames(
    getStorage: () => Storage,
  ): StorageNameCollection {
    try {
      const storage = getStorage();
      const names: string[] = [];

      for (let index = 0; index < storage.length; index += 1) {
        const name = storage.key(index);

        if (name !== null) {
          names.push(name);
        }
      }

      return {
        accessible: true,
        ...sanitizeNames(names),
      };
    } catch {
      return {
        accessible: false,
        totalCount: 0,
        redactedCount: 0,
        names: [],
      };
    }
  }

  async function collectIndexedDbNames(): Promise<IndexedDbCollection> {
    if (!('indexedDB' in globalThis)) {
      return {
        accessible: false,
        enumerationSupported: false,
        totalCount: 0,
        redactedCount: 0,
        names: [],
      };
    }

    const factory = globalThis.indexedDB as IDBFactory & {
      databases?: () => Promise<Array<{ name?: string; version?: number }>>;
    };

    if (typeof factory.databases !== 'function') {
      return {
        accessible: true,
        enumerationSupported: false,
        totalCount: 0,
        redactedCount: 0,
        names: [],
      };
    }

    try {
      const databases = await factory.databases();
      const names = databases.flatMap(database =>
        typeof database.name === 'string' ? [database.name] : [],
      );

      return {
        accessible: true,
        enumerationSupported: true,
        ...sanitizeNames(names),
      };
    } catch {
      return {
        accessible: false,
        enumerationSupported: true,
        totalCount: 0,
        redactedCount: 0,
        names: [],
      };
    }
  }

  function sortNumberRecord(
    input: Record<string, number>,
  ): Record<string, number> {
    const output: Record<string, number> = {};

    for (const key of Object.keys(input).sort(compareStrings)) {
      const value = input[key];

      if (value !== undefined) {
        output[key] = value;
      }
    }

    return output;
  }

  const audioElements = Array.from(document.querySelectorAll('audio'));
  const inspectedAudioElements = audioElements.slice(0, maximumMediaElements);
  const mediaElements = inspectedAudioElements.map(element => ({
    paused: element.paused,
    muted: element.muted,
    playbackRate: normalizeNumber(element.playbackRate),
    duration: normalizeNumber(element.duration),
    currentTime: normalizeNumber(element.currentTime),
    readyState: element.readyState,
  }));

  const localStorageNames = collectStorageNames(() => window.localStorage);
  const sessionStorageNames = collectStorageNames(() => window.sessionStorage);
  const indexedDbNames = await collectIndexedDbNames();

  const allElements = Array.from(document.querySelectorAll('*'));
  const customElementCount = allElements.reduce(
    (count, element) => count + (element.localName.includes('-') ? 1 : 0),
    0,
  );

  const resourceEntries = performance.getEntriesByType(
    'resource',
  ) as PerformanceResourceTiming[];
  const resourceCounts: Record<string, number> = {};

  for (const entry of resourceEntries) {
    const rawType = entry.initiatorType || 'other';
    const initiatorType = /^[a-z0-9-]{1,32}$/i.test(rawType)
      ? rawType.toLowerCase()
      : 'other';

    resourceCounts[initiatorType] =
      (resourceCounts[initiatorType] ?? 0) + 1;
  }

  const webApis = {
    abortController: typeof globalThis.AbortController !== 'undefined',
    broadcastChannel: typeof globalThis.BroadcastChannel !== 'undefined',
    cacheStorage: typeof globalThis.caches !== 'undefined',
    eventSource: typeof globalThis.EventSource !== 'undefined',
    fetch: typeof globalThis.fetch !== 'undefined',
    htmlAudioElement: typeof globalThis.HTMLAudioElement !== 'undefined',
    indexedDb: typeof globalThis.indexedDB !== 'undefined',
    intersectionObserver:
      typeof globalThis.IntersectionObserver !== 'undefined',
    mediaSession: 'mediaSession' in navigator,
    mutationObserver: typeof globalThis.MutationObserver !== 'undefined',
    performanceObserver:
      typeof globalThis.PerformanceObserver !== 'undefined',
    resizeObserver: typeof globalThis.ResizeObserver !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    sharedWorker: typeof globalThis.SharedWorker !== 'undefined',
    webAssembly: typeof globalThis.WebAssembly !== 'undefined',
    webSocket: typeof globalThis.WebSocket !== 'undefined',
    worker: typeof globalThis.Worker !== 'undefined',
    xmlHttpRequest: typeof globalThis.XMLHttpRequest !== 'undefined',
  };

  const storageNameCount =
    localStorageNames.totalCount +
    sessionStorageNames.totalCount +
    indexedDbNames.totalCount;
  const redactedStorageNameCount =
    localStorageNames.redactedCount +
    sessionStorageNames.redactedCount +
    indexedDbNames.redactedCount;

  return {
    schemaVersion: '1.0.0',
    environment: {
      browser: parseBrowser(navigator.userAgent),
      platform: navigator.platform || 'unknown',
      userAgent: navigator.userAgent,
      currentUrl: createPrivacySafeUrl(),
      pageTitle: createPageTitleInformation(),
      documentVisibility: document.visibilityState,
    },
    runtime: {
      webApis,
      navigatorMediaSession: webApis.mediaSession,
      htmlAudioElement: webApis.htmlAudioElement,
      audioElementCount: audioElements.length,
      broadcastChannel: webApis.broadcastChannel,
      sharedWorker: webApis.sharedWorker,
      serviceWorker: webApis.serviceWorker,
      indexedDb: webApis.indexedDb,
      cacheStorage: webApis.cacheStorage,
      webSocket: webApis.webSocket,
    },
    media: {
      totalElementCount: audioElements.length,
      inspectedElementCount: mediaElements.length,
      truncated: audioElements.length > mediaElements.length,
      elements: mediaElements,
    },
    storage: {
      localStorage: localStorageNames,
      sessionStorage: sessionStorageNames,
      indexedDb: indexedDbNames,
    },
    workers: {
      dedicatedWorker: webApis.worker,
      sharedWorker: webApis.sharedWorker,
      serviceWorker: webApis.serviceWorker,
      serviceWorkerControlled:
        'serviceWorker' in navigator &&
        navigator.serviceWorker.controller !== null,
      broadcastChannel: webApis.broadcastChannel,
    },
    performance: {
      loadedScriptCount: resourceCounts.script ?? 0,
      scriptElementCount: document.scripts.length,
      stylesheetCount: document.styleSheets.length,
      resourceCount: resourceEntries.length,
      resourceCountsByInitiatorType: sortNumberRecord(resourceCounts),
    },
    network: {
      fetch: webApis.fetch,
      xmlHttpRequest: webApis.xmlHttpRequest,
      webSocket: webApis.webSocket,
      eventSource: webApis.eventSource,
    },
    dom: {
      rootElement: document.documentElement?.localName ?? null,
      customElementCount,
      audioElementCount: audioElements.length,
    },
    summary: {
      readOnly: true,
      audioElementCount: audioElements.length,
      customElementCount,
      resourceCount: resourceEntries.length,
      storageNameCount,
      redactedStorageNameCount,
    },
  };
}
