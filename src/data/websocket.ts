import type { HomeAssistant } from "@ha/types";

import type {
  VelbusActionSlot,
  VelbusBaseData,
  VelbusCallWs,
  VelbusModuleData,
  VelbusModuleSummary,
} from "../types";

export function createVelbusWsClient(
  hass: HomeAssistant,
  configEntryId: string,
): VelbusCallWs {
  return async (type, extra = {}) =>
    hass.callWS({
      type,
      config_entry: configEntryId,
      ...extra,
    });
}

export async function fetchBaseData(
  callWs: VelbusCallWs,
): Promise<VelbusBaseData> {
  return callWs<VelbusBaseData>("velbus/config_panel/get_base_data", {});
}

export async function fetchModules(
  callWs: VelbusCallWs,
): Promise<VelbusModuleSummary[]> {
  const result = await callWs<{ modules: VelbusModuleSummary[] }>(
    "velbus/config_panel/modules",
    {},
  );
  return result.modules ?? [];
}

export async function fetchModule(
  callWs: VelbusCallWs,
  address: number,
): Promise<VelbusModuleData> {
  return callWs<VelbusModuleData>("velbus/config_panel/module/get", {
    address,
  });
}

export async function fetchChannelActions(
  callWs: VelbusCallWs,
  address: number,
  channel: number,
  refresh = false,
): Promise<VelbusActionSlot[]> {
  const result = await callWs<{ slots: VelbusActionSlot[] }>(
    "velbus/config_panel/module/actions/get",
    { address, channel, refresh },
  );
  return result.slots ?? [];
}

export async function saveChannelName(
  callWs: VelbusCallWs,
  address: number,
  channel: number,
  value: string,
): Promise<void> {
  await callWs("velbus/config_panel/module/config/set", {
    address,
    channel,
    key: "name",
    value,
  });
}

export async function saveChannelEnabled(
  callWs: VelbusCallWs,
  address: number,
  channel: number,
  enabled: boolean,
): Promise<void> {
  await callWs("velbus/config_panel/module/config/set", {
    address,
    channel,
    key: "enabled",
    value: enabled,
  });
}

export async function saveChannelContact(
  callWs: VelbusCallWs,
  address: number,
  channel: number,
  value: string,
): Promise<void> {
  await callWs("velbus/config_panel/module/config/set", {
    address,
    channel,
    key: "contact",
    value,
  });
}

export async function programAction(
  callWs: VelbusCallWs,
  address: number,
  channel: number,
  sourceAddress: number,
  sourceChannel: number,
  action: string,
): Promise<void> {
  await callWs("velbus/config_panel/module/actions/set", {
    address,
    channel,
    source_address: sourceAddress,
    source_channel: sourceChannel,
    action,
  });
}

export async function clearActionSlot(
  callWs: VelbusCallWs,
  address: number,
  channel: number,
  slot: number,
): Promise<void> {
  await callWs("velbus/config_panel/module/actions/clear", {
    address,
    channel,
    slot,
  });
}
