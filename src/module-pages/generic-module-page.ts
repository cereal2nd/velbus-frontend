import { mdiDeleteOutline, mdiFlash, mdiPlus } from "@mdi/js";
import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HaSelectSelectEvent } from "@ha/components/ha-select";
import "@ha/components/ha-alert";
import "@ha/components/ha-button";
import "@ha/components/ha-card";
import "@ha/components/ha-md-list";
import "@ha/components/ha-md-list-item";
import "@ha/components/ha-select";
import "@ha/components/ha-spinner";
import "@ha/components/ha-svg-icon";
import "@ha/components/ha-switch";
import "@ha/components/input/ha-input";
import type { HaInput } from "@ha/components/input/ha-input";
import type { HomeAssistant } from "@ha/types";

import {
  clearActionSlot,
  fetchChannelActions,
  fetchModule,
  saveChannelContact,
  saveChannelEnabled,
  saveChannelName,
} from "../data/websocket";
import { showVelbusAddActionDialog } from "../dialogs/velbus-add-action-dialog";
import type {
  VelbusActionSlot,
  VelbusCallWs,
  VelbusChannelMeta,
  VelbusModuleData,
  VelbusModuleSummary,
  VelbusSchemaSection,
} from "../types";
import { formatAddress } from "../util/format";
import {
  channelLabel,
  channelNumbers,
  findActionTable,
  findChannelEnable,
  findChannelNames,
  findContact,
  formatSource,
  getSchemaSections,
  isProgrammedSlot,
  namedChannelEntries,
} from "./base";

@customElement("velbus-generic-module-page")
export class VelbusGenericModulePage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public callWs!: VelbusCallWs;

  @property({ attribute: false }) public moduleData?: VelbusModuleData;

  @property({ attribute: false }) public modules: VelbusModuleSummary[] = [];

  @property({ attribute: false, type: Boolean }) public advancedMode = false;

  @property({ attribute: false, type: Number }) public moduleAddress = 0;

  @state() private _actionChannel = 1;

  @state() private _actionSlots: VelbusActionSlot[] = [];

  @state() private _actionsLoadedChannel: number | null = null;

  @state() private _loadingActions = false;

  @state() private _busy = false;

  protected updated(changed: PropertyValues): void {
    if (!changed.has("moduleData") || !this.moduleData) {
      return;
    }
    const actionTable = findActionTable(
      getSchemaSections(this.moduleData.schema),
    );
    const channels = channelNumbers(actionTable);
    if (channels.length) {
      this._actionChannel = channels[0];
      void this._refreshActions();
    }
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.moduleData) {
      return nothing;
    }

    const sections = getSchemaSections(this.moduleData.schema);
    const channelNames = findChannelNames(sections);
    const actionTable = findActionTable(sections);
    const channelEnable = findChannelEnable(sections);
    const contact = findContact(sections);
    const channels = this.moduleData.channels;
    const actions = this._actionSlots.filter(isProgrammedSlot);
    const editable = this.advancedMode && !this._busy;
    const selectedChannelLabel = channelLabel(
      this._actionChannel,
      sections,
      channels,
      this._channelFallback,
    );
    const selectedSupportsEnable =
      channelNumbers(channelEnable).includes(this._actionChannel) ||
      namedChannelEntries(
        sections.find((section) => section.type === "channels"),
      ).some(
        (entry) =>
          entry.channel === this._actionChannel && entry.supports_enable,
      );
    const selectedEnabled =
      channels[String(this._actionChannel)]?.enabled !== false;

    return html`
      ${
        this.advancedMode
          ? nothing
          : html`
              <ha-alert alert-type="warning">
                ${this.hass.localize(
                  "component.velbus.exceptions.advanced_mode_required.message",
                )}
              </ha-alert>
            `
      }
      <ha-card>
        <div class="card-header">${this.moduleData.type_name}</div>
        <div class="card-content">
          <div class="info-row">
            ${this.hass.localize("component.velbus.config_panel.module.address")}:
            ${formatAddress(this.moduleData.address)}
          </div>
          ${
            this.moduleData.sw_version
              ? html`<div class="info-row">
                  ${this.hass.localize("component.velbus.config_panel.module.firmware")}:
                  ${this.moduleData.sw_version}
                </div>`
              : nothing
          }
          ${
            this.moduleData.serial
              ? html`<div class="info-row">
                  ${this.hass.localize("component.velbus.config_panel.module.serial")}:
                  ${this.moduleData.serial}
                </div>`
              : nothing
          }
        </div>
      </ha-card>
      ${
        actionTable
          ? this._renderActionLayout(
              actionTable,
              sections,
              channelNames,
              contact,
              selectedSupportsEnable,
              selectedEnabled,
              selectedChannelLabel,
              actions,
              editable,
            )
          : html`
              ${channelNames ? this._renderNameOnlyChannels(channelNames, editable) : nothing}
              ${contact ? this._renderContactOnly(contact, sections, editable) : nothing}
            `
      }
    `;
  }

  private _channelFallback = (channel: number): string =>
    `${this.hass.localize("component.velbus.config_panel.module.channel")} ${channel}`;

  private _renderActionLayout(
    actionTable: VelbusSchemaSection,
    sections: VelbusSchemaSection[],
    channelNames: VelbusSchemaSection | undefined,
    contact: VelbusSchemaSection | undefined,
    selectedSupportsEnable: boolean,
    selectedEnabled: boolean,
    selectedChannelLabel: string,
    actions: VelbusActionSlot[],
    editable: boolean,
  ) {
    const channels = this.moduleData!.channels;
    return html`
      <div class="module-layout">
        <ha-card class="channel-panel">
          <div class="card-header">
            ${this.hass.localize("component.velbus.config_panel.module.channels")}
          </div>
          <ha-md-list>
            ${channelNumbers(actionTable).map((channel) => {
              const label = channelLabel(
                channel,
                sections,
                channels,
                this._channelFallback,
              );
              const disabled = channels[String(channel)]?.enabled === false;
              return html`
                <ha-md-list-item
                  type="button"
                  data-channel=${channel}
                  ?disabled=${this._busy}
                  @click=${this._selectChannel}
                >
                  <span slot="headline">${label}</span>
                  <span slot="supporting-text">
                    ${
                      disabled
                        ? this.hass.localize(
                            "component.velbus.config_panel.module.disabled",
                          )
                        : this._channelFallback(channel)
                    }
                  </span>
                </ha-md-list-item>
              `;
            })}
          </ha-md-list>
        </ha-card>
        <ha-card class="actions-panel">
          <div class="card-header">
            ${
              actionTable.kind === "input"
                ? this.hass.localize(
                    "component.velbus.config_panel.module.input_actions",
                  )
                : this.hass.localize(
                    "component.velbus.config_panel.module.actions",
                  )
            }
            <span class="secondary">${selectedChannelLabel}</span>
          </div>
          <div class="card-actions">
            <ha-button
              .disabled=${!editable}
              @click=${this._openAddActionDialog}
            >
              <ha-svg-icon slot="start" .path=${mdiPlus}></ha-svg-icon>
              ${
                actionTable.kind === "input"
                  ? this.hass.localize(
                      "component.velbus.config_panel.module.add_input_action",
                    )
                  : this.hass.localize(
                      "component.velbus.config_panel.module.add_action",
                    )
              }
            </ha-button>
          </div>
          ${this._renderChannelSettings(
            channelNames,
            contact,
            selectedSupportsEnable,
            selectedEnabled,
            editable,
          )}
          ${this._renderActionSlots(actions, editable)}
        </ha-card>
      </div>
    `;
  }

  private _renderChannelSettings(
    channelNames: VelbusSchemaSection | undefined,
    contact: VelbusSchemaSection | undefined,
    selectedSupportsEnable: boolean,
    selectedEnabled: boolean,
    editable: boolean,
  ) {
    const channel = this._actionChannel;
    const channels = this.moduleData?.channels ?? {};
    const rows: TemplateResult[] = [];

    if (
      namedChannelEntries(channelNames).some(
        (entry) => entry.channel === channel,
      )
    ) {
      rows.push(html`
        <div class="settings-row">
          <span>
            ${this.hass.localize("component.velbus.config_panel.module.channel_name")}
          </span>
          <ha-input
            .value=${channels[String(channel)]?.name || ""}
            maxlength="16"
            .disabled=${!editable}
            data-channel=${channel}
            @change=${this._nameChanged}
          ></ha-input>
        </div>
      `);
    }

    if (channelNumbers(contact).includes(channel)) {
      const current = channels[String(channel)]?.contact || "NO";
      rows.push(html`
        <div class="settings-row">
          <span>
            ${this.hass.localize("component.velbus.config_panel.module.contact")}
          </span>
          <ha-select
            .value=${current}
            .disabled=${!editable}
            .options=${(contact?.options || ["NO", "NC"]).map((option) => ({
              value: option,
              label: option,
            }))}
            data-channel=${channel}
            @selected=${this._contactChanged}
          ></ha-select>
        </div>
      `);
    }

    if (selectedSupportsEnable) {
      rows.push(html`
        <div class="settings-row">
          <span>
            ${this.hass.localize("component.velbus.config_panel.module.enabled")}
          </span>
          <ha-switch
            .checked=${selectedEnabled}
            .disabled=${!editable}
            data-channel=${channel}
            @change=${this._enabledChanged}
          ></ha-switch>
        </div>
      `);
    }

    return rows;
  }

  private _renderActionSlots(actions: VelbusActionSlot[], editable: boolean) {
    if (this._loadingActions && !actions.length) {
      return html`<div class="center"><ha-spinner></ha-spinner></div>`;
    }
    if (this._actionsLoadedChannel !== this._actionChannel) {
      return html`
        <div class="center">
          <ha-svg-icon .path=${mdiFlash}></ha-svg-icon>
          <p>
            ${this.hass.localize(
              "component.velbus.config_panel.module.select_channel_actions",
            )}
          </p>
        </div>
      `;
    }
    if (!actions.length) {
      return html`
        <div class="center">
          <ha-svg-icon .path=${mdiFlash}></ha-svg-icon>
          <p>
            ${this.hass.localize("component.velbus.config_panel.module.no_actions")}
          </p>
        </div>
      `;
    }
    return html`
      <ha-md-list>
        ${actions.map(
          (slot) => html`
            <ha-md-list-item>
              <span slot="overline">${slot.slot}</span>
              <span slot="headline">
                ${
                  slot.action_label ||
                  slot.action_key ||
                  this.hass.localize(
                    "component.velbus.config_panel.module.action",
                  )
                }
              </span>
              <span slot="supporting-text">
                ${formatSource(slot, this._channelFallback)}
              </span>
              ${
                editable
                  ? html`
                      <ha-button
                        slot="end"
                        variant="danger"
                        appearance="plain"
                        .disabled=${this._busy}
                        data-slot=${slot.slot}
                        @click=${this._clearSlot}
                      >
                        <ha-svg-icon
                          slot="start"
                          .path=${mdiDeleteOutline}
                        ></ha-svg-icon>
                        ${this.hass.localize(
                          "component.velbus.config_panel.module.clear_action",
                        )}
                      </ha-button>
                    `
                  : nothing
              }
            </ha-md-list-item>
          `,
        )}
      </ha-md-list>
    `;
  }

  private _renderNameOnlyChannels(
    channelNames: VelbusSchemaSection,
    editable: boolean,
  ) {
    const channels = this.moduleData?.channels ?? {};
    return html`
      <ha-card>
        <div class="card-header">
          ${this.hass.localize("component.velbus.config_panel.module.channel_name")}
        </div>
        ${namedChannelEntries(channelNames).map(
          (channelEntry: VelbusChannelMeta) => html`
            <div class="settings-row">
              <span>${channelEntry.name}</span>
              <ha-input
                .value=${channels[String(channelEntry.channel)]?.name || ""}
                maxlength="16"
                .disabled=${!editable}
                data-channel=${channelEntry.channel}
                @change=${this._nameChanged}
              ></ha-input>
            </div>
          `,
        )}
      </ha-card>
    `;
  }

  private _renderContactOnly(
    contact: VelbusSchemaSection,
    sections: VelbusSchemaSection[],
    editable: boolean,
  ) {
    const channels = this.moduleData?.channels ?? {};
    return html`
      <ha-card>
        <div class="card-header">
          ${this.hass.localize("component.velbus.config_panel.module.contact")}
        </div>
        ${channelNumbers(contact).map((channel) => {
          const current = channels[String(channel)]?.contact || "NO";
          const label = channelLabel(
            channel,
            sections,
            channels,
            this._channelFallback,
          );
          return html`
            <div class="settings-row">
              <span>${label}</span>
              <ha-select
                .value=${current}
                .disabled=${!editable}
                .options=${(contact.options || ["NO", "NC"]).map((option) => ({
                  value: option,
                  label: option,
                }))}
                data-channel=${channel}
                @selected=${this._contactChanged}
              ></ha-select>
            </div>
          `;
        })}
      </ha-card>
    `;
  }

  private async _refreshActions(): Promise<void> {
    if (!this.moduleData) {
      return;
    }
    this._loadingActions = true;
    try {
      this._actionSlots = await fetchChannelActions(
        this.callWs,
        this.moduleAddress,
        this._actionChannel,
      );
      this._actionsLoadedChannel = this._actionChannel;
    } finally {
      this._loadingActions = false;
    }
  }

  private async _reloadModule(): Promise<void> {
    this.moduleData = await fetchModule(this.callWs, this.moduleAddress);
  }

  private async _withBusy(fn: () => Promise<void>): Promise<void> {
    if (this._busy) {
      return;
    }
    this._busy = true;
    try {
      await fn();
    } finally {
      this._busy = false;
    }
  }

  private async _selectChannel(ev: Event): Promise<void> {
    const channel = Number((ev.currentTarget as HTMLElement).dataset.channel);
    if (
      this._busy ||
      Number.isNaN(channel) ||
      channel === this._actionChannel
    ) {
      return;
    }
    this._actionChannel = channel;
    await this._refreshActions();
  }

  private _openAddActionDialog(): void {
    const actionTable = findActionTable(
      getSchemaSections(this.moduleData?.schema),
    );
    if (!actionTable || !this.moduleData) {
      return;
    }
    showVelbusAddActionDialog(this, {
      hass: this.hass,
      callWs: this.callWs,
      modules: this.modules,
      moduleAddress: this.moduleAddress,
      actionChannel: this._actionChannel,
      actionTable,
      onComplete: async () => {
        await this._refreshActions();
      },
    });
  }

  private async _clearSlot(ev: Event): Promise<void> {
    const slot = Number((ev.currentTarget as HTMLElement).dataset.slot);
    if (Number.isNaN(slot)) {
      return;
    }
    await this._withBusy(async () => {
      await clearActionSlot(
        this.callWs,
        this.moduleAddress,
        this._actionChannel,
        slot,
      );
      await this._refreshActions();
    });
  }

  private async _nameChanged(ev: Event): Promise<void> {
    const target = ev.currentTarget as HaInput;
    const channel = Number(target.dataset.channel);
    await this._withBusy(async () => {
      await saveChannelName(
        this.callWs,
        this.moduleAddress,
        channel,
        target.value ?? "",
      );
      await this._reloadModule();
    });
  }

  private async _enabledChanged(ev: Event): Promise<void> {
    const target = ev.currentTarget as HTMLInputElement;
    const channel = Number(target.dataset.channel);
    await this._withBusy(async () => {
      await saveChannelEnabled(
        this.callWs,
        this.moduleAddress,
        channel,
        target.checked,
      );
      await this._reloadModule();
      if (this._actionsLoadedChannel === channel) {
        await this._refreshActions();
      }
    });
  }

  private async _contactChanged(ev: HaSelectSelectEvent): Promise<void> {
    const channel = Number((ev.currentTarget as HTMLElement).dataset.channel);
    const value = String(ev.detail.value ?? "");
    await this._withBusy(async () => {
      await saveChannelContact(this.callWs, this.moduleAddress, channel, value);
      await this._reloadModule();
    });
  }

  static styles: CSSResultGroup = css`
    :host {
      display: block;
    }
    ha-alert,
    ha-card {
      display: block;
      margin-bottom: var(--ha-space-4);
    }
    .card-header {
      font-weight: var(--ha-font-weight-medium);
      padding: var(--ha-space-4);
    }
    .card-header .secondary {
      color: var(--secondary-text-color);
      display: block;
      font-size: var(--ha-font-size-s);
      font-weight: var(--ha-font-weight-normal);
    }
    .card-content {
      padding: 0 var(--ha-space-4) var(--ha-space-4);
    }
    .info-row {
      color: var(--secondary-text-color);
      margin-bottom: var(--ha-space-2);
    }
    .module-layout {
      display: grid;
      gap: var(--ha-space-4);
      grid-template-columns: minmax(220px, 280px) 1fr;
    }
    .card-actions {
      padding: 0 var(--ha-space-4) var(--ha-space-4);
    }
    .settings-row {
      align-items: center;
      display: grid;
      gap: var(--ha-space-3);
      grid-template-columns: 1fr minmax(160px, 240px);
      padding: var(--ha-space-3) var(--ha-space-4);
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
    ha-md-list {
      background: none;
      padding: 0;
    }
    @media (max-width: 900px) {
      .module-layout {
        grid-template-columns: 1fr;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "velbus-generic-module-page": VelbusGenericModulePage;
  }
}
