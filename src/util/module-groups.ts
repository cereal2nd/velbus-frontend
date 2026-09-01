import {
  mdiGestureTap,
  mdiLightbulb,
  mdiMemory,
  mdiThermometer,
  mdiToggleSwitch,
  mdiWindowShutter,
} from "@mdi/js";

import type { VelbusModuleSummary } from "../types";
import { formatAddress } from "./format";

export type ModuleGroupId =
  "relays" | "inputs" | "covers" | "dimmers" | "sensors" | "other";

export const MODULE_GROUP_ORDER: ModuleGroupId[] = [
  "relays",
  "inputs",
  "covers",
  "dimmers",
  "sensors",
  "other",
];

export const MODULE_GROUP_TRANSLATION_KEYS: Record<ModuleGroupId, string> = {
  relays: "component.velbus.config_panel.groups.relays",
  inputs: "component.velbus.config_panel.groups.inputs",
  covers: "component.velbus.config_panel.groups.covers",
  dimmers: "component.velbus.config_panel.groups.dimmers",
  sensors: "component.velbus.config_panel.groups.sensors",
  other: "component.velbus.config_panel.groups.other",
};

export const MODULE_GROUP_ICONS: Record<ModuleGroupId, string> = {
  relays: mdiToggleSwitch,
  inputs: mdiGestureTap,
  covers: mdiWindowShutter,
  dimmers: mdiLightbulb,
  sensors: mdiThermometer,
  other: mdiMemory,
};

export const MODULE_GROUP_ACCENT: Record<ModuleGroupId, string> = {
  relays: "var(--primary-color)",
  inputs: "var(--info-color)",
  covers: "var(--warning-color)",
  dimmers: "var(--amber-color, #ffa000)",
  sensors: "var(--success-color)",
  other: "var(--secondary-text-color)",
};

export function groupForModule(typeName = ""): ModuleGroupId {
  const type = typeName.toUpperCase();
  if (/RY|RELAY/.test(type)) {
    return "relays";
  }
  if (/1BL|2BL|BLE|BLS|BLIND/.test(type)) {
    return "covers";
  }
  if (/DM|DC|DALI|DIM|LED/.test(type)) {
    return "dimmers";
  }
  if (/PIR|1TS|1TC|METEO|4AN/.test(type)) {
    return "sensors";
  }
  if (/GP|VMBEL|LCD|PB|VMBKP|4PD|IN|4RF|8IR|RFR/.test(type)) {
    return "inputs";
  }
  return "other";
}

export function moduleSearchText(module: VelbusModuleSummary): string {
  const address = Number(module.address);
  const hex = address.toString(16).toUpperCase().padStart(2, "0");
  return [
    module.name,
    module.type_name,
    address,
    hex,
    `0x${hex}`,
    formatAddress(address),
  ]
    .filter((part) => part !== undefined && part !== "")
    .join(" ")
    .toLowerCase();
}

export function groupedModules(
  modules: VelbusModuleSummary[],
): Map<ModuleGroupId, VelbusModuleSummary[]> {
  const groups = new Map<ModuleGroupId, VelbusModuleSummary[]>();
  for (const id of MODULE_GROUP_ORDER) {
    groups.set(id, []);
  }
  for (const module of modules) {
    const groupId = groupForModule(module.type_name);
    groups.get(groupId)?.push(module);
  }
  for (const items of groups.values()) {
    items.sort((left, right) => {
      const nameCompare = (left.name || left.type_name || "").localeCompare(
        right.name || right.type_name || "",
        undefined,
        { sensitivity: "base" },
      );
      if (nameCompare !== 0) {
        return nameCompare;
      }
      return Number(left.address) - Number(right.address);
    });
  }
  return groups;
}
