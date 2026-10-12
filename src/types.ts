import type { TextOverrides } from './i18n/types';
import type { ThemeTokens } from './theme';

export const NECESSARY_CATEGORY = 'necessary';

export interface ConsentCategory {
  /** Stable identifier, stored in the consent record and used for text keys. */
  id: string;
}

export type ConsentChoices = Record<string, boolean>;

export type ConsentAction = 'accept_all' | 'reject_all' | 'custom';

/**
 * One decision by the visitor. Every decision produces a new record with a new
 * id, so a consumer that stores them keeps the full history.
 */
export interface ConsentRecord {
  id: string;
  /** ISO 8601 timestamp of the decision. */
  timestamp: string;
  /** The consent version the decision was made under. */
  version: string;
  choices: ConsentChoices;
  locale: string;
  action: ConsentAction;
}

export type ConsentSignal =
  | 'ad_storage'
  | 'ad_user_data'
  | 'ad_personalization'
  | 'analytics_storage'
  | 'functionality_storage'
  | 'personalization_storage'
  | 'security_storage';

/** Which Google Consent Mode signals each category controls. */
export type ConsentModeMapping = Record<string, ConsentSignal[]>;

export interface ConsentModeOptions {
  mapping?: ConsentModeMapping;
  /** Milliseconds Google tags wait for the update before firing. Default 500. */
  waitForUpdate?: number;
  /** Sets `ads_data_redaction` while ad storage is denied. Default true. */
  adsDataRedaction?: boolean;
  /** Sets `url_passthrough`, to keep ad click ids in links. Default false. */
  urlPassthrough?: boolean;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ConsentConfig {
  /**
   * Optional categories the visitor can toggle. The `necessary` category is
   * always added first and cannot be turned off.
   * Default: analytics and marketing.
   */
  categories?: ConsentCategory[];
  /** Locale used for texts and stored in the record. Default `en`. */
  locale?: string;
  /** Text overrides per locale; also the way to add a new locale. */
  texts?: Record<string, TextOverrides | undefined>;
  /** Link to the cookie policy, shown in the banner. */
  policyUrl?: string;
  /** Bump it when the categories or the policy change: everyone is asked again. */
  version?: string;
  /** Months a decision stays valid before asking again. Default 12. */
  expiryMonths?: number;
  /** `localStorage` key holding the current record. Default `consent-banner`. */
  storageKey?: string;
  /** Default `system`, which follows `prefers-color-scheme`. */
  theme?: ThemeMode;
  /** Overrides for the color and shape tokens, per mode. */
  tokens?: {
    light?: Partial<ThemeTokens>;
    dark?: Partial<ThemeTokens>;
  };
  /** Google Consent Mode v2. `false` turns off the `gtag` updates. */
  consentMode?: ConsentModeOptions | false;
}
