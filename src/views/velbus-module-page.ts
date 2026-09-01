import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import "@ha/components/ha-spinner";
import "@ha/layouts/hass-subpage";
import type { HomeAssistant } from "@ha/types";

import "../module-pages/generic-module-page";
import {
  loadModulePage,
  resolveModulePageType,
} from "../module-pages/registry";
import { velbusPageStyles } from "../styles";
import type {
  VelbusCallWs,
  VelbusModuleData,
  VelbusModuleSummary,
} from "../types";

@customElement("velbus-module-page")
export class VelbusModulePage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ type: Boolean }) public narrow = false;

  @property({ attribute: false }) public callWs!: VelbusCallWs;

  @property({ attribute: false }) public moduleData?: VelbusModuleData;

  @property({ attribute: false }) public modules: VelbusModuleSummary[] = [];

  @property({ attribute: false, type: Boolean }) public advancedMode = false;

  @property({ attribute: false, type: Number }) public moduleAddress = 0;

  @property({ type: Boolean }) public loading = false;

  @property({ attribute: false }) public onBack?: () => void;

  @state() private _pageTag = "velbus-generic-module-page";

  protected updated(changedProperties: PropertyValues): void {
    if (changedProperties.has("moduleData") && this.moduleData) {
      void this._resolvePage();
    }
  }

  protected render(): TemplateResult {
    const header =
      this.moduleData?.name ||
      this.hass.localize("component.velbus.config_panel.title");

    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        .header=${header}
        .backCallback=${this.onBack}
      >
        <div class="container container--module">
          ${
            this.loading
              ? html`<div class="center"><ha-spinner></ha-spinner></div>`
              : this._renderEditor()
          }
        </div>
      </hass-subpage>
    `;
  }

  private _renderEditor() {
    if (this._pageTag !== "velbus-generic-module-page") {
      return nothing;
    }
    return html`
      <velbus-generic-module-page
        .hass=${this.hass}
        .callWs=${this.callWs}
        .moduleData=${this.moduleData}
        .modules=${this.modules}
        .advancedMode=${this.advancedMode}
        .moduleAddress=${this.moduleAddress}
      ></velbus-generic-module-page>
    `;
  }

  private async _resolvePage(): Promise<void> {
    if (!this.moduleData) {
      return;
    }
    this._pageTag = await loadModulePage(
      resolveModulePageType(this.moduleData),
    );
  }

  static styles: CSSResultGroup = [
    velbusPageStyles,
    css`
      .center {
        display: flex;
        justify-content: center;
        padding: var(--ha-space-12);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "velbus-module-page": VelbusModulePage;
  }
}
