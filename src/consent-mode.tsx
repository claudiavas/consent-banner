import { resolveConfig } from './config';
import type { ConsentChoices, ConsentConfig, ConsentModeMapping, ConsentSignal } from './types';

export type { ConsentModeMapping, ConsentModeOptions, ConsentSignal } from './types';

export type ConsentSignalState = 'granted' | 'denied';

export type ConsentModeState = Partial<Record<ConsentSignal, ConsentSignalState>>;

export const DEFAULT_CONSENT_MODE_MAPPING: ConsentModeMapping = {
  analytics: ['analytics_storage'],
  marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
};

/** The four signals Consent Mode v2 requires, always sent even if unmapped. */
export const REQUIRED_SIGNALS: ConsentSignal[] = [
  'ad_storage',
  'ad_user_data',
  'ad_personalization',
  'analytics_storage',
];

export const DEFAULT_WAIT_FOR_UPDATE = 500;

export function signalsOf(mapping: ConsentModeMapping): ConsentSignal[] {
  const signals = new Set<ConsentSignal>(REQUIRED_SIGNALS);
  for (const list of Object.values(mapping)) list.forEach((signal) => signals.add(signal));
  return [...signals];
}

/**
 * A signal is granted only when every category mapped to it is granted, so a
 * signal shared by two categories never leaks through the one that was denied.
 * A signal no category maps to stays denied.
 */
export function consentModeState(choices: ConsentChoices, mapping: ConsentModeMapping): ConsentModeState {
  const state: ConsentModeState = {};
  for (const signal of signalsOf(mapping)) {
    const owners = Object.keys(mapping).filter((category) => mapping[category]?.includes(signal));
    const granted = owners.length > 0 && owners.every((category) => choices[category] === true);
    state[signal] = granted ? 'granted' : 'denied';
  }
  return state;
}

type DataLayerWindow = Window & { dataLayer?: unknown[] };

/**
 * Pushes a `gtag(...)` command. The `arguments` object is pushed on purpose:
 * Google Tag Manager only processes gtag commands in that shape and silently
 * ignores a plain array.
 */
export function gtag(..._args: unknown[]): void {
  if (typeof window === 'undefined') return;
  const target = window as DataLayerWindow;
  target.dataLayer = target.dataLayer ?? [];
  target.dataLayer.push(arguments);
}

export function pushConsentUpdate(choices: ConsentChoices, mapping: ConsentModeMapping = DEFAULT_CONSENT_MODE_MAPPING): void {
  gtag('consent', 'update', consentModeState(choices, mapping));
}

function serialize(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * Source of the inline script that must run before any Google tag: it declares
 * every signal denied with `wait_for_update`, and, when the visitor already
 * decided on an earlier visit, replays that decision straight away from
 * `localStorage` so returning visitors are measured from the first hit.
 *
 * Pass the same config as the provider, so both read the same key, version,
 * expiry and mapping.
 */
export function consentModeDefaultScript(config: ConsentConfig = {}): string {
  const resolved = resolveConfig(config);
  const options = resolved.consentMode || {};
  const mapping = options.mapping ?? DEFAULT_CONSENT_MODE_MAPPING;
  const signals = signalsOf(mapping);
  const defaults: Record<string, string | number> = {};
  for (const signal of signals) defaults[signal] = 'denied';
  defaults.wait_for_update = options.waitForUpdate ?? DEFAULT_WAIT_FOR_UPDATE;

  const lines = [
    '(function(){',
    'var w=window;w.dataLayer=w.dataLayer||[];',
    'function gtag(){w.dataLayer.push(arguments);}',
    'if(!w.gtag){w.gtag=gtag;}',
    `gtag('consent','default',${serialize(defaults)});`,
  ];
  if (options.adsDataRedaction ?? true) lines.push("gtag('set','ads_data_redaction',true);");
  if (options.urlPassthrough) lines.push("gtag('set','url_passthrough',true);");
  lines.push(
    'try{',
    `var r=JSON.parse(w.localStorage.getItem(${serialize(resolved.storageKey)}));`,
    `if(!r||r.version!==${serialize(resolved.version)}||!r.choices){return;}`,
    `var d=new Date(r.timestamp);d.setMonth(d.getMonth()+${serialize(resolved.expiryMonths)});`,
    'if(!(Date.now()<d.getTime())){return;}',
    `var c=${serialize(resolved.categoryIds)};`,
    "for(var i=0;i<c.length;i++){if(typeof r.choices[c[i]]!=='boolean'){return;}}",
    `var m=${serialize(mapping)},s=${serialize(signals)},u={};`,
    'for(var j=0;j<s.length;j++){var g=false,o=0;',
    'for(var k in m){if(m[k].indexOf(s[j])>-1){o++;if(r.choices[k]!==true){g=false;o=-1;break;}g=true;}}',
    "u[s[j]]=(o>0&&g)?'granted':'denied';}",
    "gtag('consent','update',u);",
    '}catch(e){}',
    '})();',
  );
  return lines.join('\n');
}

export interface ConsentModeDefaultProps {
  config?: ConsentConfig;
  /** Nonce for a Content Security Policy that blocks inline scripts. */
  nonce?: string;
  id?: string;
}

/**
 * Renders the Consent Mode defaults as an inline `<script>`. Place it in the
 * document `<head>`, before any Google tag. Works in Server Components.
 */
export function ConsentModeDefault({ config, nonce, id = 'consent-mode-default' }: ConsentModeDefaultProps) {
  return <script id={id} nonce={nonce} dangerouslySetInnerHTML={{ __html: consentModeDefaultScript(config) }} />;
}
