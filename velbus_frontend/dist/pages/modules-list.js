import {
  escapeHtml,
  formatAddress,
  ICONS,
  iconForModule,
  svgIcon,
} from "../ui.js";

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
  return `
    <section class="card modules-section">
      <div class="search-row">
        ${svgIcon(ICONS.magnify)}
        <input type="search" id="module-filter" placeholder="Filter modules" autocomplete="off" />
      </div>
      <div class="list">
        ${modules
          .map((module) => {
            const name = escapeHtml(module.name);
            const typeName = escapeHtml(module.type_name);
            const address = formatAddress(module.address);
            const search = escapeHtml(
              `${module.name} ${module.type_name} ${module.address} ${address}`.toLowerCase()
            );
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
          })
          .join("")}
      </div>
      <div class="empty-state empty-filter" hidden>
        ${svgIcon(ICONS.magnify, 40)}
        <p>No matching modules</p>
      </div>
    </section>`;
}

export function bindModulesList(root, handlers) {
  root.querySelectorAll("[data-address]").forEach((element) => {
    element.addEventListener("click", () => {
      handlers.onSelect(Number(element.dataset.address));
    });
  });
  root.querySelector("#module-filter")?.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    const items = [...root.querySelectorAll(".module-item")];
    items.forEach((element) => {
      element.hidden = Boolean(query) && !element.dataset.search.includes(query);
    });
    const emptyFilter = root.querySelector(".empty-filter");
    if (emptyFilter) {
      emptyFilter.hidden = items.some((element) => !element.hidden);
    }
  });
}
