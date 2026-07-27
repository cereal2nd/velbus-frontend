import {
  channelLabel,
  findActionTable,
  findChannelEnable,
  findChannelNames,
  formatSource,
  isProgrammedSlot,
  sourceChannelOptions,
} from "./base.js";

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
  return `
    <div class="dialog-backdrop" id="add-action-dialog">
      <div class="dialog card">
        <h3>Add ${
          actionTable.kind === "input" ? "input action" : "action"
        }</h3>
        <p class="muted">Program a new action for the selected channel.</p>
        <label><span>Source module</span>
          <select id="source-module" ${editable ? "" : "disabled"}>
            ${modules
              .map(
                (module) =>
                  `<option value="${module.address}" ${
                    module.address === sourceAddress ? "selected" : ""
                  }>${module.name} (${module.address})</option>`
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
                  `<option value="${action.key}">${action.label}</option>`
              )
              .join("")}
          </select>
        </label>
        <div class="dialog-actions">
          <button class="secondary" id="cancel-add-action">Cancel</button>
          <button id="confirm-add-action" ${
            editable ? "" : "disabled"
          }>Program action</button>
        </div>
      </div>
    </div>`;
}

export function render(ctx) {
  const {
    moduleData,
    modules,
    actionChannel,
    actionSlots,
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
  const channels = moduleData.channels || {};
  const actions = (actionSlots || []).filter(isProgrammedSlot);
  const selectedChannelLabel = channelLabel(actionChannel, sections, channels);
  const selectedSupportsEnable =
    channelEnable?.channels?.includes(actionChannel) ||
    (sections.find((section) => section.type === "channels")?.channels || []).some(
      (entry) => entry.channel === actionChannel && entry.supports_enable
    );
  const selectedEnabled = channels[String(actionChannel)]?.enabled !== false;
  const metaParts = [
    `Address ${moduleData.address}`,
    moduleData.type_name,
    moduleData.sw_version ? `Firmware ${moduleData.sw_version}` : null,
    moduleData.serial ? `Serial ${moduleData.serial}` : null,
  ].filter(Boolean);

  const dialogCtx = {
    showAddActionDialog,
    actionTable,
    modules,
    advancedMode,
    interactionsDisabled,
    sourceModuleAddress,
  };

  return `
    <section class="card header">
      <div class="header-row">
        <button class="link back" id="back-button">← Modules</button>
        ${
          actionTable
            ? `<button id="add-action" class="primary" ${
                editable ? "" : "disabled"
              }>Add action</button>`
            : ""
        }
      </div>
      <h2>${moduleData.name}</h2>
      <p class="muted">${metaParts.join(" · ")}</p>
      ${
        !advancedMode
          ? `<p class="warning">Advanced mode is disabled. Enable it in the Velbus integration configuration to program module memory.</p>`
          : ""
      }
    </section>
    ${
      actionTable
        ? `<div class="module-layout">
            <section class="card channel-panel">
              <h3>Channels</h3>
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
                        <span class="channel-name">${label}</span>
                        ${
                          disabled
                            ? `<span class="channel-badge">Disabled</span>`
                            : ""
                        }
                      </button>
                    </li>`;
                  })
                  .join("")}
              </ul>
            </section>
            <section class="card actions-panel">
              <div class="actions-header">
                <h3>${
                  actionTable.kind === "input" ? "Input actions" : "Actions"
                } — ${selectedChannelLabel}</h3>
                ${
                  channelNames?.channels?.some(
                    (entry) => entry.channel === actionChannel
                  )
                    ? `<label class="channel-rename">
                        <span>Channel name</span>
                        <input
                          type="text"
                          maxlength="16"
                          data-channel-name="${actionChannel}"
                          value="${channels[String(actionChannel)]?.name || ""}"
                          ${editable ? "" : "disabled"}
                        />
                      </label>`
                    : ""
                }
                ${
                  selectedSupportsEnable
                    ? `<label class="channel-enable">
                        <input
                          type="checkbox"
                          data-channel-enable="${actionChannel}"
                          ${selectedEnabled ? "checked" : ""}
                          ${editable ? "" : "disabled"}
                        />
                        <span>Channel enabled</span>
                      </label>`
                    : ""
                }
              </div>
              ${loadingActions ? "<p>Loading actions…</p>" : ""}
              <table>
                <thead>
                  <tr><th>Slot</th><th>Source</th><th>Action</th><th></th></tr>
                </thead>
                <tbody>
                  ${
                    actions.length
                      ? actions
                          .map(
                            (slot) => `<tr>
                        <td>${slot.slot}</td>
                        <td title="${slot.source_address}:${
                              slot.source_channel ?? "?"
                            }">${formatSource(slot)}</td>
                        <td>${slot.action_label || slot.action_key || ""}</td>
                        <td>${
                          editable
                            ? `<button class="link" data-clear-slot="${slot.slot}" ${
                                interactionsDisabled ? "disabled" : ""
                              }>Clear</button>`
                            : ""
                        }</td>
                      </tr>`
                          )
                          .join("")
                      : `<tr><td colspan="4">${
                          loadingActions
                            ? ""
                            : "No programmed actions for this channel."
                        }</td></tr>`
                  }
                </tbody>
              </table>
            </section>
          </div>
          ${renderAddActionDialog(dialogCtx)}`
        : channelNames
          ? `<section class="card">
              <h3>Channel names</h3>
              ${channelNames.channels
                .map((channel) => {
                  const live = channels[String(channel.channel)] || {};
                  const value = live.name || "";
                  return `<label>
                    <span>${channel.name}</span>
                    <input
                      type="text"
                      maxlength="16"
                      data-channel-name="${channel.channel}"
                      value="${value}"
                      ${editable ? "" : "disabled"}
                    />
                  </label>`;
                })
                .join("")}
            </section>`
          : ""
    }`;
}

export function bind(root, handlers) {
  root.querySelector("#back-button")?.addEventListener("click", () => {
    handlers.onBack();
  });

  root.querySelectorAll("[data-action-channel]").forEach((element) => {
    element.addEventListener("click", () => {
      handlers.onSelectChannel(Number(element.dataset.actionChannel));
    });
  });

  root.querySelector("#add-action")?.addEventListener("click", () => {
    handlers.onShowAddAction();
  });

  root.querySelector("#cancel-add-action")?.addEventListener("click", () => {
    handlers.onHideAddAction();
  });

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
}
