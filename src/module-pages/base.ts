import type {
  VelbusActionSlot,
  VelbusChannelMeta,
  VelbusModuleData,
  VelbusModuleSchema,
  VelbusModuleSummary,
  VelbusSchemaSection,
} from "../types";

export function getModule(
  modules: VelbusModuleSummary[],
  address: number,
): VelbusModuleSummary | undefined {
  return modules.find((module) => module.address === address);
}

export function asChannelNumber(entry: number | VelbusChannelMeta): number {
  return typeof entry === "number" ? entry : entry.channel;
}

export function channelNumbers(section?: VelbusSchemaSection): number[] {
  return (section?.channels ?? []).map(asChannelNumber);
}

export function namedChannelEntries(
  section?: VelbusSchemaSection,
): VelbusChannelMeta[] {
  return (section?.channels ?? []).filter(
    (entry): entry is VelbusChannelMeta => typeof entry !== "number",
  );
}

export function formatSource(
  slot: VelbusActionSlot,
  channelFallback: (channel: number) => string,
): string {
  if (slot.source_module_name) {
    const label =
      slot.source_channel_name ||
      (slot.source_channel != null
        ? channelFallback(slot.source_channel)
        : "?");
    return `${slot.source_module_name} / ${label}`;
  }
  return `${slot.source_address}:${slot.source_channel ?? "?"}`;
}

export function sourceChannelOptions(
  modules: VelbusModuleSummary[],
  moduleAddress: number,
  channelFallback: (channel: number) => string,
): { value: number; label: string }[] {
  const module = getModule(modules, moduleAddress);
  if (!module?.channels) {
    return [];
  }
  return Object.entries(module.channels)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([channel, info]) => ({
      value: Number(channel),
      label: info.name || channelFallback(Number(channel)),
    }));
}

export function channelLabel(
  channel: number,
  sections: VelbusSchemaSection[],
  liveChannels: VelbusModuleData["channels"],
  fallback: (channel: number) => string,
): string {
  const channelMeta = namedChannelEntries(
    sections.find((section) => section.type === "channels"),
  ).find((entry) => entry.channel === channel);
  const live = liveChannels[String(channel)] || {};
  return live.name || channelMeta?.name || fallback(channel);
}

export function findActionTable(
  sections: VelbusSchemaSection[],
): VelbusSchemaSection | undefined {
  return sections.find((section) => section.type === "action_table");
}

export function findChannelNames(
  sections: VelbusSchemaSection[],
): VelbusSchemaSection | undefined {
  return sections.find((section) => section.type === "channel_names");
}

export function findChannelEnable(
  sections: VelbusSchemaSection[],
): VelbusSchemaSection | undefined {
  return sections.find((section) => section.type === "channel_enable");
}

export function findContact(
  sections: VelbusSchemaSection[],
): VelbusSchemaSection | undefined {
  return sections.find((section) => section.type === "contact");
}

export function isProgrammedSlot(slot: VelbusActionSlot): boolean {
  if (slot.empty) {
    return false;
  }
  const source = slot.source_address;
  return source != null && source !== 0 && source !== 255;
}

export function getSchemaSections(
  schema: VelbusModuleSchema | undefined,
): VelbusSchemaSection[] {
  return schema?.sections ?? [];
}
