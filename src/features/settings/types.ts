export interface AppSettings {
  organizationName: string;
  supportEmail: string;
  timezone: string;
  notificationsEnabled: boolean;
}

export type UpdateSettingsInput = Partial<AppSettings>;
