export const MODULE_TYPE_TO_PAGE: Record<number | string, string> = {};

export const MODULE_PAGES: Record<string, () => Promise<unknown>> = {
  generic: () => import("./generic-module-page"),
};

export function resolveModulePageType(
  moduleOrType: { type_id?: number; type_name?: string } | number | string,
): string {
  const typeId =
    typeof moduleOrType === "object" ? moduleOrType.type_id : moduleOrType;
  const typeName =
    typeof moduleOrType === "object" ? moduleOrType.type_name : undefined;
  return (
    (typeId != null ? MODULE_TYPE_TO_PAGE[typeId] : undefined) ??
    (typeName ? MODULE_TYPE_TO_PAGE[typeName] : undefined) ??
    "generic"
  );
}

export async function loadModulePage(pageType: string): Promise<string> {
  const loader = MODULE_PAGES[pageType] ?? MODULE_PAGES.generic;
  await loader();
  return pageType === "generic" || !MODULE_PAGES[pageType]
    ? "velbus-generic-module-page"
    : `velbus-${pageType}-module-page`;
}
