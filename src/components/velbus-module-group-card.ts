import { mdiChevronDown, mdiViewModule } from "@mdi/js";
import type { CSSResultGroup, TemplateResult } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import type { LocalizeKeys } from "@ha/common/translations/localize";
import "@ha/components/ha-icon-next";
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
      <ha-card class="nav-card" style="--group-accent: ${accent}">
        <details .open=${this.open}>
          <summary class="card-header" @click=${this._summaryClick}>
            <div class="header-leading">
              <div class="group-icon">
                <ha-svg-icon
                  .path=${MODULE_GROUP_ICONS[this.groupId]}
                ></ha-svg-icon>
              </div>
              <span class="title">
                ${this.hass.localize(
                  MODULE_GROUP_TRANSLATION_KEYS[this.groupId] as LocalizeKeys,
                )}
              </span>
            </div>
            <div class="header-trailing">
              <span class="count-badge" aria-hidden="true">
                <ha-svg-icon .path=${mdiViewModule}></ha-svg-icon>
                <span class="count-value">${this.modules.length}</span>
              </span>
              <ha-svg-icon
                class="chevron"
                .path=${mdiChevronDown}
              ></ha-svg-icon>
            </div>
          </summary>
          <div class="card-content">
            <ha-md-list>
              ${this.modules.map(
                (module) => html`
                  <ha-md-list-item
                    type="button"
                    data-address=${module.address}
                    @click=${this._select}
                  >
                    <ha-svg-icon
                      slot="start"
                      class="module-icon"
                      .path=${moduleIconForType(module.type_name)}
                    ></ha-svg-icon>
                    <span slot="headline"
                      >${module.name || module.type_name}</span
                    >
                    <span slot="supporting-text">${module.type_name}</span>
                    <span slot="trailing-supporting-text" class="address">
                      ${formatAddress(module.address)}
                    </span>
                    <ha-icon-next slot="end"></ha-icon-next>
                  </ha-md-list-item>
                `,
              )}
            </ha-md-list>
          </div>
        </details>
      </ha-card>
    `;
  }

  private _summaryClick(ev: Event): void {
    ev.preventDefault();
    this.onToggle?.(this.groupId);
  }

  private _select(ev: Event): void {
    const address = Number((ev.currentTarget as HTMLElement).dataset.address);
    if (!Number.isNaN(address)) {
      this.onSelect?.(address);
    }
  }

  static styles: CSSResultGroup = css`
    :host {
      display: block;
      min-width: 0;
    }
    .nav-card {
      overflow: hidden;
      width: 100%;
    }
    details {
      display: block;
    }
    summary {
      cursor: pointer;
      list-style: none;
    }
    summary::-webkit-details-marker {
      display: none;
    }
    .nav-card .card-content {
      border-top: 1px solid var(--divider-color);
      padding: 0;
    }
    .card-header {
      align-items: center;
      background: color-mix(
        in srgb,
        var(--group-accent) 12%,
        var(--card-background-color)
      );
      border-inline-start: 4px solid var(--group-accent);
      display: flex;
      flex-wrap: wrap;
      gap: var(--ha-space-2);
      justify-content: space-between;
      padding: var(--ha-space-4);
    }
    .header-leading,
    .header-trailing {
      align-items: center;
      display: flex;
      gap: var(--ha-space-3);
    }
    .header-leading {
      flex: 1;
      min-width: 0;
    }
    .header-trailing {
      flex-shrink: 0;
      gap: var(--ha-space-2);
      margin-inline-start: auto;
    }
    .group-icon {
      align-items: center;
      background: color-mix(
        in srgb,
        var(--group-accent) 22%,
        var(--card-background-color)
      );
      border-radius: var(--ha-border-radius-lg);
      color: var(--group-accent);
      display: flex;
      flex-shrink: 0;
      height: 40px;
      justify-content: center;
      width: 40px;
    }
    .group-icon ha-svg-icon {
      height: 22px;
      width: 22px;
    }
    .title {
      color: var(--primary-text-color);
      font-size: var(--ha-font-size-l);
      font-weight: var(--ha-font-weight-medium);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .count-badge {
      align-items: center;
      background: color-mix(
        in srgb,
        var(--group-accent) 18%,
        var(--card-background-color)
      );
      border-radius: var(--ha-border-radius-pill);
      color: var(--group-accent);
      display: flex;
      flex-shrink: 0;
      font-size: var(--ha-font-size-s);
      font-weight: var(--ha-font-weight-medium);
      gap: var(--ha-space-1);
      line-height: 1;
      padding: var(--ha-space-1) var(--ha-space-2);
    }
    .count-badge ha-svg-icon {
      height: 16px;
      width: 16px;
    }
    .chevron {
      color: var(--secondary-text-color);
      flex-shrink: 0;
      transition: transform var(--ha-animation-duration-fast) ease;
    }
    details[open] .chevron {
      transform: rotate(180deg);
    }
    ha-md-list {
      background: none;
      padding: var(--ha-space-1) 0;
    }
    ha-md-list-item {
      --md-item-overflow: visible;
    }
    .module-icon {
      color: var(--group-accent);
    }
    .address {
      background: color-mix(
        in srgb,
        var(--group-accent) 14%,
        var(--secondary-background-color)
      );
      border-radius: var(--ha-border-radius-md);
      color: var(--primary-text-color);
      font-size: var(--ha-font-size-s);
      max-width: 100%;
      overflow-wrap: anywhere;
      padding: var(--ha-space-1) var(--ha-space-2);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "velbus-module-group-card": VelbusModuleGroupCard;
  }
}
