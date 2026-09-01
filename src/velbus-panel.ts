import type { PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import { applyThemesOnElement } from "@ha/common/dom/apply_themes_on_element";
import { listenMediaQuery } from "@ha/common/dom/media_query";
import { makeDialogManager } from "@ha/dialogs/make-dialog-manager";
import { ProvideHassLitMixin } from "@ha/mixins/provide-hass-lit-mixin";
import "@ha/components/ha-alert";
import "@ha/components/ha-spinner";
import "@ha/layouts/hass-subpage";
import type { HomeAssistant, Route } from "@ha/types";
import { fetchAndScheduleBrandsAccessToken } from "@ha/util/brands-url";

import {
  createVelbusWsClient,
  fetchBaseData,
  fetchModule,
  fetchModules,
} from "./data/websocket";
import type {
  VelbusBaseData,
  VelbusCallWs,
  VelbusModuleData,
  VelbusModuleSummary,
  VelbusPanelConfig,
} from "./types";
import { velbusPageStyles } from "./styles";
import "./views/velbus-config-dashboard";
import "./views/velbus-module-page";

interface ParsedRoute {
  page: "list" | "module";
  address?: number;
}

@customElement("velbus-panel")
export class VelbusPanel extends ProvideHassLitMixin(LitElement) {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public panel?: { config?: VelbusPanelConfig };

  @property({ attribute: false }) public route?: Route;

  @property({ type: Boolean }) public narrow = false;

  @state() private _configEntryId?: string;

  @state() private _callWs?: VelbusCallWs;

  @state() private _baseData?: VelbusBaseData;

  @state() private _advancedMode = false;

  @state() private _modules: VelbusModuleSummary[] = [];

  @state() private _moduleAddress?: number;

  @state() private _moduleData?: VelbusModuleData;

  @state() private _loadingList = false;

  @state() private _loadingModule = false;

  @state() private _error?: string;

  @state() private _translationsLoaded = false;

  private _bootstrapped = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (!document.getElementById("velbus-panel-root-style")) {
      const style = document.createElement("style");
      style.id = "velbus-panel-root-style";
      style.textContent =
        "html, body { height: 100%; margin: 0; overflow: hidden; }";
      document.head.appendChild(style);
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    makeDialogManager(this);
    listenMediaQuery("(prefers-color-scheme: dark)", () => {
      this._applyTheme();
    });
    void this._init();
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has("hass") && this.hass) {
      this._applyTheme();
      void this._init();
    }
    if (changed.has("panel")) {
      this._configEntryId = this._resolveConfigEntryId();
    }
    if (
      (changed.has("route") || changed.has("panel")) &&
      this._callWs &&
      this._translationsLoaded
    ) {
      void this._onRouteChange();
    }
  }

  protected render(): TemplateResult {
    if (!this._translationsLoaded || !this.hass) {
      return html`<div class="boot"><ha-spinner></ha-spinner></div>`;
    }

    const route = this._parseRoute();
    const header =
      route.page === "module"
        ? this._moduleData?.name ||
          this.hass.localize("component.velbus.config_panel.title")
        : this.hass.localize("component.velbus.config_panel.title");

    if (this._error) {
      return html`
        <hass-subpage
          .hass=${this.hass}
          .narrow=${this.narrow}
          .header=${header}
          back-path="/config/integrations/integration/velbus"
        >
          <div class="container">
            <ha-alert alert-type="error">${this._error}</ha-alert>
          </div>
        </hass-subpage>
      `;
    }

    if (route.page === "list") {
      return html`
        <velbus-config-dashboard
          .hass=${this.hass}
          .narrow=${this.narrow}
          .baseData=${this._baseData}
          .modules=${this._modules}
          .loading=${this._loadingList}
          .onSelectModule=${this._navigateToModule}
        ></velbus-config-dashboard>
      `;
    }

    return html`
      <velbus-module-page
        .hass=${this.hass}
        .narrow=${this.narrow}
        .callWs=${this._callWs}
        .moduleData=${this._moduleData}
        .modules=${this._modules}
        .advancedMode=${this._advancedMode}
        .moduleAddress=${this._moduleAddress ?? 0}
        .loading=${this._loadingModule}
        .onBack=${this._navigateToList}
      ></velbus-module-page>
    `;
  }

  private async _init(): Promise<void> {
    if (!this.hass || this._bootstrapped) {
      return;
    }
    this._bootstrapped = true;
    await Promise.all([
      this.hass.loadBackendTranslation("config_panel", "velbus", false),
      this.hass.loadBackendTranslation("exceptions", "velbus", false),
      this.hass.loadFragmentTranslation("config"),
      fetchAndScheduleBrandsAccessToken(this.hass),
    ]);
    this._translationsLoaded = true;
    this._applyTheme();
    await this._bootstrap();
  }

  private _applyTheme(): void {
    if (!this.hass || !this.parentElement) {
      return;
    }
    applyThemesOnElement(
      this.parentElement,
      this.hass.themes,
      this.hass.selectedTheme?.theme ||
        (this.hass.themes.darkMode && this.hass.themes.default_dark_theme
          ? this.hass.themes.default_dark_theme
          : this.hass.themes.default_theme),
      {
        ...this.hass.selectedTheme,
        dark: this.hass.themes.darkMode,
      },
    );
    this.parentElement.style.backgroundColor =
      "var(--primary-background-color)";
    this.parentElement.style.color = "var(--primary-text-color)";
  }

  private _resolveConfigEntryId(): string | undefined {
    if (this.panel?.config?.config_entry_id) {
      return this.panel.config.config_entry_id;
    }
    if (this.panel?.config?.config_entry) {
      return this.panel.config.config_entry;
    }
    const fromQuery = new URLSearchParams(window.location.search).get(
      "config_entry",
    );
    return fromQuery ?? undefined;
  }

  private _parseRoute(): ParsedRoute {
    const rawPath =
      this.route?.path ?? window.location.pathname.replace(/^\/velbus\/?/, "");
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

  private _navigate(path: string): void {
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
      }),
    );
    void this._onRouteChange();
  }

  private _navigateToModule = (address: number): void => {
    this._navigate(`/module/${address}`);
  };

  private _navigateToList = (): void => {
    this._navigate("");
  };

  private async _bootstrap(): Promise<void> {
    this._configEntryId = this._resolveConfigEntryId();
    if (!this.hass || !this._configEntryId) {
      this._bootstrapped = false;
      return;
    }
    this._callWs = createVelbusWsClient(this.hass, this._configEntryId);
    try {
      this._baseData = await fetchBaseData(this._callWs);
      this._advancedMode = this._baseData.advanced_mode;
      await this._refreshModules();
      await this._onRouteChange();
    } catch (error) {
      this._error = String(error);
    }
  }

  private async _refreshModules(): Promise<void> {
    if (!this._callWs) {
      return;
    }
    this._loadingList = true;
    try {
      this._modules = await fetchModules(this._callWs);
    } finally {
      this._loadingList = false;
    }
  }

  private async _onRouteChange(): Promise<void> {
    const route = this._parseRoute();
    if (route.page === "list") {
      this._moduleAddress = undefined;
      this._moduleData = undefined;
      return;
    }
    if (!this._callWs || route.address == null) {
      return;
    }
    if (route.address === this._moduleAddress && this._moduleData) {
      return;
    }
    this._moduleAddress = route.address;
    this._loadingModule = true;
    this._error = undefined;
    try {
      this._moduleData = await fetchModule(this._callWs, route.address);
    } catch (error) {
      this._error = String(error);
      this._moduleData = undefined;
    } finally {
      this._loadingModule = false;
    }
  }

  static styles = [
    velbusPageStyles,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .boot {
        align-items: center;
        display: flex;
        height: 100%;
        justify-content: center;
        padding: var(--ha-space-4);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "velbus-panel": VelbusPanel;
  }
}
