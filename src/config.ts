import { DEFAULT_LOCALE } from './i18n';
import type { TextOverrides } from './i18n/types';
import { NECESSARY_CATEGORY, type ConsentConfig, type ConsentModeOptions, type ThemeMode } from './types';
import type { ThemeTokens } from './theme';

export const DEFAULT_STORAGE_KEY = 'consent-banner';
export const DEFAULT_VERSION = '1';
export const DEFAULT_EXPIRY_MONTHS = 12;
export const DEFAULT_CATEGORIES = [{ id: 'analytics' }, { id: 'marketing' }];

export interface ResolvedConfig {
  /** Every category id, `necessary` first. */
  categoryIds: string[];
  /** The ids the visitor can toggle. */
  optionalCategoryIds: string[];
  locale: string;
  texts: Record<string, TextOverrides | undefined>;
  policyUrl: string | undefined;
  version: string;
  expiryMonths: number;
  storageKey: string;
  theme: ThemeMode;
  tokens: { light?: Partial<ThemeTokens>; dark?: Partial<ThemeTokens> };
  consentMode: ConsentModeOptions | false;
}

export function resolveConfig(config: ConsentConfig = {}): ResolvedConfig {
  const optional = (config.categories ?? DEFAULT_CATEGORIES)
    .map((category) => category.id)
    .filter((id, index, ids) => id !== NECESSARY_CATEGORY && ids.indexOf(id) === index);

  return {
    categoryIds: [NECESSARY_CATEGORY, ...optional],
    optionalCategoryIds: optional,
    locale: config.locale ?? DEFAULT_LOCALE,
    texts: config.texts ?? {},
    policyUrl: config.policyUrl,
    version: config.version ?? DEFAULT_VERSION,
    expiryMonths: config.expiryMonths ?? DEFAULT_EXPIRY_MONTHS,
    storageKey: config.storageKey ?? DEFAULT_STORAGE_KEY,
    theme: config.theme ?? 'system',
    tokens: config.tokens ?? {},
    consentMode: config.consentMode ?? {},
  };
}
