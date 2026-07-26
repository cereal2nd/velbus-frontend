export function renderModulesList(ctx) {
  const { modules } = ctx;
  return `
    <section class="modules-section">
      <h2>Modules</h2>
      ${
        modules.length
          ? `<div class="module-grid">
              ${modules
                .map(
                  (module) => `
                <button class="module-tile" type="button" data-address="${module.address}">
                  <span class="module-address">Address ${module.address} (0x${Number(module.address).toString(16).toUpperCase().padStart(2, "0")})</span>
                  <span class="module-name">${module.name}</span>
                  <span class="module-type muted">${module.type_name}</span>
                </button>`
                )
                .join("")}
            </div>`
          : "<p>No modules found.</p>"
      }
    </section>`;
}

export function bindModulesList(root, handlers) {
  root.querySelectorAll("[data-address]").forEach((element) => {
    element.addEventListener("click", () => {
      handlers.onSelect(Number(element.dataset.address));
    });
  });
}
