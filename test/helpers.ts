import type { ConsentRecord } from '../src';

export const STORAGE_KEY = 'consent-banner';

export function dataLayer(): unknown[] {
  return (window as Window & { dataLayer?: unknown[] }).dataLayer ?? [];
}

/** The `gtag('consent', 'update', …)` payloads pushed so far, in order. */
export function consentUpdates(): Record<string, string>[] {
  return dataLayer()
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter((args) => args[0] === 'consent' && args[1] === 'update')
    .map((args) => args[2] as Record<string, string>);
}

export function storeRecord(record: Partial<ConsentRecord>): void {
  const full: ConsentRecord = {
    id: 'stored',
    timestamp: new Date().toISOString(),
    version: '1',
    choices: { necessary: true, analytics: true, marketing: false },
    locale: 'en',
    action: 'custom',
    ...record,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
}

export function storedRecord(): ConsentRecord | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as ConsentRecord) : null;
}
