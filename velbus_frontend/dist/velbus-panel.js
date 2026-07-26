class VelbusPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = undefined;
    this._configEntryId = undefined;
    this._memoryWriteMode = false;
    this._modules = [];
    this._selectedAddress = null;
    this._moduleData = null;
    this._actionChannel = 1;
    this._actionSlots = [];
    this._sourceModuleAddress = null;
    this._showAddActionDialog = false;
    this._loading = false;
    this._loadingActions = false;
    this._error = null;
  }

  set hass(hass) {
    const firstLoad = !this._hass && hass;
    const themeChanged =
      this._hass?.themes?.darkMode !== hass?.themes?.darkMode ||
      this._hass?.themes?.theme !== hass?.themes?.theme;
    this._hass = hass;
    this._syncTheme();
    if (firstLoad) {
      this._bootstrap();
    } else if (themeChanged) {
      this._render();
    }
  }

  set panel(panel) {
    this._panel = panel;
    this._configEntryId = this._resolveConfigEntryId(panel);
    this._bootstrap();
  }

  _syncTheme() {
    const root = document.documentElement;
    const dark = Boolean(this._hass?.themes?.darkMode);
    root.style.colorScheme = dark ? "dark" : "light";
    document.body.style.backgroundColor = "";
    document.body.style.color = "";

    const themeVars = [
      "--primary-background-color",
      "--card-background-color",
      "--secondary-background-color",
      "--primary-text-color",
      "--secondary-text-color",
      "--disabled-text-color",
      "--divider-color",
      "--primary-color",
      "--accent-color",
      "--warning-color",
      "--error-color",
      "--success-color",
      "--text-primary-color",
      "--ha-card-box-shadow",
      "--primary-font-family",
      "--input-fill-color",
      "--input-disabled-fill-color",
      "--input-ink-color",
      "--input-label-ink-color",
      "--input-disabled-ink-color",
      "--input-outlined-idle-border-color",
      "--input-outlined-hover-border-color",
      "--input-outlined-disabled-border-color",
    ];

    let parentStyles;
    try {
      parentStyles = window.parent?.getComputedStyle?.(
        window.parent.document.documentElement
      );
    } catch (_error) {
      parentStyles = undefined;
    }

    for (const name of themeVars) {
      const value = parentStyles?.getPropertyValue(name)?.trim();
      if (value) {
        root.style.setProperty(name, value);
      } else {
        root.style.removeProperty(name);
      }
    }

    if (!parentStyles) {
      const fallbacks = dark
        ? {
            "--primary-background-color": "#111111",
            "--card-background-color": "#1c1c1c",
            "--secondary-background-color": "#282828",
            "--primary-text-color": "#e1e1e1",
            "--secondary-text-color": "#9b9b9b",
            "--disabled-text-color": "#6f6f6f",
            "--divider-color": "rgba(225, 225, 225, 0.12)",
            "--primary-color": "#03a9f4",
            "--text-primary-color": "#ffffff",
            "--warning-color": "#f57c00",
            "--input-fill-color": "rgba(255, 255, 255, 0.05)",
            "--input-disabled-fill-color": "rgba(255, 255, 255, 0.02)",
            "--input-ink-color": "rgba(255, 255, 255, 0.87)",
            "--input-label-ink-color": "rgba(255, 255, 255, 0.6)",
            "--input-disabled-ink-color": "rgba(255, 255, 255, 0.37)",
            "--input-outlined-idle-border-color": "rgba(255, 255, 255, 0.38)",
            "--input-outlined-hover-border-color": "rgba(255, 255, 255, 0.87)",
            "--input-outlined-disabled-border-color": "rgba(255, 255, 255, 0.06)",
            "--ha-card-box-shadow": "none",
          }
        : {
            "--primary-background-color": "#fafafa",
            "--card-background-color": "#ffffff",
            "--secondary-background-color": "#e5e5e5",
            "--primary-text-color": "#212121",
            "--secondary-text-color": "#727272",
            "--disabled-text-color": "#bdbdbd",
            "--divider-color": "rgba(0, 0, 0, 0.12)",
            "--primary-color": "#03a9f4",
            "--text-primary-color": "#ffffff",
            "--warning-color": "#f57c00",
            "--input-fill-color": "rgb(245, 245, 245)",
            "--input-disabled-fill-color": "rgb(250, 250, 250)",
            "--input-ink-color": "rgba(0, 0, 0, 0.87)",
            "--input-label-ink-color": "rgba(0, 0, 0, 0.6)",
            "--input-disabled-ink-color": "rgba(0, 0, 0, 0.37)",
            "--input-outlined-idle-border-color": "rgba(0, 0, 0, 0.38)",
            "--input-outlined-hover-border-color": "rgba(0, 0, 0, 0.87)",
            "--input-outlined-disabled-border-color": "rgba(0, 0, 0, 0.06)",
          };
      for (const [name, value] of Object.entries(fallbacks)) {
        root.style.setProperty(name, value);
      }
    }

    document.body.style.backgroundColor = getComputedStyle(root)
      .getPropertyValue("--primary-background-color")
      .trim();
    document.body.style.color = getComputedStyle(root)
      .getPropertyValue("--primary-text-color")
      .trim();
  }

  _resolveConfigEntryId(panel) {
    if (panel?.config?.config_entry_id) {
      return panel.config.config_entry_id;
    }
    if (panel?.config?.config_entry) {
      return panel.config.config_entry;
    }
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("config_entry")) {
      return searchParams.get("config_entry");
    }
    return undefined;
  }

  _goBackToIntegration() {
    let path = "/config/integrations/integration/velbus";
    if (this._configEntryId) {
      path += `#config_entry=${this._configEntryId}`;
    }
    if (window.parent?.customPanel?.navigate) {
      window.parent.customPanel.navigate(path);
      return;
    }
    window.history.pushState(null, "", path);
    window.dispatchEvent(
      new CustomEvent("location-changed", {
        detail: {},
        bubbles: true,
        composed: true,
      })
    );
  }

  async _bootstrap() {
    if (!this._configEntryId) {
      this._configEntryId = this._resolveConfigEntryId(this._panel);
    }
    if (!this._hass || !this._configEntryId) {
      return;
    }
    try {
      const base = await this._callWs("velbus/config_panel/get_base_data", {});
      this._memoryWriteMode = base.memory_write_mode;
      await this._loadModules();
    } catch (error) {
      this._error = String(error);
      this._render();
    }
  }

  async _callWs(type, extra) {
    return this._hass.callWS({
      type,
      config_entry: this._configEntryId,
      ...extra,
    });
  }

  async _loadModules() {
    this._loading = true;
    this._render();
    const result = await this._callWs("velbus/config_panel/modules", {});
    this._modules = result.modules || [];
    this._loading = false;
    this._render();
  }

  async _loadModule(address) {
    this._selectedAddress = address;
    this._loading = true;
    this._error = null;
    this._actionSlots = [];
    this._showAddActionDialog = false;
    this._render();
    try {
      this._moduleData = await this._callWs("velbus/config_panel/module/get", {
        address,
      });
      const actionSection = (this._moduleData.schema?.sections || []).find(
        (section) => section.type === "action_table"
      );
      if (actionSection?.channels?.length) {
        this._actionChannel = actionSection.channels[0];
      }
    } catch (error) {
      this._error = String(error);
      this._moduleData = null;
    }
    this._loading = false;
    this._render();
    if (this._moduleData) {
      await this._loadActions();
    }
  }

  async _loadActions() {
    const actionSection = (this._moduleData?.schema?.sections || []).find(
      (section) => section.type === "action_table"
    );
    if (!this._selectedAddress || !actionSection) {
      return;
    }
    this._loadingActions = true;
    this._render();
    try {
      const result = await this._callWs(
        "velbus/config_panel/module/actions/get",
        {
          address: this._selectedAddress,
          channel: this._actionChannel,
          refresh: true,
        }
      );
      this._actionSlots = result.slots || [];
    } catch (error) {
      this._error = String(error);
      this._actionSlots = [];
    }
    this._loadingActions = false;
    this._render();
  }

  async _saveChannelName(channel, value) {
    await this._callWs("velbus/config_panel/module/config/set", {
      address: this._selectedAddress,
      channel,
      key: "name",
      value,
    });
    await this._loadModule(this._selectedAddress);
  }

  async _saveChannelEnabled(channel, enabled) {
    await this._callWs("velbus/config_panel/module/config/set", {
      address: this._selectedAddress,
      channel,
      key: "enabled",
      value: enabled,
    });
    await this._loadModule(this._selectedAddress);
    await this._loadActions();
  }

  async _programAction() {
    const sourceAddress = Number(
      this.shadowRoot.getElementById("source-module")?.value
    );
    const sourceChannel = Number(
      this.shadowRoot.getElementById("source-channel")?.value
    );
    const action = this.shadowRoot.getElementById("action-key")?.value;
    if (!sourceAddress || !sourceChannel || !action) {
      return;
    }
    await this._callWs("velbus/config_panel/module/actions/set", {
      address: this._selectedAddress,
      channel: this._actionChannel,
      source_address: sourceAddress,
      source_channel: sourceChannel,
      action,
    });
    this._showAddActionDialog = false;
    await this._loadActions();
  }

  _getModule(address) {
    return this._modules.find((module) => module.address === address);
  }

  _formatSource(slot) {
    if (slot.source_module_name) {
      const channelLabel =
        slot.source_channel_name ||
        (slot.source_channel != null ? `Channel ${slot.source_channel}` : "?");
      return `${slot.source_module_name} / ${channelLabel}`;
    }
    return `${slot.source_address}:${slot.source_channel ?? "?"}`;
  }

  _sourceChannelOptions(moduleAddress) {
    const module = this._getModule(moduleAddress);
    if (!module?.channels) {
      return "";
    }
    return Object.entries(module.channels)
      .sort(([left], [right]) => Number(left) - Number(right))
      .map(([channel, info]) => {
        const label = info.name || `Channel ${channel}`;
        return `<option value="${channel}">${label}</option>`;
      })
      .join("");
  }

  _channelLabel(channel, sections, liveChannels) {
    const channelMeta = (sections.find((section) => section.type === "channels")
      ?.channels || []).find((entry) => entry.channel === channel);
    const live = liveChannels[String(channel)] || {};
    return live.name || channelMeta?.name || `Channel ${channel}`;
  }

  async _clearSlot(slot) {
    await this._callWs("velbus/config_panel/module/actions/clear", {
      address: this._selectedAddress,
      channel: this._actionChannel,
      slot,
    });
    await this._loadActions();
  }

  _renderAddActionDialog(actionTable) {
    if (!this._showAddActionDialog || !actionTable) {
      return "";
    }
    if (!this._sourceModuleAddress && this._modules.length) {
      this._sourceModuleAddress = this._modules[0].address;
    }
    return `
      <div class="dialog-backdrop" id="add-action-dialog">
        <div class="dialog card">
          <h3>Add ${
            actionTable.kind === "input" ? "input action" : "action"
          }</h3>
          <p class="muted">Program a new action for the selected channel.</p>
          <label><span>Source module</span>
            <select id="source-module" ${this._memoryWriteMode ? "" : "disabled"}>
              ${this._modules
                .map(
                  (module) =>
                    `<option value="${module.address}" ${
                      module.address === this._sourceModuleAddress ? "selected" : ""
                    }>${module.name} (${module.address})</option>`
                )
                .join("")}
            </select>
          </label>
          <label><span>Source channel</span>
            <select id="source-channel" ${this._memoryWriteMode ? "" : "disabled"}>
              ${this._sourceChannelOptions(this._sourceModuleAddress)}
            </select>
          </label>
          <label><span>Action</span>
            <select id="action-key" ${this._memoryWriteMode ? "" : "disabled"}>
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
              this._memoryWriteMode ? "" : "disabled"
            }>Program action</button>
          </div>
        </div>
      </div>`;
  }

  _renderModuleList() {
    return `
      <section class="modules-section">
        <h2>Modules</h2>
        ${
          this._modules.length
            ? `<div class="module-grid">
                ${this._modules
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

  _renderModuleDetail() {
    if (!this._moduleData) {
      return "";
    }
    const schema = this._moduleData.schema || { sections: [] };
    const sections = schema.sections || [];
    const channelNames = sections.find((section) => section.type === "channel_names");
    const actionTable = sections.find((section) => section.type === "action_table");
    const channelEnable = sections.find((section) => section.type === "channel_enable");
    const channels = this._moduleData.channels || {};
    const actions = (this._actionSlots || []).filter((slot) => !slot.empty);
    const selectedChannelLabel = this._channelLabel(
      this._actionChannel,
      sections,
      channels
    );
    const selectedSupportsEnable =
      channelEnable?.channels?.includes(this._actionChannel) ||
      (sections.find((section) => section.type === "channels")?.channels || []).some(
        (entry) =>
          entry.channel === this._actionChannel && entry.supports_enable
      );
    const selectedEnabled = channels[String(this._actionChannel)]?.enabled !== false;
    const metaParts = [
      `Address ${this._moduleData.address}`,
      this._moduleData.type_name,
      this._moduleData.sw_version
        ? `Firmware ${this._moduleData.sw_version}`
        : null,
      this._moduleData.serial ? `Serial ${this._moduleData.serial}` : null,
    ].filter(Boolean);

    return `
      <section class="card header">
        <div class="header-row">
          <button class="link back" id="back-button">← Modules</button>
          ${
            actionTable
              ? `<button id="add-action" class="primary" ${
                  this._memoryWriteMode ? "" : "disabled"
                }>Add action</button>`
              : ""
          }
        </div>
        <h2>${this._moduleData.name}</h2>
        <p class="muted">${metaParts.join(" · ")}</p>
        ${
          !this._memoryWriteMode
            ? `<p class="warning">Memory write mode is disabled. Enable it in the Velbus integration configuration to program module memory.</p>`
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
                      const label = this._channelLabel(channel, sections, channels);
                      const isActive = channel === this._actionChannel;
                      const live = channels[String(channel)] || {};
                      const disabled = live.enabled === false;
                      return `<li>
                        <button
                          type="button"
                          class="channel-item${isActive ? " active" : ""}${
                            disabled ? " disabled-channel" : ""
                          }"
                          data-action-channel="${channel}"
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
                    actionTable.kind === "input"
                      ? "Input actions"
                      : "Actions"
                  } — ${selectedChannelLabel}</h3>
                  ${
                    channelNames?.channels?.some(
                      (entry) => entry.channel === this._actionChannel
                    )
                      ? `<label class="channel-rename">
                          <span>Channel name</span>
                          <input
                            type="text"
                            maxlength="16"
                            data-channel-name="${this._actionChannel}"
                            value="${
                              channels[String(this._actionChannel)]?.name || ""
                            }"
                            ${this._memoryWriteMode ? "" : "disabled"}
                          />
                        </label>`
                      : ""
                  }
                  ${
                    selectedSupportsEnable
                      ? `<label class="channel-enable">
                          <input
                            type="checkbox"
                            data-channel-enable="${this._actionChannel}"
                            ${selectedEnabled ? "checked" : ""}
                            ${this._memoryWriteMode ? "" : "disabled"}
                          />
                          <span>Channel enabled</span>
                        </label>`
                      : ""
                  }
                </div>
                ${this._loadingActions ? "<p>Loading actions…</p>" : ""}
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
                              }">${this._formatSource(slot)}</td>
                          <td>${slot.action_label || slot.action_key || ""}</td>
                          <td>${
                            this._memoryWriteMode
                              ? `<button class="link" data-clear-slot="${slot.slot}">Clear</button>`
                              : ""
                          }</td>
                        </tr>`
                            )
                            .join("")
                        : `<tr><td colspan="4">${
                            this._loadingActions
                              ? ""
                              : "No programmed actions for this channel."
                          }</td></tr>`
                    }
                  </tbody>
                </table>
              </section>
            </div>
            ${this._renderAddActionDialog(actionTable)}`
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
                        ${this._memoryWriteMode ? "" : "disabled"}
                      />
                    </label>`;
                  })
                  .join("")}
              </section>`
            : ""
      }`;
  }

  _render() {
    this._syncTheme();
    const styles = `
      :host {
        display: block;
        width: 100%;
        min-width: 0;
        padding: 16px;
        font-family: var(--primary-font-family, Roboto, Noto, sans-serif);
        color: var(--primary-text-color, #212121);
        background: transparent;
        box-sizing: border-box;
        color-scheme: inherit;
      }
      .card {
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color, #212121);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,.12));
        box-sizing: border-box;
      }
      h1, h2, h3 { margin: 0 0 12px; color: var(--primary-text-color, #212121); }
      .page-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .page-header h1 { margin: 0; flex: 1 1 auto; }
      .page-header .page-back {
        flex: 0 0 auto;
        padding: 4px 0;
        font-size: 1rem;
        line-height: 1.2;
      }
      .muted { color: var(--secondary-text-color, #727272); }
      .warning { color: var(--warning-color, #f57c00); }
      .modules-section { margin-bottom: 16px; }
      .modules-section h2 { margin-bottom: 16px; }
      .module-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px;
      }
      .module-tile {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        min-height: 108px;
        padding: 16px;
        text-align: left;
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color, #212121);
        border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
        border-radius: 12px;
        box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,.12));
        cursor: pointer;
      }
      button.module-tile {
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color, #212121);
        border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      }
      .module-tile:hover,
      .module-tile:focus-visible {
        border-color: var(--primary-color, #03a9f4);
        outline: none;
      }
      .module-address {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--primary-color, #03a9f4);
      }
      .module-name {
        font-size: 1.05rem;
        font-weight: 600;
        line-height: 1.3;
        word-break: break-word;
      }
      .module-type { font-size: 0.85rem; }
      button.link, .link {
        background: none;
        border: none;
        color: var(--primary-color, #03a9f4);
        cursor: pointer;
        text-align: left;
        padding: 8px 0;
      }
      .header-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; }
      .header-row .back { width: auto; }
      .module-layout { display: flex; flex-direction: row; align-items: flex-start; gap: 16px; margin-bottom: 16px; width: 100%; }
      .channel-panel { flex: 0 0 240px; width: 240px; margin-bottom: 0; }
      .actions-panel { flex: 1 1 0; min-width: 0; margin-bottom: 0; }
      .channel-list { list-style: none; padding: 0; margin: 0; }
      .channel-list li { margin: 0 0 4px; }
      .channel-item {
        width: 100%;
        text-align: left;
        padding: 10px 12px;
        border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
        border-radius: 8px;
        background: transparent;
        color: var(--primary-text-color, #212121);
        cursor: pointer;
      }
      .channel-item.active {
        background: var(--primary-color, #03a9f4);
        border-color: var(--primary-color, #03a9f4);
        color: var(--text-primary-color, #fff);
      }
      .channel-item.active .channel-badge {
        color: var(--text-primary-color, #fff);
        opacity: 0.85;
      }
      .channel-name { display: block; font-weight: 500; }
      .channel-badge {
        display: inline-block;
        margin-top: 4px;
        font-size: 12px;
        color: var(--secondary-text-color, #727272);
      }
      .channel-item.disabled-channel .channel-name { opacity: 0.65; }
      .channel-enable { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--primary-text-color, #212121); }
      .actions-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 12px; flex-wrap: wrap; }
      .actions-header h3 { margin: 0; flex: 1 1 auto; }
      .channel-rename { flex: 1; min-width: 180px; max-width: 280px; margin: 0; }
      label { display: block; margin-bottom: 12px; color: var(--primary-text-color, #212121); }
      label span {
        display: block;
        margin-bottom: 4px;
        font-size: 0.85rem;
        color: var(--secondary-text-color, #727272);
      }
      input, select {
        width: 100%;
        box-sizing: border-box;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid var(--input-outlined-idle-border-color, var(--divider-color, rgba(0, 0, 0, 0.12)));
        background: var(--input-fill-color, var(--secondary-background-color, #f5f5f5));
        color: var(--input-ink-color, var(--primary-text-color, #212121));
        color-scheme: inherit;
      }
      input:hover, select:hover {
        border-color: var(--input-outlined-hover-border-color, var(--primary-text-color, #212121));
      }
      input:disabled, select:disabled {
        background: var(--input-disabled-fill-color, var(--input-fill-color, #fafafa));
        color: var(--input-disabled-ink-color, var(--disabled-text-color, #bdbdbd));
        border-color: var(--input-outlined-disabled-border-color, var(--divider-color, rgba(0, 0, 0, 0.06)));
      }
      input:focus-visible, select:focus-visible {
        outline: 2px solid var(--primary-color, #03a9f4);
        outline-offset: 1px;
      }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; color: var(--primary-text-color, #212121); }
      th, td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      }
      th { color: var(--secondary-text-color, #727272); font-weight: 600; }
      button {
        padding: 8px 12px;
        border-radius: 8px;
        border: none;
        background: var(--primary-color, #03a9f4);
        color: var(--text-primary-color, #fff);
        cursor: pointer;
      }
      button.primary { margin-top: 0; }
      button.secondary {
        background: transparent;
        color: var(--primary-text-color, #212121);
        border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
      .dialog-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 10;
      }
      .dialog { width: min(480px, 100%); margin: 0; }
      .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
      @media (max-width: 560px) {
        .module-layout { flex-direction: column; }
        .channel-panel { width: 100%; flex-basis: auto; }
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="page-header">
        <button type="button" class="link page-back" id="back-to-integration">← Back</button>
        <h1>Velbus configuration</h1>
      </div>
      ${this._loading ? "<p>Loading…</p>" : ""}
      ${this._error ? `<p class="warning">${this._error}</p>` : ""}
      ${
        this._selectedAddress === null
          ? this._renderModuleList()
          : this._renderModuleDetail()
      }
    `;

    this.shadowRoot
      .getElementById("back-to-integration")
      ?.addEventListener("click", () => {
        this._goBackToIntegration();
      });

    this.shadowRoot.getElementById("back-button")?.addEventListener("click", () => {
      this._selectedAddress = null;
      this._moduleData = null;
      this._showAddActionDialog = false;
      this._render();
    });

    this.shadowRoot.querySelectorAll("[data-address]").forEach((element) => {
      element.addEventListener("click", () => {
        this._loadModule(Number(element.dataset.address));
      });
    });

    this.shadowRoot.querySelectorAll("[data-action-channel]").forEach((element) => {
      element.addEventListener("click", () => {
        this._actionChannel = Number(element.dataset.actionChannel);
        this._loadActions();
      });
    });

    this.shadowRoot.getElementById("add-action")?.addEventListener("click", () => {
      this._showAddActionDialog = true;
      this._render();
    });

    this.shadowRoot
      .getElementById("cancel-add-action")
      ?.addEventListener("click", () => {
        this._showAddActionDialog = false;
        this._render();
      });

    this.shadowRoot.getElementById("add-action-dialog")?.addEventListener("click", (event) => {
      if (event.target.id === "add-action-dialog") {
        this._showAddActionDialog = false;
        this._render();
      }
    });

    this.shadowRoot.getElementById("source-module")?.addEventListener("change", (event) => {
      this._sourceModuleAddress = Number(event.target.value);
      const channelSelect = this.shadowRoot.getElementById("source-channel");
      if (channelSelect) {
        channelSelect.innerHTML = this._sourceChannelOptions(
          this._sourceModuleAddress
        );
      }
    });

    this.shadowRoot.getElementById("confirm-add-action")?.addEventListener("click", () => {
      this._programAction();
    });

    this.shadowRoot.querySelectorAll("[data-clear-slot]").forEach((element) => {
      element.addEventListener("click", () => {
        this._clearSlot(Number(element.dataset.clearSlot));
      });
    });

    this.shadowRoot.querySelectorAll("[data-channel-name]").forEach((element) => {
      element.addEventListener("change", (event) => {
        this._saveChannelName(
          Number(event.target.dataset.channelName),
          event.target.value
        );
      });
    });

    this.shadowRoot.querySelectorAll("[data-channel-enable]").forEach((element) => {
      element.addEventListener("change", (event) => {
        this._saveChannelEnabled(
          Number(event.target.dataset.channelEnable),
          event.target.checked
        );
      });
    });
  }
}

customElements.define("velbus-panel", VelbusPanel);
