import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  ConsentGate,
  ConsentProvider,
  ConsentSettingsButton,
  openConsentSettings,
  useConsent,
  type ConsentConfig,
  type ConsentRecord,
} from '../src';
import { consentUpdates, storeRecord, storedRecord } from './helpers';

function Status() {
  const { isGranted, hasDecided } = useConsent();
  return (
    <output data-testid="status">
      {JSON.stringify({ hasDecided, analytics: isGranted('analytics'), marketing: isGranted('marketing') })}
    </output>
  );
}

function status() {
  return JSON.parse(screen.getByTestId('status').textContent ?? '{}') as {
    hasDecided: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

function setup(config?: ConsentConfig, onConsentChange?: (record: ConsentRecord) => void) {
  const user = userEvent.setup();
  render(
    <ConsentProvider config={config} onConsentChange={onConsentChange}>
      <Status />
      <ConsentSettingsButton />
      <ConsentGate category="analytics">
        <span>analytics loaded</span>
      </ConsentGate>
    </ConsentProvider>,
  );
  return user;
}

describe('default state', () => {
  it('shows the banner and denies everything until the visitor decides', async () => {
    setup();
    expect(await screen.findByRole('dialog', { name: 'We value your privacy' })).toBeInTheDocument();
    expect(status()).toEqual({ hasDecided: false, analytics: false, marketing: false });
    expect(screen.queryByText('analytics loaded')).not.toBeInTheDocument();
    expect(consentUpdates()).toEqual([]);
  });

  it('renders nothing of the banner on the server', () => {
    const html = renderToString(
      <ConsentProvider>
        <p>page</p>
      </ConsentProvider>,
    );
    expect(html).toContain('page');
    expect(html).not.toContain('cb-banner');
  });

  it('gives Accept all and Reject all the same visual weight', async () => {
    setup();
    const accept = await screen.findByRole('button', { name: 'Accept all' });
    const reject = screen.getByRole('button', { name: 'Reject all' });
    expect(accept.className).toBe(reject.className);
  });

  it('links the cookie policy when configured', async () => {
    setup({ policyUrl: '/cookies' });
    expect(await screen.findByRole('link', { name: 'Cookie policy' })).toHaveAttribute('href', '/cookies');
  });
});

describe('accept and reject', () => {
  it('accept all grants every category, stores it and updates Consent Mode', async () => {
    const onConsentChange = vi.fn();
    const user = setup({ locale: 'en', version: '3' }, onConsentChange);
    await user.click(await screen.findByRole('button', { name: 'Accept all' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(status()).toEqual({ hasDecided: true, analytics: true, marketing: true });
    expect(screen.getByText('analytics loaded')).toBeInTheDocument();
    expect(storedRecord()?.choices).toEqual({ necessary: true, analytics: true, marketing: true });
    expect(consentUpdates()).toEqual([
      { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' },
    ]);

    expect(onConsentChange).toHaveBeenCalledTimes(1);
    const record = onConsentChange.mock.calls[0]?.[0] as ConsentRecord;
    expect(record).toMatchObject({ version: '3', locale: 'en', action: 'accept_all' });
    expect(record.id).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(record.timestamp))).toBe(false);
  });

  it('reject all keeps only necessary and pushes a denied update', async () => {
    const onConsentChange = vi.fn();
    const user = setup(undefined, onConsentChange);
    await user.click(await screen.findByRole('button', { name: 'Reject all' }));

    expect(status()).toEqual({ hasDecided: true, analytics: false, marketing: false });
    expect(screen.queryByText('analytics loaded')).not.toBeInTheDocument();
    expect(storedRecord()?.choices).toEqual({ necessary: true, analytics: false, marketing: false });
    expect(consentUpdates()).toEqual([
      { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' },
    ]);
    expect(onConsentChange.mock.calls[0]?.[0]).toMatchObject({ action: 'reject_all' });
  });

  it('pushes the update as an arguments object, the shape Tag Manager requires', async () => {
    const user = setup();
    await user.click(await screen.findByRole('button', { name: 'Accept all' }));
    const entry = (window as Window & { dataLayer?: unknown[] }).dataLayer?.slice(-1)[0];
    expect(Array.isArray(entry)).toBe(false);
    expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]');
  });
});

describe('granular choice', () => {
  it('saves per-category choices from the preferences panel', async () => {
    const onConsentChange = vi.fn();
    const user = setup(undefined, onConsentChange);
    await user.click(await screen.findByRole('button', { name: 'Customize' }));

    const dialog = screen.getByRole('dialog', { name: 'Cookie preferences' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Always on')).toBeInTheDocument();

    const analytics = screen.getByRole('switch', { name: 'Analytics' });
    const marketing = screen.getByRole('switch', { name: 'Marketing' });
    expect(analytics).not.toBeChecked();
    expect(marketing).not.toBeChecked();

    await user.click(analytics);
    await user.click(screen.getByRole('button', { name: 'Save choices' }));

    expect(status()).toEqual({ hasDecided: true, analytics: true, marketing: false });
    expect(screen.getByText('analytics loaded')).toBeInTheDocument();
    expect(consentUpdates().slice(-1)[0]).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
    });
    expect(onConsentChange.mock.calls[0]?.[0]).toMatchObject({
      action: 'custom',
      choices: { necessary: true, analytics: true, marketing: false },
    });
  });

  it('moves focus into the panel, closes on Escape and returns focus', async () => {
    const user = setup();
    const customize = await screen.findByRole('button', { name: 'Customize' });
    await user.click(customize);
    const dialog = screen.getByRole('dialog', { name: 'Cookie preferences' });
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Cookie preferences' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(customize);
    expect(screen.getByRole('dialog', { name: 'We value your privacy' })).toBeInTheDocument();
  });

  it('keeps Tab inside the panel', async () => {
    const user = setup();
    await user.click(await screen.findByRole('button', { name: 'Customize' }));
    const dialog = screen.getByRole('dialog', { name: 'Cookie preferences' });
    for (let step = 0; step < 8; step += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it('supports custom categories with their own texts', async () => {
    const user = setup({
      categories: [{ id: 'video' }],
      texts: { en: { 'categories.video.title': 'Embedded video', 'categories.video.description': 'YouTube players.' } },
      consentMode: { mapping: { video: ['functionality_storage'] } },
    });
    await user.click(await screen.findByRole('button', { name: 'Customize' }));
    await user.click(screen.getByRole('switch', { name: 'Embedded video' }));
    await user.click(screen.getByRole('button', { name: 'Save choices' }));
    expect(storedRecord()?.choices).toEqual({ necessary: true, video: true });
    expect(consentUpdates().slice(-1)[0]).toMatchObject({ functionality_storage: 'granted', analytics_storage: 'denied' });
  });
});

describe('reopening and withdrawing', () => {
  it('the settings button reopens the panel with the current choices and allows withdrawing', async () => {
    storeRecord({ choices: { necessary: true, analytics: true, marketing: false } });
    const onConsentChange = vi.fn();
    const user = setup(undefined, onConsentChange);

    await waitFor(() => expect(status().hasDecided).toBe(true));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cookie settings' }));
    const analytics = screen.getByRole('switch', { name: 'Analytics' });
    expect(analytics).toBeChecked();
    await user.click(analytics);
    await user.click(screen.getByRole('button', { name: 'Save choices' }));

    expect(status().analytics).toBe(false);
    expect(screen.queryByText('analytics loaded')).not.toBeInTheDocument();
    expect(consentUpdates().slice(-1)[0]).toMatchObject({ analytics_storage: 'denied' });
    expect(onConsentChange).toHaveBeenCalledTimes(1);
  });

  it('openConsentSettings() opens the panel from outside React', async () => {
    storeRecord({});
    setup();
    await waitFor(() => expect(status().hasDecided).toBe(true));
    act(() => openConsentSettings());
    expect(screen.getByRole('dialog', { name: 'Cookie preferences' })).toBeInTheDocument();
  });
});

describe('stored consent', () => {
  it('restores a valid decision without showing the banner and replays the update', async () => {
    storeRecord({ choices: { necessary: true, analytics: true, marketing: false } });
    setup();
    await waitFor(() => expect(status()).toEqual({ hasDecided: true, analytics: true, marketing: false }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(consentUpdates()).toEqual([
      { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' },
    ]);
  });

  it('asks again once the decision has expired', async () => {
    const thirteenMonthsAgo = new Date();
    thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);
    storeRecord({ timestamp: thirteenMonthsAgo.toISOString() });
    setup();
    expect(await screen.findByRole('dialog', { name: 'We value your privacy' })).toBeInTheDocument();
    expect(status()).toEqual({ hasDecided: false, analytics: false, marketing: false });
    expect(consentUpdates()).toEqual([]);
  });

  it('honours a custom expiry', async () => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    storeRecord({ timestamp: twoMonthsAgo.toISOString() });
    setup({ expiryMonths: 1 });
    expect(await screen.findByRole('dialog', { name: 'We value your privacy' })).toBeInTheDocument();
  });

  it('asks again when the consent version changes', async () => {
    storeRecord({ version: '1' });
    setup({ version: '2' });
    expect(await screen.findByRole('dialog', { name: 'We value your privacy' })).toBeInTheDocument();
    expect(status().analytics).toBe(false);
  });

  it('asks again when a category was added after the decision', async () => {
    storeRecord({ choices: { necessary: true, analytics: true } });
    setup({ categories: [{ id: 'analytics' }, { id: 'marketing' }] });
    expect(await screen.findByRole('dialog', { name: 'We value your privacy' })).toBeInTheDocument();
  });

  it('ignores a corrupt stored value', async () => {
    window.localStorage.setItem('consent-banner', '{not json');
    setup();
    expect(await screen.findByRole('dialog', { name: 'We value your privacy' })).toBeInTheDocument();
  });

  it('keeps working when localStorage throws', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const user = setup();
    await user.click(await screen.findByRole('button', { name: 'Accept all' }));
    expect(status().analytics).toBe(true);
    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe('Consent Mode switch', () => {
  it('pushes nothing to dataLayer when consentMode is false', async () => {
    const user = setup({ consentMode: false });
    await user.click(await screen.findByRole('button', { name: 'Accept all' }));
    expect(consentUpdates()).toEqual([]);
  });
});

describe('i18n and theme', () => {
  it('renders the Spanish dictionary', async () => {
    setup({ locale: 'es' });
    expect(await screen.findByRole('button', { name: 'Aceptar todas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar todas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configuración de cookies' })).toBeInTheDocument();
  });

  it('lets texts override a built-in key and falls back to English for a new locale', async () => {
    setup({ locale: 'fr', texts: { fr: { 'banner.actions.acceptAll': 'Tout accepter' } } });
    expect(await screen.findByRole('button', { name: 'Tout accepter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject all' })).toBeInTheDocument();
  });

  it('forces a theme and applies token overrides', async () => {
    setup({ theme: 'dark', tokens: { dark: { buttonBackground: '#ff0000' } } });
    const banner = await screen.findByRole('dialog', { name: 'We value your privacy' });
    const root = banner.closest('.cb-root');
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(root?.querySelector('style')?.textContent).toContain('--cb-button-background:#ff0000');
  });

  it('follows the system theme by default', async () => {
    setup();
    const banner = await screen.findByRole('dialog', { name: 'We value your privacy' });
    expect(banner.closest('.cb-root')).not.toHaveAttribute('data-theme');
    expect(banner.closest('.cb-root')?.querySelector('style')?.textContent).toContain('prefers-color-scheme: dark');
  });
});

describe('useConsent', () => {
  it('throws outside the provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Status />)).toThrow(/ConsentProvider/);
    error.mockRestore();
  });
});
