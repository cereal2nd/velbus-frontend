import {
  mdiMagnify,
  mdiMemory,
  mdiUnfoldLessHorizontal,
  mdiUnfoldMoreHorizontal,
} from "@mdi/js";
import type { CSSResultGroup, TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HASSDomCurrentTargetEvent } from "@ha/common/dom/fire_event";
import type { LocalizeKeys } from "@ha/common/translations/localize";
import "@ha/components/chips/ha-chip-set";
import "@ha/components/chips/ha-filter-chip";
import "@ha/components/ha-card";
import "@ha/components/ha-icon-button";
import "@ha/components/ha-spinner";
import "@ha/components/ha-svg-icon";
import "@ha/components/input/ha-input-search";
import "@ha/layouts/hass-subpage";
import { haStyle } from "@ha/resources/styles";
import type { HomeAssistant } from "@ha/types";
import type { HaInput } from "@ha/components/input/ha-input";

import "../components/velbus-module-group-card";
import "../components/velbus-status-card";
import { velbusEmptyStateStyles, velbusPageStyles } from "../styles";
import type { VelbusBaseData, VelbusModuleSummary } from "../types";
import {
  groupedModules,
  MODULE_GROUP_ORDER,
  MODULE_GROUP_TRANSLATION_KEYS,
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

  @state() private _groupFilter?: ModuleGroupId;

  @state() private _openGroups?: Set<ModuleGroupId>;

  protected render(): TemplateResult {
    const filtered = this._filter.trim().toLowerCase();
    const visibleModules = filtered
      ? this.modules.filter((module) =>
          moduleSearchText(module).includes(filtered),
        )
      : this.modules;
    const allGroups = groupedModules(this.modules);
    const groups = groupedModules(visibleModules);
    const chipGroupIds = MODULE_GROUP_ORDER.filter(
      (groupId) => (allGroups.get(groupId)?.length ?? 0) > 0,
    );
    const visibleGroupIds = MODULE_GROUP_ORDER.filter(
      (groupId) =>
        (groups.get(groupId)?.length ?? 0) > 0 &&
        (this._groupFilter === undefined || this._groupFilter === groupId),
    );
    const hasGroups = chipGroupIds.length > 0;
    const openGroups = this._openGroups ?? new Set(visibleGroupIds);

    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        .header=${this.hass.localize("component.velbus.config_panel.title")}
        back-path="/config/integrations/integration/velbus"
      >
        ${
          hasGroups
            ? html`
                <ha-icon-button
                  slot="toolbar-icon"
                  .label=${this.hass.localize(
                    "component.velbus.config_panel.expand_all_groups",
                  )}
                  .path=${mdiUnfoldMoreHorizontal}
                  @click=${this._expandAllGroups}
                ></ha-icon-button>
                <ha-icon-button
                  slot="toolbar-icon"
                  .label=${this.hass.localize(
                    "component.velbus.config_panel.collapse_all_groups",
                  )}
                  .path=${mdiUnfoldLessHorizontal}
                  @click=${this._collapseAllGroups}
                ></ha-icon-button>
              `
            : nothing
        }
        <div class="container">
          <velbus-status-card
            .hass=${this.hass}
            .connected=${this.baseData?.connected ?? false}
            .moduleCount=${this.baseData?.module_count ?? this.modules.length}
          ></velbus-status-card>
          ${this._renderContent(
            visibleModules,
            groups,
            visibleGroupIds,
            chipGroupIds,
            openGroups,
          )}
        </div>
      </hass-subpage>
    `;
  }

  private _renderContent(
    visibleModules: VelbusModuleSummary[],
    groups: ReturnType<typeof groupedModules>,
    visibleGroupIds: ModuleGroupId[],
    chipGroupIds: ModuleGroupId[],
    openGroups: Set<ModuleGroupId>,
  ) {
    if (this.loading) {
      return html`<div class="center"><ha-spinner></ha-spinner></div>`;
    }
    if (!this.modules.length) {
      return html`
        <ha-card>
          <div class="empty-state">
            <ha-svg-icon .path=${mdiMemory}></ha-svg-icon>
            <p>
              ${this.hass.localize("component.velbus.config_panel.no_modules")}
            </p>
            <small>
              ${this.hass.localize(
                "component.velbus.config_panel.no_modules_description",
              )}
            </small>
          </div>
        </ha-card>
      `;
    }
    return html`
      <ha-input-search
        class="filter-input"
        appearance="outlined"
        .placeholder=${this.hass.localize(
          "component.velbus.config_panel.filter_placeholder",
        )}
        .value=${this._filter}
        @input=${this._filterChanged}
      ></ha-input-search>
      ${
        chipGroupIds.length
          ? html`
              <ha-chip-set class="filters">
                <ha-filter-chip
                  no-leading-icon
                  data-group="all"
                  .selected=${this._groupFilter === undefined}
                  .label=${this.hass.localize(
                    "component.velbus.config_panel.all",
                  )}
                  @click=${this._groupFilterClicked}
                ></ha-filter-chip>
                ${chipGroupIds.map(
                  (groupId) => html`
                    <ha-filter-chip
                      no-leading-icon
                      data-group=${groupId}
                      .selected=${this._groupFilter === groupId}
                      .label=${this.hass.localize(
                        MODULE_GROUP_TRANSLATION_KEYS[groupId] as LocalizeKeys,
                      )}
                      @click=${this._groupFilterClicked}
                    ></ha-filter-chip>
                  `,
                )}
              </ha-chip-set>
            `
          : nothing
      }
      <div class="group-grid">
        ${visibleGroupIds.map((groupId) => {
          const groupModules = groups.get(groupId) || [];
          return html`
            <velbus-module-group-card
              .hass=${this.hass}
              .groupId=${groupId}
              .modules=${groupModules}
              .open=${openGroups.has(groupId)}
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
                  <div class="empty-state">
                    <ha-svg-icon .path=${mdiMagnify}></ha-svg-icon>
                    <p>
                      ${this.hass.localize(
                        "component.velbus.config_panel.no_matching_modules",
                      )}
                    </p>
                    <small>
                      ${this.hass.localize(
                        "component.velbus.config_panel.no_matching_modules_description",
                      )}
                    </small>
                  </div>
                </ha-card>
              `
        }
      </div>
    `;
  }

  private _filterChanged(ev: HASSDomCurrentTargetEvent<HaInput>): void {
    const filter = ev.currentTarget.value ?? "";
    this._filter = filter;
    if (filter.trim()) {
      this._openGroups = new Set(this._getVisibleGroupIds());
    }
  }

  private _groupFilterClicked(
    ev: HASSDomCurrentTargetEvent<HTMLElement>,
  ): void {
    const group = ev.currentTarget.dataset.group;
    if (!group || group === "all") {
      this._groupFilter = undefined;
      return;
    }
    const groupId = group as ModuleGroupId;
    this._groupFilter = this._groupFilter === groupId ? undefined : groupId;
    if (this._groupFilter) {
      this._openGroups = new Set([this._groupFilter]);
    }
  }

  private _toggleGroup = (groupId: ModuleGroupId): void => {
    const next = new Set(this._openGroups ?? this._getVisibleGroupIds());
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
    const populated = MODULE_GROUP_ORDER.filter(
      (groupId) => (groups.get(groupId)?.length ?? 0) > 0,
    );
    return this._groupFilter
      ? populated.filter((groupId) => groupId === this._groupFilter)
      : populated;
  }

  private _expandAllGroups = (): void => {
    this._openGroups = new Set(this._getVisibleGroupIds());
  };

  private _collapseAllGroups = (): void => {
    this._openGroups = new Set();
  };

  static styles: CSSResultGroup = [
    haStyle,
    velbusPageStyles,
    velbusEmptyStateStyles,
    css`
      .filter-input {
        display: block;
        width: 100%;
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ha-space-2);
        overflow-x: auto;
      }
      .group-grid {
        align-items: start;
        display: grid;
        gap: var(--ha-space-4);
        grid-template-columns: repeat(auto-fill, minmax(min(360px, 100%), 1fr));
      }
      .group-grid > ha-card {
        grid-column: 1 / -1;
      }
      .center {
        align-items: center;
        display: flex;
        justify-content: center;
        padding-block: var(--ha-space-12);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "velbus-config-dashboard": VelbusConfigDashboard;
  }
}
