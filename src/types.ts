import type { HomeAssistant, Route } from "@ha/types";

export interface VelbusPanelConfig {
  config_entry_id?: string;
  config_entry?: string;
}

export interface VelbusModuleSummary {
  address: number;
  name: string;
  type_id: number;
  type_name: string;
  serial?: string;
  device_id?: string | null;
  channels: Record<string, { name: string }>;
}

export interface VelbusBaseData {
  config_entry_id: string;
  advanced_mode: boolean;
  title: string;
  connected: boolean;
  module_count: number;
}

export interface VelbusActionSlot {
  slot: number;
  empty?: boolean;
  source_address?: number;
  source_channel?: number;
  source_module_name?: string;
  source_channel_name?: string;
  action_key?: string;
  action_label?: string;
}

export interface VelbusChannelMeta {
  channel: number;
  name?: string;
  supports_enable?: boolean;
}

export interface VelbusSchemaSection {
  type: string;
  channels?: (number | VelbusChannelMeta)[];
  actions?: { key: string; label: string }[];
  kind?: string;
  options?: string[];
}

export interface VelbusModuleSchema {
  type_id: number;
  sections: VelbusSchemaSection[];
}

export interface VelbusChannelLive {
  name?: string;
  enabled?: boolean;
  contact?: string;
}

export interface VelbusModuleData {
  address: number;
  name: string;
  type_id: number;
  type_name: string;
  serial?: string;
  sw_version?: string;
  device_id?: string | null;
  channels: Record<string, VelbusChannelLive>;
  schema: VelbusModuleSchema;
}

export type { HomeAssistant, Route };

export type VelbusCallWs = <T = Record<string, unknown>>(
  type: string,
  extra?: Record<string, unknown>,
) => Promise<T>;

export interface VelbusPanelContext {
  hass: HomeAssistant;
  configEntryId: string;
  callWs: VelbusCallWs;
  advancedMode: boolean;
  modules: VelbusModuleSummary[];
  navigate: (path: string) => void;
}
