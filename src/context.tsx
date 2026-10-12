import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { resolveConfig, type ResolvedConfig } from './config';
import { DEFAULT_CONSENT_MODE_MAPPING, pushConsentUpdate } from './consent-mode';
import { OPEN_SETTINGS_EVENT } from './events';
import { createTranslator, type Translate } from './i18n';
import { createRecord, isRecordValid, readRecord, writeRecord } from './storage';
import { NECESSARY_CATEGORY, type ConsentAction, type ConsentChoices, type ConsentConfig, type ConsentRecord } from './types';
import { ConsentBanner } from './components/consent-banner';
import { ConsentPreferences } from './components/consent-preferences';

export interface ConsentContextValue {
  /** False on the server and until stored consent has been read in the browser. */
  ready: boolean;
  /** The current valid decision, or null when the visitor still has to decide. */
  consent: ConsentRecord | null;
  /** Current choices per category; optional ones are false until granted. */
  choices: ConsentChoices;
  /** True when the visitor has a valid decision on record. */
  hasDecided: boolean;
  isGranted: (category: string) => boolean;
  acceptAll: () => ConsentRecord;
  rejectAll: () => ConsentRecord;
  /** Saves a granular decision; categories left out are denied. */
  save: (choices: ConsentChoices) => ConsentRecord;
  openSettings: () => void;
  closeSettings: () => void;
  isBannerOpen: boolean;
  isSettingsOpen: boolean;
  config: ResolvedConfig;
  t: Translate;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export interface ConsentProviderProps {
  config?: ConsentConfig;
  /**
   * Called with every new decision. Store the record server side to keep proof
   * of consent (GDPR art. 7.1).
   */
  onConsentChange?: (record: ConsentRecord) => void;
  children?: ReactNode;
}

function denyAll(categoryIds: string[]): ConsentChoices {
  const choices: ConsentChoices = {};
  for (const id of categoryIds) choices[id] = id === NECESSARY_CATEGORY;
  return choices;
}

export function ConsentProvider({ config, onConsentChange, children }: ConsentProviderProps) {
  const resolved = useMemo(() => resolveConfig(config), [config]);
  const { storageKey, version, expiryMonths, locale, consentMode } = resolved;
  const categoryKey = resolved.categoryIds.join('|');
  const mapping = consentMode ? (consentMode.mapping ?? DEFAULT_CONSENT_MODE_MAPPING) : null;

  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const latest = useRef({ resolved, mapping, onConsentChange });
  latest.current = { resolved, mapping, onConsentChange };

  const loadStored = useCallback(() => {
    const { resolved: current, mapping: currentMapping } = latest.current;
    const stored = readRecord(current.storageKey);
    const valid = stored && isRecordValid(stored, current) ? stored : null;
    setConsent(valid);
    if (valid && currentMapping) pushConsentUpdate(valid.choices, currentMapping);
  }, []);

  useEffect(() => {
    loadStored();
    setReady(true);
  }, [loadStored, storageKey, version, expiryMonths, categoryKey]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === latest.current.resolved.storageKey) loadStored();
    };
    const onOpen = () => setSettingsOpen(true);
    window.addEventListener('storage', onStorage);
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpen);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(OPEN_SETTINGS_EVENT, onOpen);
    };
  }, [loadStored]);

  const decide = useCallback((granted: ConsentChoices, action: ConsentAction) => {
    const { resolved: current, mapping: currentMapping, onConsentChange: notify } = latest.current;
    const record = createRecord({
      categoryIds: current.categoryIds,
      granted,
      version: current.version,
      locale: current.locale,
      action,
    });
    writeRecord(current.storageKey, record);
    setConsent(record);
    setSettingsOpen(false);
    if (currentMapping) pushConsentUpdate(record.choices, currentMapping);
    notify?.(record);
    return record;
  }, []);

  const acceptAll = useCallback(() => {
    const all: ConsentChoices = {};
    for (const id of latest.current.resolved.categoryIds) all[id] = true;
    return decide(all, 'accept_all');
  }, [decide]);

  const rejectAll = useCallback(() => decide({}, 'reject_all'), [decide]);
  const save = useCallback((choices: ConsentChoices) => decide(choices, 'custom'), [decide]);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const t = useMemo(() => createTranslator(locale, resolved.texts), [locale, resolved.texts]);

  const value = useMemo<ConsentContextValue>(() => {
    const choices = consent ? { ...denyAll(resolved.categoryIds), ...consent.choices } : denyAll(resolved.categoryIds);
    return {
      ready,
      consent,
      choices,
      hasDecided: consent !== null,
      isGranted: (category) => choices[category] === true,
      acceptAll,
      rejectAll,
      save,
      openSettings,
      closeSettings,
      isBannerOpen: ready && consent === null,
      isSettingsOpen,
      config: resolved,
      t,
    };
  }, [ready, consent, isSettingsOpen, resolved, t, acceptAll, rejectAll, save, openSettings, closeSettings]);

  return (
    <ConsentContext.Provider value={value}>
      {value.isBannerOpen && <ConsentBanner />}
      {isSettingsOpen && <ConsentPreferences />}
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const value = useContext(ConsentContext);
  if (!value) throw new Error('useConsent must be used inside <ConsentProvider>.');
  return value;
}
