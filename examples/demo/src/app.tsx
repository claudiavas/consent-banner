import { useEffect, useMemo, useState } from 'react';
import {
  ConsentGate,
  ConsentProvider,
  ConsentSettingsButton,
  useConsent,
  type ConsentConfig,
  type ThemeMode,
} from '@claudiavas/consent-banner';
import { createDemoTexts, type DemoTextKey, type Locale } from './texts';

const STORAGE_KEY = 'consent-banner-demo';
const LOCALES: Locale[] = ['en', 'es'];
const THEMES: ThemeMode[] = ['system', 'light', 'dark'];

type Translate = (key: DemoTextKey) => string;

function readParam<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const value = new URLSearchParams(window.location.search).get(name);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function App() {
  const [locale, setLocale] = useState<Locale>(() => readParam('locale', LOCALES, 'en'));
  const [theme, setTheme] = useState<ThemeMode>(() => readParam('theme', THEMES, 'system'));
  const t = useMemo(() => createDemoTexts(locale), [locale]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    document.title = t('page.title');
  }, [locale, theme, t]);

  const config = useMemo<ConsentConfig>(
    () => ({
      categories: [{ id: 'functional' }, { id: 'analytics' }, { id: 'marketing' }],
      locale,
      theme,
      policyUrl: '#cookie-policy',
      storageKey: STORAGE_KEY,
    }),
    [locale, theme],
  );

  return (
    <ConsentProvider config={config}>
      <main className="page">
        <header>
          <h1>{t('page.title')}</h1>
          <p className="muted">{t('page.intro')}</p>
        </header>
        <Controls t={t} locale={locale} theme={theme} onLocale={setLocale} onTheme={setTheme} />
        <Status t={t} />
        <section className="card">
          <h2>{t('gate.heading')}</h2>
          <ConsentGate category="analytics" fallback={<p className="notice notice--blocked">{t('gate.blocked')}</p>}>
            <p className="notice notice--loaded">{t('gate.loaded')}</p>
          </ConsentGate>
        </section>
        <footer className="footer">
          <span className="muted">{t('footer.note')}</span> <ConsentSettingsButton className="link-button" />
        </footer>
      </main>
    </ConsentProvider>
  );
}

interface ControlsProps {
  t: Translate;
  locale: Locale;
  theme: ThemeMode;
  onLocale: (locale: Locale) => void;
  onTheme: (theme: ThemeMode) => void;
}

function Controls({ t, locale, theme, onLocale, onTheme }: ControlsProps) {
  return (
    <section className="card">
      <h2>{t('controls.heading')}</h2>
      <div className="controls">
        <fieldset className="segmented">
          <legend>{t('controls.locale')}</legend>
          {LOCALES.map((value) => (
            <label key={value}>
              <input type="radio" name="locale" checked={locale === value} onChange={() => onLocale(value)} />
              <span>{t(`controls.locale.${value}`)}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="segmented">
          <legend>{t('controls.theme')}</legend>
          {THEMES.map((value) => (
            <label key={value}>
              <input type="radio" name="theme" checked={theme === value} onChange={() => onTheme(value)} />
              <span>{t(`controls.theme.${value}`)}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <button
        type="button"
        className="button"
        onClick={() => {
          window.localStorage.removeItem(STORAGE_KEY);
          window.location.reload();
        }}
      >
        {t('controls.reset')}
      </button>
    </section>
  );
}

function Status({ t }: { t: Translate }) {
  const { consent, config, isGranted, t: consentText } = useConsent();
  return (
    <section className="card">
      <h2>{t('status.heading')}</h2>
      {consent ? (
        <ul className="status">
          {config.categoryIds.map((id) => (
            <li key={id}>
              <span>{consentText(`categories.${id}.title`)}</span>
              <span className={isGranted(id) ? 'badge badge--on' : 'badge badge--off'}>
                {isGranted(id) ? t('status.granted') : t('status.denied')}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{t('status.undecided')}</p>
      )}
    </section>
  );
}
