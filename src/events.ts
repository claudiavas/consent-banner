export const OPEN_SETTINGS_EVENT = 'consent-banner:open-settings';

/**
 * Opens the preferences panel from anywhere, including code outside React such
 * as a link in server-rendered HTML. The mounted `ConsentProvider` listens.
 */
export function openConsentSettings(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT));
}
