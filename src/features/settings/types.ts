export interface AppSettings {
  organizationName: string;
  supportEmail: string;
  timezone: string;
  notificationsEnabled: boolean;
}

export type UpdateSettingsInput = Partial<AppSettings>;

/** USR-08/09: per-user preference key/value pair. */
export interface UserSetting {
  settingKey: string;
  settingValue: unknown;
}

/** USR-09 PATCH body: settings envelope per backend zod schema. */
export interface UpdateMySettingsInput {
  settings: Array<{ key: string; value: unknown }>;
}
