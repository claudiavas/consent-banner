# @claudiavas/consent-banner

A small, accessible cookie consent banner for React, with Google Consent Mode v2 built in.

- **Prior consent.** Every optional category starts denied. Nothing is pre-ticked.
- **Equal choice.** "Accept all" and "Reject all" share the same style and sit side by side. A "Customize" panel offers one toggle per category.
- **Consent Mode v2.** An inline script declares the defaults before any Google tag loads. Each decision then pushes a `gtag('consent', 'update', …)`.
- **Withdrawal.** A settings button reopens the panel at any time.
- **Consent log.** Every decision reaches you as a record you can store server-side.
- **Accessible.** The banner and panel are labelled dialogs. The panel traps focus, closes with Escape and returns focus to where it was.
- **i18n.** English and Spanish ship with every key. You can override any text or add a locale.
- **Light and dark themes.** Colours are CSS tokens. The theme follows `prefers-color-scheme` or can be forced.
- **No runtime dependencies** besides React 18 or 19. Works with SSR and the Next.js App Router.

> **Not an IAB TCF CMP.** This library is not certified under the IAB Transparency & Consent Framework. Google requires a certified CMP to serve AdSense or Ad Manager ads to visitors in the EEA, the UK and Switzerland. Use Google's own CMP there. This banner suits sites that use Analytics, Tag Manager or Ads conversion tracking without selling ad inventory.

## Install

```bash
npm install @claudiavas/consent-banner
```

## Quick start (Next.js App Router)

**1. Share one config between the server and the client.**

```ts
// consent.config.ts
import type { ConsentConfig } from '@claudiavas/consent-banner';

export const consentConfig: ConsentConfig = {
  categories: [{ id: 'analytics' }, { id: 'marketing' }],
  policyUrl: '/cookies',
  version: '1',
};
```

**2. Declare the Consent Mode defaults first in `<head>`, before any Google tag.**

`@claudiavas/consent-banner/consent-mode` has no `"use client"` directive, so a Server Component can import it.

```tsx
// app/layout.tsx
import { ConsentModeDefault } from '@claudiavas/consent-banner/consent-mode';
import { consentConfig } from '../consent.config';
import { Consent } from './consent';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ConsentModeDefault config={consentConfig} />
        {/* Google tag or Tag Manager snippet goes after this line */}
      </head>
      <body>
        <Consent>{children}</Consent>
      </body>
    </html>
  );
}
```

**3. Wrap the app in the provider.** The provider renders the banner and the preferences panel by itself.

```tsx
// app/consent.tsx
'use client';

import { ConsentProvider, type ConsentRecord } from '@claudiavas/consent-banner';
import { consentConfig } from '../consent.config';

function logConsent(record: ConsentRecord) {
  navigator.sendBeacon('/api/consent', JSON.stringify(record));
}

export function Consent({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider config={consentConfig} onConsentChange={logConsent}>
      {children}
    </ConsentProvider>
  );
}
```

**4. Let visitors change their mind.** Put the settings button in the footer.

```tsx
import { ConsentSettingsButton } from '@claudiavas/consent-banner';

<ConsentSettingsButton className="footer-link" />;
```

## Configuration

Every field is optional.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `categories` | `{ id: string }[]` | analytics, marketing | Optional categories. `necessary` is always added first and cannot be turned off. |
| `locale` | `string` | `'en'` | Locale for the texts. It is also stored in the record. |
| `texts` | `Record<locale, Partial<Dictionary>>` | — | Text overrides, or a whole new locale. |
| `policyUrl` | `string` | — | Cookie policy link shown in the banner. |
| `version` | `string` | `'1'` | Bump it when the categories or the policy change, and everyone is asked again. |
| `expiryMonths` | `number` | `12` | How long a decision stays valid before the banner returns. |
| `storageKey` | `string` | `'consent-banner'` | The `localStorage` key. |
| `theme` | `'system' \| 'light' \| 'dark'` | `'system'` | `system` follows `prefers-color-scheme`. |
| `layout` | `'card' \| 'bar'` | `'card'` | `card` is a floating rounded box. `bar` is a thin strip fixed edge to edge at the bottom of the viewport. |
| `tokens` | `{ light?, dark? }` | — | Theme token overrides for each mode. |
| `consentMode` | `ConsentModeOptions \| false` | `{}` | Google Consent Mode v2 settings. Set `false` to never touch `dataLayer`. |

The banner asks again in these cases:

- no decision is stored
- the stored decision is older than `expiryMonths`
- its `version` differs from the current one
- a category was added after the decision

### `ConsentProvider` props

| Prop | Type | Description |
| --- | --- | --- |
| `config` | `ConsentConfig` | The configuration above. |
| `onConsentChange` | `(record: ConsentRecord) => void` | Called after every decision, including withdrawals. |

### `useConsent()`

| Member | Description |
| --- | --- |
| `ready` | `false` during SSR and the first render, until storage has been read. |
| `hasDecided` | Whether a valid decision exists. |
| `consent` | The current `ConsentRecord`, or `null`. |
| `choices` | The current choices, as `Record<category, boolean>`. |
| `isGranted(category)` | Whether a category is granted. |
| `acceptAll()`, `rejectAll()`, `save(choices)` | Record a decision. Each returns the new record. |
| `openSettings()`, `closeSettings()` | Open or close the preferences panel. |
| `isBannerOpen`, `isSettingsOpen` | UI state. |
| `t(key)` | The translator, for your own consent-related texts. |

### Other exports

- `<ConsentSettingsButton>`
  - An unstyled `<button>` that opens the preferences panel.
  - It accepts every button prop.
  - Its default label comes from the dictionary.
- `openConsentSettings()`
  - Opens the panel from anywhere, including non-React code.
  - Example: `<a onclick="…">` in a CMS footer.
- `<ConsentGate category fallback?>`
  - Renders its children only once the category is granted.
- `consentModeDefaultScript(config)`
  - The inline default script as a string, for frameworks without a React `<head>`.
- `consentModeState(choices, mapping)`, `pushConsentUpdate(choices, mapping)`, `DEFAULT_CONSENT_MODE_MAPPING`
  - Lower-level Consent Mode helpers.
- `builtInDictionaries`, `lightTokens`, `darkTokens`
  - The built-in texts and theme values.

## Texts and locales

Keys describe the place, not the wording:

- `banner.title`, `banner.description`, `banner.policyLink`
- `banner.actions.acceptAll`, `banner.actions.rejectAll`, `banner.actions.customize`
- `preferences.title`, `preferences.description`, `preferences.alwaysOn`
- `preferences.actions.save`, `preferences.actions.acceptAll`, `preferences.actions.rejectAll`, `preferences.actions.close`
- `settingsButton.label`
- `categories.<id>.title`, `categories.<id>.description`

```ts
const config: ConsentConfig = {
  locale: 'fr',
  categories: [{ id: 'analytics' }, { id: 'video' }],
  texts: {
    fr: { 'banner.actions.acceptAll': 'Tout accepter' /* … */ },
    en: { 'categories.video.title': 'Embedded video', 'categories.video.description': 'YouTube players.' },
  },
};
```

A missing key falls back in this order:

1. the configured locale's overrides
2. the built-in dictionary for that locale
3. English

## Theming

All colours and shapes are CSS variables on `.cb-root`. Each one has a light and a dark value. Override them per mode:

```ts
const config: ConsentConfig = {
  theme: 'system',
  tokens: {
    light: { buttonBackground: '#0f766e', buttonBorder: '#0f766e', radius: '4px' },
    dark: { buttonBackground: '#2dd4bf', buttonForeground: '#042f2e' },
  },
};
```

### Layout

The banner comes in two shapes, picked with `layout`:

- **`card`** (default): a floating box with a maximum width, outer margins, rounded corners and a shadow. Text sits above the buttons.
- **`bar`**: a compact strip fixed to the bottom of the viewport, edge to edge, with only a top border. On wide screens the text is on the left and the buttons stay in one row on the right. On phones the text stacks above the buttons, still edge to edge.

```ts
const config: ConsentConfig = { layout: 'bar' };
```

Both layouts use the same tokens and keep the same focus and accessibility behaviour.

The tokens are:

- **Surface and text:** `background`, `foreground`, `muted`, `border`, `link`, `focusRing`, `overlay`, `shadow`
- **Buttons:** `buttonBackground`, `buttonForeground`, `buttonBorder`, `buttonHoverBackground`, `secondaryButtonBackground`, `secondaryButtonForeground`
- **Switches:** `switchOn`, `switchOff`, `switchThumb`
- **Shape and layering:** `radius`, `fontFamily`, `zIndex`

## Google Consent Mode v2

`<ConsentModeDefault>` writes an inline script. It must run before the Google tag or Tag Manager loads. It does three things:

1. It defines `gtag` if it is missing, and declares every signal **denied**: `ad_storage`, `ad_user_data`, `ad_personalization` and `analytics_storage`. It includes `wait_for_update`, so tags wait for the banner.
2. It sets `ads_data_redaction`, and `url_passthrough` if you enable it.
3. If a valid decision is already stored, it pushes the matching `update` straight away. Returning visitors are then measured from the first hit, without waiting for React to hydrate.

After that, every decision pushes `gtag('consent', 'update', …)`. Entries go to `dataLayer` as `arguments` objects, not arrays. Tag Manager ignores the array form.

Categories map to signals like this:

```ts
consentMode: {
  mapping: {
    analytics: ['analytics_storage'],
    marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
  },
  waitForUpdate: 500,
  adsDataRedaction: true,
  urlPassthrough: false,
}
```

Two rules apply to the mapping:

- A signal is granted only when **every** category mapped to it is granted.
- The four required signals stay denied when no category maps them.

Pass `consentMode: false` if you do not use Google tags.

### Basic or advanced mode

- **Advanced mode** is the default setup above. Google tags load on every page and adjust their behaviour to the consent state. Without consent they send cookieless pings.
- **Basic mode:** no Google script loads until consent is given. Wrap the tag in `<ConsentGate>`:

```tsx
import { ConsentGate } from '@claudiavas/consent-banner';
import Script from 'next/script';

<ConsentGate category="analytics">
  <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX" strategy="afterInteractive" />
</ConsentGate>;
```

`ConsentGate` also suits non-Google embeds, such as video players, maps or chat widgets.

**Withdrawing consent cannot unload a script that already ran.** It does three things:

- updates Consent Mode, so Google tags stop using cookies
- unmounts everything inside `ConsentGate`
- calls `onConsentChange`

Cookies already set by third parties are not deleted. Reload the page in `onConsentChange` if you need a clean state.

## Consent log

The GDPR requires you to be able to show that consent was given. Each decision produces a record:

```ts
interface ConsentRecord {
  id: string; // new UUID for every decision
  timestamp: string; // ISO 8601
  version: string; // config.version at the time
  choices: Record<string, boolean>; // necessary is always true
  locale: string;
  action: 'accept_all' | 'reject_all' | 'custom';
}
```

- The latest record lives in `localStorage`, so the browser can tell whether to ask again.
- The record is also passed to `onConsentChange`. Send it to your own backend if you need an auditable log.
- The record holds no personal data. If you link it to a user, that link is yours to manage.

## Development

```bash
npm install
npm test
npm run build
```

## License

[MIT](./LICENSE)
