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
        <div class="container">
          <velbus-status-card
            .hass=${this.hass}
            .connected=${this.baseData?.connected ?? false}
            .moduleCount=${this.baseData?.module_count ?? this.modules.length}
          ></velbus-status-card>
          ${this._renderModules(visibleModules, groups, visibleGroupIds, hasGroups)}
        </div>
      </hass-subpage>
    `;
  }

  private _renderModules(
    visibleModules: VelbusModuleSummary[],
    groups: ReturnType<typeof groupedModules>,
    visibleGroupIds: ModuleGroupId[],
    hasGroups: boolean,
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
      <ha-card class="filter-card">
        <div class="filter-row">
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
                        @click=${() => this._setAllGroups(visibleGroupIds, true)}
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
                        @click=${() => this._setAllGroups(visibleGroupIds, false)}
                      ></ha-icon-button>
                    </ha-tooltip>
                  </div>
                `
              : nothing
          }
        </div>
      </ha-card>
      ${visibleGroupIds.map((groupId) => {
        const groupModules = groups.get(groupId) || [];
        return html`
          <velbus-module-group-card
            .hass=${this.hass}
            .groupId=${groupId}
            .modules=${groupModules}
            .open=${this._openGroups.has(groupId)}
            .onSelect=${this.onSelectModule}
            .onToggle=${() => this._toggleGroup(groupId)}
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

  private _toggleGroup(groupId: ModuleGroupId): void {
    const next = new Set(this._openGroups);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    this._openGroups = next;
  }

  private _setAllGroups(groupIds: ModuleGroupId[], open: boolean): void {
    this._openGroups = open ? new Set(groupIds) : new Set();
  }

  static styles: CSSResultGroup = [
    haStyle,
    css`
      :host {
        --app-header-background-color: var(--sidebar-background-color);
        --app-header-text-color: var(--sidebar-text-color);
        --app-header-border-bottom: 1px solid var(--divider-color);
      }
      .container {
        margin: 0 auto;
        max-width: 600px;
        padding: var(--ha-space-2) var(--ha-space-4)
          calc(var(--ha-space-8) + var(--safe-area-inset-bottom, 0px));
      }
      velbus-status-card,
      ha-card {
        display: block;
        margin-top: var(--ha-space-4);
      }
      .filter-card {
        padding: var(--ha-space-3) var(--ha-space-4);
      }
      .filter-row {
        align-items: center;
        display: flex;
        gap: var(--ha-space-2);
      }
      .filter-input {
        flex: 1;
        min-width: 0;
      }
      .group-actions {
        display: flex;
        flex-shrink: 0;
        gap: var(--ha-space-1);
      }
      .center {
        align-items: center;
        color: var(--secondary-text-color);
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
        justify-content: center;
        padding: var(--ha-space-8);
        text-align: center;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "velbus-config-dashboard": VelbusConfigDashboard;
  }
}
