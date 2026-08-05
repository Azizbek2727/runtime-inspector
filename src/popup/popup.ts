import { inspectPage } from '../inspector';
import type { InspectionReport } from '../report';
import { stableStringify } from '../stable-json';

function getButton(id: string): HTMLButtonElement {
  const element = document.getElementById(id);

  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Missing button: ${id}`);
  }

  return element;
}

const inspectButton = getButton('inspect');
const exportButton = getButton('export');
const copyButton = getButton('copy');

let currentReport: InspectionReport | null = null;

function enableReportActions(enabled: boolean): void {
  exportButton.disabled = !enabled;
  copyButton.disabled = !enabled;
}

function setTemporaryHint(
  button: HTMLButtonElement,
  hint: string,
  duration = 1200,
): void {
  button.title = hint;

  window.setTimeout(() => {
    button.title = '';
  }, duration);
}

async function inspectActiveTab(): Promise<void> {
  inspectButton.disabled = true;

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (activeTab?.id === undefined) {
      throw new Error('No active tab');
    }

    const [injectionResult] = await chrome.scripting.executeScript({
      target: {
        tabId: activeTab.id,
      },
      world: 'ISOLATED',
      func: inspectPage,
    });

    if (injectionResult?.result === undefined) {
      throw new Error('No inspection result');
    }

    currentReport = injectionResult.result;
    enableReportActions(true);
    setTemporaryHint(inspectButton, 'Inspection complete');
  } catch {
    currentReport = null;
    enableReportActions(false);
    setTemporaryHint(inspectButton, 'Inspection unavailable on this page');
  } finally {
    inspectButton.disabled = false;
  }
}

function exportReport(): void {
  if (currentReport === null) {
    return;
  }

  const blob = new Blob([stableStringify(currentReport)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'report.json';
  anchor.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

async function copyReport(): Promise<void> {
  if (currentReport === null) {
    return;
  }

  try {
    await navigator.clipboard.writeText(stableStringify(currentReport));
    setTemporaryHint(copyButton, 'Copied');
  } catch {
    setTemporaryHint(copyButton, 'Copy failed');
  }
}

inspectButton.addEventListener('click', () => {
  void inspectActiveTab();
});

exportButton.addEventListener('click', exportReport);

copyButton.addEventListener('click', () => {
  void copyReport();
});
