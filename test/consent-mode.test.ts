import { describe, expect, it } from 'vitest';
import { consentModeDefaultScript, consentModeState } from '../src/consent-mode';
import { consentUpdates, dataLayer, storeRecord } from './helpers';

function runScript(source: string) {
  new Function(source)();
}

describe('consentModeState', () => {
  it('maps categories to signals with the default mapping', () => {
    expect(consentModeState({ analytics: true, marketing: false }, { analytics: ['analytics_storage'], marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'] })).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
    });
  });

  it('grants a shared signal only when every owning category is granted', () => {
    const mapping = { analytics: ['analytics_storage' as const], marketing: ['analytics_storage' as const, 'ad_storage' as const] };
    expect(consentModeState({ analytics: true, marketing: false }, mapping).analytics_storage).toBe('denied');
    expect(consentModeState({ analytics: true, marketing: true }, mapping).analytics_storage).toBe('granted');
  });

  it('denies required signals no category maps', () => {
    expect(consentModeState({ analytics: true }, { analytics: ['analytics_storage'] }).ad_user_data).toBe('denied');
  });
});

describe('consentModeDefaultScript', () => {
  it('declares every signal denied with wait_for_update, as arguments objects', () => {
    runScript(consentModeDefaultScript());
    const [first] = dataLayer();
    expect(Object.prototype.toString.call(first)).toBe('[object Arguments]');
    expect(Array.from(first as ArrayLike<unknown>)).toEqual([
      'consent',
      'default',
      {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 500,
      },
    ]);
    expect(consentUpdates()).toEqual([]);
  });

  it('applies the configured options', () => {
    const source = consentModeDefaultScript({ consentMode: { waitForUpdate: 2000, urlPassthrough: true, adsDataRedaction: false } });
    expect(source).toContain('"wait_for_update":2000');
    expect(source).toContain("'url_passthrough',true");
    expect(source).not.toContain('ads_data_redaction');
  });

  it('replays a valid stored decision immediately', () => {
    storeRecord({ choices: { necessary: true, analytics: true, marketing: false } });
    runScript(consentModeDefaultScript());
    expect(consentUpdates()).toEqual([
      { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' },
    ]);
  });

  it('does not replay an expired, outdated or incomplete decision', () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 13);
    storeRecord({ timestamp: old.toISOString() });
    runScript(consentModeDefaultScript());
    storeRecord({ version: '1' });
    runScript(consentModeDefaultScript({ version: '2' }));
    storeRecord({ choices: { necessary: true, analytics: true } });
    runScript(consentModeDefaultScript());
    expect(consentUpdates()).toEqual([]);
  });

  it('escapes values that could close the script tag', () => {
    expect(consentModeDefaultScript({ storageKey: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
});
