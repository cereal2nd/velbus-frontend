import { PANEL_STYLES } from "./styles.js";
import {
  clearActionSlot,
  createApi,
  loadActions,
  loadBaseData,
  loadModule,
  loadModules,
  programAction,
  saveChannelContact,
  saveChannelEnabled,
  saveChannelName,
} from "./api.js";
import { sourceChannelOptions } from "./module-pages/base.js";
import {
  loadModulePage,
  resolveModulePageType,
} from "./module-pages/registry.js";
import { bindModulesList, renderModulesList } from "./pages/modules-list.js";
import { escapeHtml, ICONS, svgIcon } from "./ui.js";

class VelbusPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = undefined;
    this._panel = undefined;
    this._route = undefined;
    this._configEntryId = undefined;
    this._callWs = undefined;
    this._advancedMode = false;
    this._modules = [];
    this._moduleAddress = null;
    this._moduleData = null;
    this._modulePage = null;
    this._actionChannel = 1;
    this._actionSlots = [];
    this._actionsLoadedChannel = null;
    this._sourceModuleAddress = null;
    this._showAddActionDialog = false;
    this._loading = false;
    this._loadingActions = false;
    this._moduleBusy = false;
    this._error = null;
  }

  connectedCallback() {
    if (document.getElementById("velbus-panel-root-style")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "velbus-panel-root-style";
    style.textContent = "html, body { height: 100%; margin: 0; overflow: hidden; }";
    document.head.appendChild(style);
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

  set route(route) {
    const pathChanged = this._route?.path !== route?.path;
    this._route = route;
    if (pathChanged && this._hass && this._configEntryId) {
      this._onRouteChange();
    }
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

  _modulePageBusy() {
    return this._loading || this._loadingActions || this._moduleBusy;
  }

  async _withModuleBusy(fn) {
    if (this._moduleBusy) {
      return;
    }
    this._moduleBusy = true;
    this._render();
    try {
      await fn();
    } finally {
      this._moduleBusy = false;
      this._render();
    }
  }

  _parseRoute() {
    const rawPath =
      this._route?.path ??
      window.location.pathname.replace(/^\/velbus\/?/, "");
    const path = rawPath.replace(/^\//, "");
    if (!path) {
      return { page: "list" };
    }
    const match = path.match(/^module\/(\d+)/);
    if (match) {
      return { page: "module", address: Number(match[1]) };
    }
    return { page: "list" };
  }

  _navigate(path) {
    const search = this._configEntryId
      ? `?config_entry=${this._configEntryId}`
      : "";
    const fullPath = `/velbus${path}${search}`;
    if (window.parent?.customPanel?.navigate) {
      window.parent.customPanel.navigate(fullPath);
      return;
    }
    window.history.pushState(null, "", fullPath);
    window.dispatchEvent(
      new CustomEvent("location-changed", {
        detail: {},
        bubbles: true,
        composed: true,
      })
    );
    this._onRouteChange();
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
    this._callWs = createApi(this._hass, this._configEntryId);
    try {
      const base = await loadBaseData(this._callWs);
      this._advancedMode = base.advanced_mode;
      await this._refreshModules();
      await this._onRouteChange();
    } catch (error) {
      this._error = String(error);
      this._render();
    }
  }

  async _refreshModules() {
    this._loading = true;
    this._render();
    this._modules = await loadModules(this._callWs);
    this._loading = false;
    this._render();
  }

  async _onRouteChange() {
    const route = this._parseRoute();
    if (route.page === "list") {
      this._moduleAddress = null;
      this._moduleData = null;
      this._modulePage = null;
      this._showAddActionDialog = false;
      this._render();
      return;
    }

    if (route.address !== this._moduleAddress || !this._moduleData) {
      await this._loadModulePage(route.address);
    } else {
      this._render();
    }
  }

  async _loadModulePage(address) {
    this._moduleAddress = address;
    this._loading = true;
    this._error = null;
    this._actionSlots = [];
    this._actionsLoadedChannel = null;
    this._showAddActionDialog = false;
    this._render();
    try {
      this._moduleData = await loadModule(this._callWs, address);
      const pageType = resolveModulePageType(this._moduleData);
      this._modulePage = await loadModulePage(pageType);
      const actionSection = (
        this._moduleData.schema?.sections || []
      ).find((section) => section.type === "action_table");
      if (actionSection?.channels?.length) {
        this._actionChannel = actionSection.channels[0];
      }
    } catch (error) {
      this._error = String(error);
      this._moduleData = null;
      this._modulePage = null;
    }
    this._loading = false;
    this._render();
  }

  async _reloadModuleMetadata() {
    if (!this._moduleAddress) {
      return;
    }
    this._moduleData = await loadModule(this._callWs, this._moduleAddress);
    this._render();
  }

  async _refreshActions() {
    const actionSection = (this._moduleData?.schema?.sections || []).find(
      (section) => section.type === "action_table"
    );
    if (!this._moduleAddress || !actionSection) {
      return;
    }
    this._loadingActions = true;
    this._render();
    try {
      this._actionSlots = await loadActions(
        this._callWs,
        this._moduleAddress,
        this._actionChannel
      );
      this._actionsLoadedChannel = this._actionChannel;
    } catch (error) {
      this._error = String(error);
      this._actionSlots = [];
    }
    this._loadingActions = false;
    this._render();
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
      "--info-color",
      "--text-primary-color",
      "--app-header-background-color",
      "--app-header-text-color",
      "--app-header-border-bottom",
      "--header-height",
      "--ha-card-background",
      "--ha-card-border-radius",
      "--ha-card-border-width",
      "--ha-card-border-color",
      "--ha-card-box-shadow",
      "--ha-card-header-color",
      "--ha-card-header-font-size",
      "--primary-font-family",
      "--ha-font-family-body",
      "--input-fill-color",
      "--input-disabled-fill-color",
      "--input-ink-color",
      "--input-label-ink-color",
      "--input-disabled-ink-color",
      "--input-outlined-idle-border-color",
      "--input-outlined-hover-border-color",
      "--input-outlined-disabled-border-color",
      "--mdc-text-field-fill-color",
      "--switch-checked-button-color",
      "--switch-checked-track-color",
      "--switch-unchecked-button-color",
      "--switch-unchecked-track-color",
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
            "--error-color": "#db4437",
            "--info-color": "#039be5",
            "--app-header-background-color": "#111111",
            "--app-header-text-color": "#e1e1e1",
            "--input-fill-color": "rgba(255, 255, 255, 0.05)",
            "--input-disabled-fill-color": "rgba(255, 255, 255, 0.02)",
            "--input-ink-color": "rgba(255, 255, 255, 0.87)",
            "--input-label-ink-color": "rgba(255, 255, 255, 0.6)",
            "--input-disabled-ink-color": "rgba(255, 255, 255, 0.37)",
            "--input-outlined-idle-border-color": "rgba(255, 255, 255, 0.38)",
            "--input-outlined-hover-border-color": "rgba(255, 255, 255, 0.87)",
            "--input-outlined-disabled-border-color": "rgba(255, 255, 255, 0.06)",
            "--ha-card-box-shadow": "none",
            "--ha-card-border-radius": "12px",
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
            "--error-color": "#db4437",
            "--info-color": "#039be5",
            "--app-header-background-color": "#fafafa",
            "--app-header-text-color": "#212121",
            "--input-fill-color": "rgb(245, 245, 245)",
            "--input-disabled-fill-color": "rgb(250, 250, 250)",
            "--input-ink-color": "rgba(0, 0, 0, 0.87)",
            "--input-label-ink-color": "rgba(0, 0, 0, 0.6)",
            "--input-disabled-ink-color": "rgba(0, 0, 0, 0.37)",
            "--input-outlined-idle-border-color": "rgba(0, 0, 0, 0.38)",
            "--input-outlined-hover-border-color": "rgba(0, 0, 0, 0.87)",
            "--input-outlined-disabled-border-color": "rgba(0, 0, 0, 0.06)",
            "--ha-card-box-shadow": "none",
            "--ha-card-border-radius": "12px",
          };
      for (const [name, value] of Object.entries(fallbacks)) {
        root.style.setProperty(name, value);
      }
    }

    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
    document.body.style.margin = "0";
    document.body.style.backgroundColor = getComputedStyle(root)
      .getPropertyValue("--primary-background-color")
      .trim();
    document.body.style.color = getComputedStyle(root)
      .getPropertyValue("--primary-text-color")
      .trim();
  }

  _toolbarTitle() {
    const route = this._parseRoute();
    if (route.page === "module") {
      return this._moduleData?.name || "Module";
    }
    return "Velbus";
  }

  _onToolbarBack() {
    const route = this._parseRoute();
    if (route.page === "module") {
      this._navigate("");
      return;
    }
    this._goBackToIntegration();
  }

  _isInitialLoad() {
    const route = this._parseRoute();
    if (route.page === "list") {
      return this._loading && !this._modules.length;
    }
    return this._loading && !this._moduleData;
  }

  _renderPageContent() {
    const route = this._parseRoute();
    if (route.page === "list") {
      return renderModulesList({ modules: this._modules });
    }
    if (!this._modulePage) {
      return "";
    }
    return this._modulePage.render({
      moduleData: this._moduleData,
      modules: this._modules,
      actionChannel: this._actionChannel,
      actionSlots: this._actionSlots,
      actionsLoaded: this._actionsLoadedChannel === this._actionChannel,
      loadingActions: this._loadingActions,
      interactionsDisabled: this._modulePageBusy(),
      advancedMode: this._advancedMode,
      showAddActionDialog: this._showAddActionDialog,
      sourceModuleAddress: this._sourceModuleAddress,
    });
  }

  _bindPageContent(contentRoot) {
    const route = this._parseRoute();
    if (route.page === "list") {
      bindModulesList(contentRoot, {
        onSelect: (address) => {
          this._navigate(`/module/${address}`);
        },
      });
      return;
    }
    if (!this._modulePage) {
      return;
    }
    this._modulePage.bind(contentRoot, {
      onSelectChannel: async (channel) => {
        if (this._modulePageBusy()) {
          return;
        }
        this._actionChannel = channel;
        await this._refreshActions();
      },
      onShowAddAction: () => {
        if (this._modulePageBusy()) {
          return;
        }
        this._showAddActionDialog = true;
        this._render();
      },
      onHideAddAction: () => {
        this._showAddActionDialog = false;
        this._render();
      },
      onSourceModuleChange: (address, root) => {
        this._sourceModuleAddress = address;
        const channelSelect = root.querySelector("#source-channel");
        if (channelSelect) {
          channelSelect.innerHTML = sourceChannelOptions(
            this._modules,
            address
          );
        }
      },
      onProgramAction: async (sourceAddress, sourceChannel, action) => {
        if (!sourceAddress || !sourceChannel || !action || this._modulePageBusy()) {
          return;
        }
        await this._withModuleBusy(async () => {
          await programAction(
            this._callWs,
            this._moduleAddress,
            this._actionChannel,
            sourceAddress,
            sourceChannel,
            action
          );
          this._showAddActionDialog = false;
          await this._refreshActions();
        });
      },
      onClearSlot: async (slot) => {
        if (this._modulePageBusy()) {
          return;
        }
        await this._withModuleBusy(async () => {
          await clearActionSlot(
            this._callWs,
            this._moduleAddress,
            this._actionChannel,
            slot
          );
          await this._refreshActions();
        });
      },
      onSaveChannelName: async (channel, value) => {
        if (this._modulePageBusy()) {
          return;
        }
        await this._withModuleBusy(async () => {
          await saveChannelName(
            this._callWs,
            this._moduleAddress,
            channel,
            value
          );
          await this._reloadModuleMetadata();
        });
      },
      onSaveChannelEnabled: async (channel, enabled) => {
        if (this._modulePageBusy()) {
          return;
        }
        await this._withModuleBusy(async () => {
          await saveChannelEnabled(
            this._callWs,
            this._moduleAddress,
            channel,
            enabled
          );
          await this._reloadModuleMetadata();
          if (this._actionsLoadedChannel === channel) {
            await this._refreshActions();
          }
        });
      },
      onSaveChannelContact: async (channel, value) => {
        if (this._modulePageBusy()) {
          return;
        }
        await this._withModuleBusy(async () => {
          await saveChannelContact(
            this._callWs,
            this._moduleAddress,
            channel,
            value
          );
          await this._reloadModuleMetadata();
        });
      },
    });
  }

  _render() {
    this._syncTheme();
    const initialLoad = this._isInitialLoad();
    this.shadowRoot.innerHTML = `
      <style>${PANEL_STYLES}</style>
      <div class="subpage">
        <div class="toolbar">
          <div class="toolbar-content">
            <button type="button" class="icon-button" id="toolbar-back" aria-label="Back">
              ${svgIcon(ICONS.arrowLeft)}
            </button>
          </div>
        </div>
        <div class="content">
          ${
            this._error
              ? `<div class="ha-alert error">${svgIcon(ICONS.alertOutline)}<div>${escapeHtml(
                  this._error
                )}</div></div>`
              : ""
          }
          ${
            initialLoad
              ? `<div class="loading-state"><div class="spinner"></div><p>Loading…</p></div>`
              : `<div id="page-content">${this._renderPageContent()}</div>`
          }
        </div>
      </div>
    `;

    this.shadowRoot.getElementById("toolbar-back")?.addEventListener("click", () => {
      this._onToolbarBack();
    });

    const contentRoot = this.shadowRoot.getElementById("page-content");
    if (contentRoot) {
      this._bindPageContent(contentRoot);
    }
  }
}

customElements.define("velbus-panel", VelbusPanel);
