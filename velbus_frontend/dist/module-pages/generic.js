import {
  channelLabel,
  findActionTable,
  findChannelEnable,
  findChannelNames,
  findContact,
  formatSource,
  isProgrammedSlot,
  sourceChannelOptions,
} from "./base.js";
import {
  escapeHtml,
  formatAddress,
  ICONS,
  svgIcon,
} from "../ui.js";

function canEdit(advancedMode, interactionsDisabled) {
  return advancedMode && !interactionsDisabled;
}

function renderAddActionDialog(ctx) {
  const {
    showAddActionDialog,
    actionTable,
    modules,
    advancedMode,
    interactionsDisabled,
    sourceModuleAddress,
  } = ctx;
  if (!showAddActionDialog || !actionTable) {
    return "";
  }
  const editable = canEdit(advancedMode, interactionsDisabled);
  const sourceAddress =
    sourceModuleAddress ?? (modules.length ? modules[0].address : null);
  const title =
    actionTable.kind === "input" ? "Add input action" : "Add action";
  return `
    <div class="dialog-backdrop" id="add-action-dialog">
      <div class="dialog" role="dialog" aria-labelledby="add-action-title">
        <div class="dialog-header">
          <h2 id="add-action-title">${title}</h2>
          <button type="button" class="icon-button" id="cancel-add-action" aria-label="Close">
            ${svgIcon(ICONS.close)}
          </button>
        </div>
        <div class="dialog-content">
          <p class="secondary">Program a new action for the selected channel.</p>
          <label><span>Source module</span>
            <select id="source-module" ${editable ? "" : "disabled"}>
              ${modules
                .map(
                  (module) =>
                    `<option value="${module.address}" ${
                      module.address === sourceAddress ? "selected" : ""
                    }>${escapeHtml(module.name)} (${module.address})</option>`
                )
                .join("")}
            </select>
          </label>
          <label><span>Source channel</span>
            <select id="source-channel" ${editable ? "" : "disabled"}>
              ${sourceChannelOptions(modules, sourceAddress)}
            </select>
          </label>
          <label><span>Action</span>
            <select id="action-key" ${editable ? "" : "disabled"}>
              ${actionTable.actions
                .map(
                  (action) =>
                    `<option value="${escapeHtml(action.key)}">${escapeHtml(
                      action.label
                    )}</option>`
                )
                .join("")}
            </select>
          </label>
        </div>
        <div class="dialog-actions">
          <button type="button" class="secondary" id="cancel-add-action-footer">Cancel</button>
          <button type="button" class="primary" id="confirm-add-action" ${
            editable ? "" : "disabled"
          }>Program</button>
        </div>
      </div>
    </div>`;
}

function renderChannelSettings({
  actionChannel,
  channelNames,
  contact,
  selectedSupportsEnable,
  selectedEnabled,
  channels,
  editable,
}) {
  const rows = [];
  if (channelNames?.channels?.some((entry) => entry.channel === actionChannel)) {
    rows.push(`
      <div class="settings-row">
        <div class="settings-body">
          <div class="settings-title">Name</div>
          <div class="settings-secondary">Up to 16 characters</div>
        </div>
        <input
          type="text"
          maxlength="16"
          data-channel-name="${actionChannel}"
          value="${escapeHtml(channels[String(actionChannel)]?.name || "")}"
          ${editable ? "" : "disabled"}
        />
      </div>`);
  }
  if (contact?.channels?.includes(actionChannel)) {
    const current = channels[String(actionChannel)]?.contact || "NO";
    rows.push(`
      <div class="settings-row">
        <div class="settings-body">
          <div class="settings-title">Contact</div>
          <div class="settings-secondary">Normally open or closed</div>
        </div>
        <select data-channel-contact="${actionChannel}" ${editable ? "" : "disabled"}>
          ${(contact.options || ["NO", "NC"])
            .map(
              (option) =>
                `<option value="${escapeHtml(option)}" ${
                  option === current ? "selected" : ""
                }>${escapeHtml(option)}</option>`
            )
            .join("")}
        </select>
      </div>`);
  }
  if (selectedSupportsEnable) {
    rows.push(`
      <div class="settings-row">
        <div class="settings-body">
          <div class="settings-title">Enabled</div>
          <div class="settings-secondary">Include this channel on the bus</div>
        </div>
        <span class="toggle-wrap">
          <input
            class="toggle"
            type="checkbox"
            data-channel-enable="${actionChannel}"
            ${selectedEnabled ? "checked" : ""}
            ${editable ? "" : "disabled"}
          />
        </span>
      </div>`);
  }
  return rows.join("");
}

function renderActionSlots({
  actions,
  actionsLoaded,
  loadingActions,
  editable,
  interactionsDisabled,
}) {
  if (loadingActions && !actions.length) {
    return `<div class="loading-state"><div class="spinner"></div><p>Loading actions…</p></div>`;
  }
  if (!actionsLoaded) {
    return `
      <div class="empty-state">
        ${svgIcon(ICONS.flash, 40)}
        <p>Select a channel tab to load programmed actions</p>
      </div>`;
  }
  if (!actions.length) {
    return `
      <div class="empty-state">
        ${svgIcon(ICONS.flash, 40)}
        <p>No programmed actions for this channel</p>
      </div>`;
  }
  return `
    <div class="list">
      ${actions
        .map((slot) => {
          const source = formatSource(slot);
          const title = slot.action_label || slot.action_key || "Action";
          return `
            <div class="list-item static">
              <span class="slot-badge">${slot.slot}</span>
              <span class="item-content">
                <span class="item-title">${escapeHtml(title)}</span>
                <span class="item-secondary" title="${escapeHtml(
                  `${slot.source_address}:${slot.source_channel ?? "?"}`
                )}">${escapeHtml(source)}</span>
              </span>
              ${
                editable
                  ? `<button type="button" class="icon-button danger" data-clear-slot="${
                      slot.slot
                    }" aria-label="Clear slot ${slot.slot}" ${
                      interactionsDisabled ? "disabled" : ""
                    }>${svgIcon(ICONS.deleteOutline)}</button>`
                  : ""
              }
            </div>`;
        })
        .join("")}
    </div>`;
}

export function render(ctx) {
  const {
    moduleData,
    modules,
    actionChannel,
    actionSlots,
    actionsLoaded,
    loadingActions,
    interactionsDisabled,
    advancedMode,
    showAddActionDialog,
    sourceModuleAddress,
  } = ctx;

  if (!moduleData) {
    return "";
  }

  const editable = canEdit(advancedMode, interactionsDisabled);

  const schema = moduleData.schema || { sections: [] };
  const sections = schema.sections || [];
  const channelNames = findChannelNames(sections);
  const actionTable = findActionTable(sections);
  const channelEnable = findChannelEnable(sections);
  const contact = findContact(sections);
  const channels = moduleData.channels || {};
  const actions = (actionSlots || []).filter(isProgrammedSlot);
  const selectedChannelLabel = channelLabel(actionChannel, sections, channels);
  const selectedSupportsEnable =
    channelEnable?.channels?.includes(actionChannel) ||
    (sections.find((section) => section.type === "channels")?.channels || []).some(
      (entry) => entry.channel === actionChannel && entry.supports_enable
    );
  const selectedEnabled = channels[String(actionChannel)]?.enabled !== false;

  const dialogCtx = {
    showAddActionDialog,
    actionTable,
    modules,
    advancedMode,
    interactionsDisabled,
    sourceModuleAddress,
  };

  const infoRows = [
    ["Address", formatAddress(moduleData.address)],
    moduleData.sw_version ? ["Firmware", moduleData.sw_version] : null,
    moduleData.serial ? ["Serial number", moduleData.serial] : null,
  ].filter(Boolean);

  return `
    ${
      !advancedMode
        ? `<div class="ha-alert warning">
            ${svgIcon(ICONS.alertOutline)}
            <div>Advanced mode is disabled. Enable it in the Velbus integration options to program module memory.</div>
          </div>`
        : ""
    }
    <section class="card">
      <div class="card-header">Device info</div>
      <div class="card-content">
        <div class="model">${escapeHtml(moduleData.type_name || "")}</div>
        ${infoRows
          .map(
            ([label, value]) =>
              `<div class="extra-info">${escapeHtml(label)}: ${escapeHtml(value)}</div>`
          )
          .join("")}
      </div>
    </section>
    ${
      actionTable
        ? `<div class="module-layout">
            <section class="card channel-panel">
              <div class="card-header compact">Channels</div>
              <ul class="channel-list">
                ${actionTable.channels
                  .map((channel) => {
                    const label = channelLabel(channel, sections, channels);
                    const isActive = channel === actionChannel;
                    const live = channels[String(channel)] || {};
                    const disabled = live.enabled === false;
                    return `<li>
                      <button
                        type="button"
                        class="channel-item${isActive ? " active" : ""}${
                          disabled ? " disabled-channel" : ""
                        }"
                        data-action-channel="${channel}"
                        ${interactionsDisabled ? "disabled" : ""}
                      >
                        <span class="slot-badge">${channel}</span>
                        <span class="item-content">
                          <span class="item-title">${escapeHtml(label)}</span>
                          ${
                            disabled
                              ? `<span class="item-secondary">Disabled</span>`
                              : `<span class="item-secondary">Channel ${channel}</span>`
                          }
                        </span>
                      </button>
                    </li>`;
                  })
                  .join("")}
              </ul>
            </section>
            <section class="card actions-panel">
              <div class="card-header compact">
                <div class="card-header-text">
                  ${actionTable.kind === "input" ? "Input actions" : "Actions"}
                  <span class="card-header-secondary">${escapeHtml(
                    selectedChannelLabel
                  )}</span>
                </div>
              </div>
              <div class="card-actions">
                <button type="button" id="add-action" class="primary" ${
                  editable ? "" : "disabled"
                }>
                  ${svgIcon(ICONS.plus, 18)} Add action
                </button>
              </div>
              ${renderChannelSettings({
                actionChannel,
                channelNames,
                contact,
                selectedSupportsEnable,
                selectedEnabled,
                channels,
                editable,
              })}
              ${renderActionSlots({
                actions,
                actionsLoaded,
                loadingActions,
                editable,
                interactionsDisabled,
              })}
            </section>
          </div>
          ${renderAddActionDialog(dialogCtx)}`
        : `${
            channelNames
              ? `<section class="card">
              <div class="card-header compact">Channel names</div>
              ${channelNames.channels
                .map((channel) => {
                  const live = channels[String(channel.channel)] || {};
                  const value = live.name || "";
                  return `<div class="settings-row">
                    <div class="settings-body">
                      <div class="settings-title">${escapeHtml(channel.name)}</div>
                    </div>
                    <input
                      type="text"
                      maxlength="16"
                      data-channel-name="${channel.channel}"
                      value="${escapeHtml(value)}"
                      ${editable ? "" : "disabled"}
                    />
                  </div>`;
                })
                .join("")}
            </section>`
              : ""
          }${
            contact
              ? `<section class="card">
              <div class="card-header compact">Contact type</div>
              ${contact.channels
                .map((channel) => {
                  const live = channels[String(channel)] || {};
                  const current = live.contact || "NO";
                  const label = channelLabel(channel, sections, channels);
                  return `<div class="settings-row">
                    <div class="settings-body">
                      <div class="settings-title">${escapeHtml(label)}</div>
                    </div>
                    <select
                      data-channel-contact="${channel}"
                      ${editable ? "" : "disabled"}
                    >
                      ${(contact.options || ["NO", "NC"])
                        .map(
                          (option) =>
                            `<option value="${escapeHtml(option)}" ${
                              option === current ? "selected" : ""
                            }>${escapeHtml(option)}</option>`
                        )
                        .join("")}
                    </select>
                  </div>`;
                })
                .join("")}
            </section>`
              : ""
          }`
    }`;
}

export function bind(root, handlers) {
  root.querySelectorAll("[data-action-channel]").forEach((element) => {
    element.addEventListener("click", () => {
      handlers.onSelectChannel(Number(element.dataset.actionChannel));
    });
  });

  root.querySelector("#add-action")?.addEventListener("click", () => {
    handlers.onShowAddAction();
  });

  const hideAddAction = () => handlers.onHideAddAction();
  root.querySelector("#cancel-add-action")?.addEventListener("click", hideAddAction);
  root
    .querySelector("#cancel-add-action-footer")
    ?.addEventListener("click", hideAddAction);

  root.querySelector("#add-action-dialog")?.addEventListener("click", (event) => {
    if (event.target.id === "add-action-dialog") {
      handlers.onHideAddAction();
    }
  });

  root.querySelector("#source-module")?.addEventListener("change", (event) => {
    handlers.onSourceModuleChange(Number(event.target.value), root);
  });

  root.querySelector("#confirm-add-action")?.addEventListener("click", () => {
    const sourceAddress = Number(root.querySelector("#source-module")?.value);
    const sourceChannel = Number(root.querySelector("#source-channel")?.value);
    const action = root.querySelector("#action-key")?.value;
    handlers.onProgramAction(sourceAddress, sourceChannel, action);
  });

  root.querySelectorAll("[data-clear-slot]").forEach((element) => {
    element.addEventListener("click", () => {
      handlers.onClearSlot(Number(element.dataset.clearSlot));
    });
  });

  root.querySelectorAll("[data-channel-name]").forEach((element) => {
    element.addEventListener("change", (event) => {
      handlers.onSaveChannelName(
        Number(event.target.dataset.channelName),
        event.target.value
      );
    });
  });

  root.querySelectorAll("[data-channel-enable]").forEach((element) => {
    element.addEventListener("change", (event) => {
      handlers.onSaveChannelEnabled(
        Number(event.target.dataset.channelEnable),
        event.target.checked
      );
    });
  });

  root.querySelectorAll("[data-channel-contact]").forEach((element) => {
    element.addEventListener("change", (event) => {
      handlers.onSaveChannelContact(
        Number(event.target.dataset.channelContact),
        event.target.value
      );
    });
  });
}
