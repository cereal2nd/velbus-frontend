import {
  mdiMagnify,
  mdiMemory,
  mdiUnfoldLessHorizontal,
  mdiUnfoldMoreHorizontal,
} from "@mdi/js";
import type { CSSResultGroup, TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import "@ha/components/ha-card";
import "@ha/components/ha-icon-button";
import "@ha/components/ha-spinner";
import "@ha/components/ha-svg-icon";
import "@ha/components/ha-tooltip";
import "@ha/components/input/ha-input";
import "@ha/layouts/hass-subpage";
import { haStyle } from "@ha/resources/styles";
import type { HomeAssistant } from "@ha/types";
import type { HaInput } from "@ha/components/input/ha-input";

import "../components/velbus-module-group-card";
import "../components/velbus-status-card";
import { velbusPageStyles } from "../styles";
import type { VelbusBaseData, VelbusModuleSummary } from "../types";
import {
  groupedModules,
  MODULE_GROUP_ORDER,
  moduleSearchText,
  type ModuleGroupId,
} from "../util/module-groups";

@customElement("velbus-config-dashboard")
export class VelbusConfigDashboard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ type: Boolean }) public narrow = false;

  @property({ attribute: false }) public baseData?: VelbusBaseData;

  @property({ attribute: false }) public modules: VelbusModuleSummary[] = [];

  @property({ type: Boolean }) public loading = false;

  @property({ attribute: false })
  public onSelectModule?: (address: number) => void;

  @state() private _filter = "";

  @state() private _openGroups = new Set<ModuleGroupId>();

  protected render(): TemplateResult {
    const filtered = this._filter.trim().toLowerCase();
    const visibleModules = filtered
      ? this.modules.filter((module) =>
          moduleSearchText(module).includes(filtered),
        )
      : this.modules;
    const groups = groupedModules(visibleModules);
    const visibleGroupIds = MODULE_GROUP_ORDER.filter(
      (groupId) => (groups.get(groupId)?.length ?? 0) > 0,
    );
    const hasGroups = visibleGroupIds.length > 0;

    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        .header=${this.hass.localize("component.velbus.config_panel.title")}
        back-path="/config/integrations/integration/velbus"
      >
        <div class="container container--dashboard">
          ${this._renderToolbar(hasGroups)}
          <div class="group-grid">
            ${this._renderModules(visibleModules, groups, visibleGroupIds)}
          </div>
        </div>
      </hass-subpage>
    `;
  }

  private _renderToolbar(hasGroups: boolean): TemplateResult {
    return html`
      <div class="toolbar">
        <velbus-status-card
          .hass=${this.hass}
          .connected=${this.baseData?.connected ?? false}
          .moduleCount=${this.baseData?.module_count ?? this.modules.length}
        ></velbus-status-card>
        ${
          this.loading || !this.modules.length
            ? nothing
            : html`
                <ha-input
                  class="filter-input"
                  type="search"
                  .placeholder=${this.hass.localize(
                    "component.velbus.config_panel.filter_placeholder",
                  )}
                  .value=${this._filter}
                  @input=${this._filterChanged}
                >
                  <ha-svg-icon slot="start" .path=${mdiMagnify}></ha-svg-icon>
                </ha-input>
                ${
                  hasGroups
                    ? html`
                        <div class="group-actions">
                          <ha-tooltip
                            .content=${this.hass.localize(
                              "component.velbus.config_panel.expand_all_groups",
                            )}
                          >
                            <ha-icon-button
                              .label=${this.hass.localize(
                                "component.velbus.config_panel.expand_all_groups",
                              )}
                              .path=${mdiUnfoldMoreHorizontal}
                              @click=${this._expandAllGroups}
                            ></ha-icon-button>
                          </ha-tooltip>
                          <ha-tooltip
                            .content=${this.hass.localize(
                              "component.velbus.config_panel.collapse_all_groups",
                            )}
                          >
                            <ha-icon-button
                              .label=${this.hass.localize(
                                "component.velbus.config_panel.collapse_all_groups",
                              )}
                              .path=${mdiUnfoldLessHorizontal}
                              @click=${this._collapseAllGroups}
                            ></ha-icon-button>
                          </ha-tooltip>
                        </div>
                      `
                    : nothing
                }
              `
        }
      </div>
    `;
  }

  private _renderModules(
    visibleModules: VelbusModuleSummary[],
    groups: ReturnType<typeof groupedModules>,
    visibleGroupIds: ModuleGroupId[],
  ) {
    if (this.loading) {
      return html`<div class="center"><ha-spinner></ha-spinner></div>`;
    }
    if (!this.modules.length) {
      return html`
        <ha-card>
          <div class="center">
            <ha-svg-icon .path=${mdiMemory}></ha-svg-icon>
            <p>
              ${this.hass.localize("component.velbus.config_panel.no_modules")}
            </p>
          </div>
        </ha-card>
      `;
    }
    return html`
      ${visibleGroupIds.map((groupId) => {
        const groupModules = groups.get(groupId) || [];
        return html`
          <velbus-module-group-card
            .hass=${this.hass}
            .groupId=${groupId}
            .modules=${groupModules}
            .open=${this._openGroups.has(groupId)}
            .onSelect=${this.onSelectModule}
            .onToggle=${this._toggleGroup}
          ></velbus-module-group-card>
        `;
      })}
      ${
        visibleModules.length
          ? nothing
          : html`
              <ha-card>
                <div class="center">
                  <ha-svg-icon .path=${mdiMagnify}></ha-svg-icon>
                  <p>
                    ${this.hass.localize(
                      "component.velbus.config_panel.no_matching_modules",
                    )}
                  </p>
                </div>
              </ha-card>
            `
      }
    `;
  }

  private _filterChanged(ev: Event): void {
    const filter = (ev.currentTarget as HaInput).value ?? "";
    this._filter = filter;
    if (filter.trim()) {
      this._openGroups = new Set(
        MODULE_GROUP_ORDER.filter(
          (groupId) =>
            groupedModules(
              this.modules.filter((module) =>
                moduleSearchText(module).includes(filter.trim().toLowerCase()),
              ),
            ).get(groupId)?.length,
        ),
      );
    }
  }

  private _toggleGroup = (groupId: ModuleGroupId): void => {
    const next = new Set(this._openGroups);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    this._openGroups = next;
  };

  private _getVisibleGroupIds(): ModuleGroupId[] {
    const filtered = this._filter.trim().toLowerCase();
    const visibleModules = filtered
      ? this.modules.filter((module) =>
          moduleSearchText(module).includes(filtered),
        )
      : this.modules;
    const groups = groupedModules(visibleModules);
    return MODULE_GROUP_ORDER.filter(
      (groupId) => (groups.get(groupId)?.length ?? 0) > 0,
    );
  }

  private _expandAllGroups = (): void => {
    this._setAllGroups(this._getVisibleGroupIds(), true);
  };

  private _collapseAllGroups = (): void => {
    this._setAllGroups(this._getVisibleGroupIds(), false);
  };

  private _setAllGroups(groupIds: ModuleGroupId[], open: boolean): void {
    this._openGroups = open ? new Set(groupIds) : new Set();
  }

  static styles: CSSResultGroup = [
    haStyle,
    velbusPageStyles,
    css`
      .toolbar {
        align-items: center;
        display: grid;
        gap: var(--ha-space-4);
        grid-template-columns: minmax(240px, 360px) 1fr auto;
      }
      .toolbar:not(:has(.filter-input)) {
        grid-template-columns: minmax(240px, 360px);
      }
      velbus-status-card {
        min-width: 0;
      }
      .filter-input {
        min-width: 0;
        width: 100%;
      }
      .group-actions {
        display: flex;
        flex-shrink: 0;
        gap: var(--ha-space-1);
        justify-self: end;
      }
      .group-grid {
        align-items: start;
        display: grid;
        gap: var(--ha-space-4);
        grid-template-columns: repeat(auto-fill, minmax(min(360px, 100%), 1fr));
      }
      .group-grid > .center,
      .group-grid > ha-card {
        grid-column: 1 / -1;
      }
      .center {
        align-items: center;
        color: var(--secondary-text-color);
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
        justify-content: center;
        padding-block: var(--ha-space-12);
        padding-inline: var(--ha-space-4);
        text-align: center;
      }
      @media (max-width: 800px) {
        .toolbar,
        .toolbar:not(:has(.filter-input)) {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "velbus-config-dashboard": VelbusConfigDashboard;
  }
}
