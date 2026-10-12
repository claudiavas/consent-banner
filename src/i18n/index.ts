import { en } from './en';
import { es } from './es';
import type { Dictionary, TextKey, TextOverrides } from './types';

export type { BuiltInTextKey, CategoryTextKey, Dictionary, TextKey, TextOverrides } from './types';

export const builtInDictionaries: Record<'en' | 'es', Dictionary> = { en, es };

export const DEFAULT_LOCALE = 'en';

export type Translate = (key: TextKey) => string;

/**
 * Resolves a key with this precedence: the consumer's texts for the locale,
 * the built-in dictionary for the locale, then the same two for English. A key
 * missing everywhere renders as the key itself, which makes the gap visible.
 */
export function createTranslator(
  locale: string,
  texts: Record<string, TextOverrides | undefined> = {},
): Translate {
  const builtIn = builtInDictionaries as Record<string, TextOverrides | undefined>;
  const chain = [texts[locale], builtIn[locale], texts[DEFAULT_LOCALE], builtIn[DEFAULT_LOCALE]];
  return (key) => {
    for (const source of chain) {
      const value = source?.[key];
      if (value !== undefined) return value;
    }
    return key;
  };
}
