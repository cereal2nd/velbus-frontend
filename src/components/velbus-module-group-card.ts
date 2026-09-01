import type { CSSResultGroup, TemplateResult } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { styleMap } from "lit/directives/style-map";
import type {
  HASSDomCurrentTargetEvent,
  HASSDomEvent,
} from "@ha/common/dom/fire_event";
import type { LocalizeKeys } from "@ha/common/translations/localize";
import "@ha/components/ha-expansion-panel";
import "@ha/components/ha-icon-next";
import "@ha/components/ha-label";
import "@ha/components/ha-md-list";
import "@ha/components/ha-md-list-item";
import "@ha/components/ha-svg-icon";
import "@ha/components/ha-card";
import type { HomeAssistant } from "@ha/types";

import type { VelbusModuleSummary } from "../types";
import { formatAddress } from "../util/format";
import { moduleIconForType } from "../util/icons";
import type { ModuleGroupId } from "../util/module-groups";
import {
  MODULE_GROUP_ACCENT,
  MODULE_GROUP_ICONS,
  MODULE_GROUP_TRANSLATION_KEYS,
} from "../util/module-groups";
import { velbusIconWellStyles } from "../styles";

@customElement("velbus-module-group-card")
export class VelbusModuleGroupCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public groupId!: ModuleGroupId;

  @property({ attribute: false }) public modules: VelbusModuleSummary[] = [];

  @property({ type: Boolean }) public open = false;

  @property({ attribute: false })
  public onSelect?: (address: number) => void;

  @property({ attribute: false })
  public onToggle?: (groupId: ModuleGroupId) => void;

  protected render(): TemplateResult {
    const accent = MODULE_GROUP_ACCENT[this.groupId];
    return html`
      <ha-card class="nav-card">
        <ha-expansion-panel
          .expanded=${this.open}
          left-chevron
          @expanded-changed=${this._expandedChanged}
        >
          <div
            slot="leading-icon"
            class="icon-background"
            style=${styleMap({ backgroundColor: accent })}
          >
            <ha-svg-icon
              .path=${MODULE_GROUP_ICONS[this.groupId]}
            ></ha-svg-icon>
          </div>
          <div slot="header" class="group-header">
            ${this.hass.localize(
              MODULE_GROUP_TRANSLATION_KEYS[this.groupId] as LocalizeKeys,
            )}
            <span class="secondary">
              ${this.hass.localize("component.velbus.config_panel.modules", {
                count: this.modules.length,
              })}
            </span>
          </div>
          <ha-md-list>
            ${this.modules.map(
              (module) => html`
                <ha-md-list-item
                  type="button"
                  data-address=${module.address}
                  @click=${this._select}
                >
                  <div
                    slot="start"
                    class="icon-background small"
                    style=${styleMap({ backgroundColor: accent })}
                  >
                    <ha-svg-icon
                      .path=${moduleIconForType(module.type_name)}
                    ></ha-svg-icon>
                  </div>
                  <span slot="headline"
                    >${module.name || module.type_name}</span
                  >
                  <span slot="supporting-text">${module.type_name}</span>
                  <ha-label slot="trailing-supporting-text" dense>
                    ${formatAddress(module.address)}
                  </ha-label>
                  <ha-icon-next slot="end"></ha-icon-next>
                </ha-md-list-item>
              `,
            )}
          </ha-md-list>
        </ha-expansion-panel>
      </ha-card>
    `;
  }

  private _expandedChanged(ev: HASSDomEvent<{ expanded: boolean }>): void {
    ev.stopPropagation();
    if (ev.detail.expanded !== this.open) {
      this.onToggle?.(this.groupId);
    }
  }

  private _select(ev: HASSDomCurrentTargetEvent<HTMLElement>): void {
    const address = Number(ev.currentTarget.dataset.address);
    if (!Number.isNaN(address)) {
      this.onSelect?.(address);
    }
  }

  static styles: CSSResultGroup = [
    velbusIconWellStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .nav-card {
        overflow: hidden;
        width: 100%;
      }
      ha-expansion-panel {
        --expansion-panel-content-padding: 0;
        --expansion-panel-summary-padding: var(--ha-space-3) var(--ha-space-4);
      }
      .group-header {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-1);
        min-width: 0;
      }
      .secondary {
        color: var(--secondary-text-color);
        font-size: var(--ha-font-size-s);
        font-weight: var(--ha-font-weight-normal);
      }
      ha-md-list {
        background: none;
        padding: var(--ha-space-1) 0;
      }
      ha-md-list-item {
        --md-item-overflow: visible;
      }
      ha-label {
        max-width: 100%;
      }
      ha-icon-next {
        color: var(--secondary-text-color);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "velbus-module-group-card": VelbusModuleGroupCard;
  }
}
