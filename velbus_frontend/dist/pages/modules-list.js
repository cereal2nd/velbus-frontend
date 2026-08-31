import {
  escapeHtml,
  formatAddress,
  groupForModule,
  ICONS,
  iconForModule,
  MODULE_GROUP_ORDER,
  MODULE_GROUPS,
  moduleSearchText,
  svgIcon,
} from "../ui.js";

function groupedModules(modules) {
  const groups = new Map();
  for (const id of MODULE_GROUP_ORDER) {
    groups.set(id, []);
  }
  for (const module of modules) {
    const groupId = groupForModule(module.type_name);
    if (!groups.has(groupId)) {
      groups.set(groupId, []);
    }
    groups.get(groupId).push(module);
  }
  for (const items of groups.values()) {
    items.sort((left, right) => {
      const nameCompare = (left.name || left.type_name || "").localeCompare(
        right.name || right.type_name || "",
        undefined,
        { sensitivity: "base" }
      );
      if (nameCompare !== 0) {
        return nameCompare;
      }
      return Number(left.address) - Number(right.address);
    });
  }
  return groups;
}

function renderModuleItem(module) {
  const name = escapeHtml(module.name || module.type_name);
  const typeName = escapeHtml(module.type_name);
  const address = formatAddress(module.address);
  const search = escapeHtml(moduleSearchText(module));
  return `
    <button class="module-item" type="button" data-address="${module.address}" data-search="${search}">
      <span class="item-icon">${svgIcon(iconForModule(module.type_name))}</span>
      <span class="item-content">
        <span class="item-title">${name}</span>
        <span class="item-secondary">${typeName}</span>
      </span>
      <span class="item-meta">
        <span class="chip">${escapeHtml(address)}</span>
        ${svgIcon(ICONS.chevronRight)}
      </span>
    </button>`;
}

function renderModuleGroup(groupId, modules) {
  if (!modules.length) {
    return "";
  }
  const group = MODULE_GROUPS[groupId];
  return `
    <details class="module-group" data-group="${groupId}">
      <summary class="module-group-header">
        <span class="item-icon">${svgIcon(group.icon)}</span>
        <span class="item-content">
          <span class="item-title">${escapeHtml(group.label)}</span>
        </span>
        <span class="item-meta">
          <span class="chip group-count">${modules.length}</span>
          <span class="group-chevron">${svgIcon(ICONS.chevronDown)}</span>
        </span>
      </summary>
      ${modules.map(renderModuleItem).join("")}
    </details>`;
}

export function renderModulesList(ctx) {
  const { modules } = ctx;
  if (!modules.length) {
    return `
      <div class="card">
        <div class="empty-state">
          ${svgIcon(ICONS.memory, 40)}
          <p>No modules found</p>
        </div>
      </div>`;
  }
  const groups = groupedModules(modules);
  return `
    <section class="card modules-section">
      <div class="search-row">
        ${svgIcon(ICONS.magnify)}
        <input type="search" id="module-filter" placeholder="Filter by name, type or address" autocomplete="off" />
        <div class="search-actions">
          <button type="button" class="icon-button" id="expand-groups" aria-label="Expand all">
            ${svgIcon(ICONS.unfoldMore)}
          </button>
          <button type="button" class="icon-button" id="collapse-groups" aria-label="Collapse all">
            ${svgIcon(ICONS.unfoldLess)}
          </button>
        </div>
      </div>
      <div class="list">
        ${MODULE_GROUP_ORDER.map((groupId) =>
          renderModuleGroup(groupId, groups.get(groupId) || [])
        ).join("")}
      </div>
      <div class="empty-state empty-filter" hidden>
        ${svgIcon(ICONS.magnify, 40)}
        <p>No matching modules</p>
      </div>
    </section>`;
}

function applyModuleFilter(root) {
  const query =
    root.querySelector("#module-filter")?.value.trim().toLowerCase() ?? "";
  const items = [...root.querySelectorAll(".module-item")];
  items.forEach((element) => {
    const search = element.dataset.search ?? "";
    element.hidden = Boolean(query) && !search.includes(query);
  });
  root.querySelectorAll(".module-group").forEach((group) => {
    const visibleItems = [
      ...group.querySelectorAll(".module-item"),
    ].filter((element) => !element.hidden);
    group.hidden = visibleItems.length === 0;
    const count = group.querySelector(".group-count");
    if (count) {
      count.textContent = String(visibleItems.length);
    }
    if (query && visibleItems.length) {
      group.open = true;
    }
  });
  const emptyFilter = root.querySelector(".empty-filter");
  if (emptyFilter) {
    emptyFilter.hidden = items.some((element) => !element.hidden);
  }
}

export function bindModulesList(root, handlers) {
  root.querySelectorAll(".module-item[data-address]").forEach((element) => {
    element.addEventListener("click", () => {
      handlers.onSelect(Number(element.dataset.address));
    });
  });
  const filter = root.querySelector("#module-filter");
  filter?.addEventListener("input", () => applyModuleFilter(root));
  filter?.addEventListener("search", () => applyModuleFilter(root));
  root.querySelector("#expand-groups")?.addEventListener("click", () => {
    setGroupsOpen(root, true);
  });
  root.querySelector("#collapse-groups")?.addEventListener("click", () => {
    setGroupsOpen(root, false);
  });
}

function setGroupsOpen(root, open) {
  root.querySelectorAll(".module-group").forEach((group) => {
    if (!group.hidden) {
      group.open = open;
    }
  });
}
