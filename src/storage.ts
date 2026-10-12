import { NECESSARY_CATEGORY, type ConsentAction, type ConsentChoices, type ConsentRecord } from './types';

export function expiresAt(timestamp: string, expiryMonths: number): number {
  const date = new Date(timestamp);
  date.setMonth(date.getMonth() + expiryMonths);
  return date.getTime();
}

export interface RecordRules {
  version: string;
  expiryMonths: number;
  categoryIds: string[];
}

/**
 * A stored record counts only if it was made under the current version, has
 * not expired, and answers every current category. A category added later
 * without a version bump is still asked about.
 */
export function isRecordValid(record: ConsentRecord, rules: RecordRules, now = Date.now()): boolean {
  if (record.version !== rules.version) return false;
  const expiry = expiresAt(record.timestamp, rules.expiryMonths);
  if (Number.isNaN(expiry) || now >= expiry) return false;
  return rules.categoryIds.every((id) => typeof record.choices[id] === 'boolean');
}

function isRecordShape(value: unknown): value is ConsentRecord {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<ConsentRecord>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.timestamp === 'string' &&
    typeof candidate.version === 'string' &&
    typeof candidate.choices === 'object' &&
    candidate.choices !== null
  );
}

export function readRecord(storageKey: string): ConsentRecord | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRecordShape(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeRecord(storageKey: string, record: ConsentRecord): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(record));
  } catch {
    // Storage is blocked or full: the choice still applies to this page view.
  }
}

function createId(): string {
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createRecord(params: {
  categoryIds: string[];
  granted: ConsentChoices;
  version: string;
  locale: string;
  action: ConsentAction;
  now?: Date;
}): ConsentRecord {
  const choices: ConsentChoices = {};
  for (const id of params.categoryIds) {
    choices[id] = id === NECESSARY_CATEGORY ? true : params.granted[id] === true;
  }
  return {
    id: createId(),
    timestamp: (params.now ?? new Date()).toISOString(),
    version: params.version,
    choices,
    locale: params.locale,
    action: params.action,
  };
}
