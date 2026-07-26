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
    this._loading = false;
    this._loadingActions = false;
    this._error = null;
  }

  set hass(hass) {
    const firstLoad = !this._hass && hass;
    this._hass = hass;
    if (firstLoad) {
      this._bootstrap();
    }
  }

  set panel(panel) {
    this._panel = panel;
    this._configEntryId = this._resolveConfigEntryId(panel);
    this._bootstrap();
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

  async _saveContact(channel, value) {
    await this._callWs("velbus/config_panel/module/config/set", {
      address: this._selectedAddress,
      channel,
      key: "contact",
      value,
    });
    await this._loadModule(this._selectedAddress);
  }

  async _programAction() {
    const sourceAddress = Number(
      this.shadowRoot.getElementById("source-address")?.value
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
    await this._loadActions();
  }

  async _clearSlot(slot) {
    await this._callWs("velbus/config_panel/module/actions/clear", {
      address: this._selectedAddress,
      channel: this._actionChannel,
      slot,
    });
    await this._loadActions();
  }

  _renderModuleList() {
  return `
    <section class="card">
      <h2>Modules</h2>
      ${
        this._modules.length
          ? `<ul class="module-list">
              ${this._modules
                .map(
                  (module) => `
                <li>
                  <button class="link" data-address="${module.address}">
                    <strong>${module.address}</strong> — ${module.name}
                    <span class="muted">${module.type_name}</span>
                  </button>
                </li>`
                )
                .join("")}
            </ul>`
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
    const channels = this._moduleData.channels || {};
    const actions = this._actionSlots || [];

    return `
      <section class="card">
        <button class="link back" id="back-button">← Modules</button>
        <h2>${this._moduleData.name}</h2>
        <p class="muted">
          Address ${this._moduleData.address} · ${this._moduleData.type_name}
          ${this._moduleData.serial ? `· ${this._moduleData.serial}` : ""}
        </p>
        ${
          !this._memoryWriteMode
            ? `<p class="warning">Memory write mode is disabled. Enable it in the Velbus integration configuration to program module memory.</p>`
            : ""
        }
      </section>
      ${
        channelNames
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
      }
      ${
        actionTable
          ? `<section class="card">
              <h3>Relay actions</h3>
              <label>
                <span>Channel</span>
                <select id="action-channel">
                  ${actionTable.channels
                    .map(
                      (channel) =>
                        `<option value="${channel}" ${
                          channel === this._actionChannel ? "selected" : ""
                        }>Relay ${channel}</option>`
                    )
                    .join("")}
                </select>
              </label>
              <div class="grid">
                <label><span>Source address</span><input id="source-address" type="number" min="1" max="254" ${this._memoryWriteMode ? "" : "disabled"} /></label>
                <label><span>Source channel</span><input id="source-channel" type="number" min="1" max="8" value="1" ${this._memoryWriteMode ? "" : "disabled"} /></label>
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
              </div>
              <button id="program-action" ${this._memoryWriteMode ? "" : "disabled"}>Program action</button>
              ${this._loadingActions ? "<p>Loading actions…</p>" : ""}
              <table>
                <thead>
                  <tr><th>Slot</th><th>Source</th><th>Action</th><th></th></tr>
                </thead>
                <tbody>
                  ${actions
                    .filter((slot) => !slot.empty)
                    .map(
                      (slot) => `<tr>
                        <td>${slot.slot}</td>
                        <td>${slot.source_address}:${slot.source_channel ?? "?"}</td>
                        <td>${slot.action_label || slot.action_key || ""}</td>
                        <td>${
                          this._memoryWriteMode
                            ? `<button class="link" data-clear-slot="${slot.slot}">Clear</button>`
                            : ""
                        }</td>
                      </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </section>`
          : ""
      }`;
  }

  _render() {
    const styles = `
      :host { display: block; padding: 16px; font-family: var(--primary-font-family, sans-serif); color: var(--primary-text-color, #212121); }
      .card { background: var(--card-background-color, #fff); border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,.12)); }
      h2, h3 { margin: 0 0 12px; }
      .muted { color: var(--secondary-text-color, #666); }
      .warning { color: var(--warning-color, #f57c00); }
      .module-list { list-style: none; padding: 0; margin: 0; }
      .module-list li { margin: 0; }
      button.link, .link { background: none; border: none; color: var(--primary-color, #03a9f4); cursor: pointer; text-align: left; padding: 8px 0; width: 100%; }
      label { display: block; margin-bottom: 12px; }
      label span { display: block; margin-bottom: 4px; font-size: 0.85rem; color: var(--secondary-text-color, #666); }
      input, select { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 8px; border: 1px solid var(--divider-color, #ddd); }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { text-align: left; padding: 8px; border-bottom: 1px solid var(--divider-color, #eee); }
      button { margin-top: 8px; padding: 8px 12px; border-radius: 8px; border: none; background: var(--primary-color, #03a9f4); color: #fff; cursor: pointer; }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <h1>Velbus configuration</h1>
      ${this._loading ? "<p>Loading…</p>" : ""}
      ${this._error ? `<p class="warning">${this._error}</p>` : ""}
      ${
        this._selectedAddress === null
          ? this._renderModuleList()
          : this._renderModuleDetail()
      }
    `;

    this.shadowRoot.getElementById("back-button")?.addEventListener("click", () => {
      this._selectedAddress = null;
      this._moduleData = null;
      this._render();
    });

    this.shadowRoot.querySelectorAll("[data-address]").forEach((element) => {
      element.addEventListener("click", () => {
        this._loadModule(Number(element.dataset.address));
      });
    });

    this.shadowRoot.getElementById("action-channel")?.addEventListener("change", (event) => {
      this._actionChannel = Number(event.target.value);
      this._loadActions();
    });

    this.shadowRoot.getElementById("program-action")?.addEventListener("click", () => {
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

    this.shadowRoot.querySelectorAll("[data-channel-contact]").forEach((element) => {
      element.addEventListener("change", (event) => {
        this._saveContact(
          Number(event.target.dataset.channelContact),
          event.target.value
        );
      });
    });
  }
}

customElements.define("velbus-panel", VelbusPanel);
