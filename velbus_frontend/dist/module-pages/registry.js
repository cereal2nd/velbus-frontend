/** @type {Record<number|string, string>} */
export const MODULE_TYPE_TO_PAGE = {
  // Examples once specialized pages exist:
  // 0x08: "relay",
  // "VMB4RY": "relay",
};

export const MODULE_PAGES = {
  generic: () => import("./generic.js"),
  // relay: () => import("./relay.js"),
};

export function resolveModulePageType(moduleOrType) {
  const typeId = moduleOrType?.type_id ?? moduleOrType;
  const typeName = moduleOrType?.type_name;
  return (
    MODULE_TYPE_TO_PAGE[typeId] ??
    MODULE_TYPE_TO_PAGE[typeName] ??
    "generic"
  );
}

export async function loadModulePage(pageType) {
  const loader = MODULE_PAGES[pageType] ?? MODULE_PAGES.generic;
  return loader();
}
