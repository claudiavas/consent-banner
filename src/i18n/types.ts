export type BuiltInTextKey =
  | 'banner.title'
  | 'banner.description'
  | 'banner.policyLink'
  | 'banner.actions.acceptAll'
  | 'banner.actions.rejectAll'
  | 'banner.actions.customize'
  | 'preferences.title'
  | 'preferences.description'
  | 'preferences.alwaysOn'
  | 'preferences.actions.save'
  | 'preferences.actions.acceptAll'
  | 'preferences.actions.rejectAll'
  | 'preferences.actions.close'
  | 'settingsButton.label'
  | 'categories.necessary.title'
  | 'categories.necessary.description'
  | 'categories.functional.title'
  | 'categories.functional.description'
  | 'categories.analytics.title'
  | 'categories.analytics.description'
  | 'categories.marketing.title'
  | 'categories.marketing.description';

/**
 * Category texts follow the pattern `categories.<id>.title` and
 * `categories.<id>.description`, so a custom category brings its own keys.
 */
export type CategoryTextKey = `categories.${string}.${'title' | 'description'}`;

export type TextKey = BuiltInTextKey | CategoryTextKey;

export type Dictionary = Record<BuiltInTextKey, string>;

export type TextOverrides = Partial<Record<TextKey, string>>;
