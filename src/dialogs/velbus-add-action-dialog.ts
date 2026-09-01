import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators";
import type { HaSelectSelectEvent } from "@ha/components/ha-select";
import "@ha/components/ha-button";
import "@ha/components/ha-dialog";
import "@ha/components/ha-dialog-footer";
import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import { fireEvent } from "@ha/common/dom/fire_event";
import { DialogMixin } from "@ha/dialogs/dialog-mixin";
import { haStyleDialog } from "@ha/resources/styles";
import type { HomeAssistant } from "@ha/types";

import { programAction } from "../data/websocket";
import { sourceChannelOptions } from "../module-pages/base";
import type {
  VelbusCallWs,
  VelbusModuleSummary,
  VelbusSchemaSection,
} from "../types";

export interface VelbusAddActionDialogParams {
  hass: HomeAssistant;
  callWs: VelbusCallWs;
  modules: VelbusModuleSummary[];
  moduleAddress: number;
  actionChannel: number;
  actionTable: VelbusSchemaSection;
  onComplete: () => Promise<void>;
}

@customElement("velbus-add-action-dialog")
class VelbusAddActionDialog extends DialogMixin<VelbusAddActionDialogParams>(
  LitElement,
) {
  @state() private _sourceModuleAddress = 0;

  @state() private _sourceChannel = 1;

  @state() private _action = "";

  @state() private _submitting = false;

  @state() private _initialized = false;

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (!this.params || this._initialized) {
      return;
    }
    this._initialized = true;
    const firstModule = this.params.modules[0];
    this._sourceModuleAddress = firstModule?.address ?? 0;
    const channels = this._channelOptions();
    this._sourceChannel = channels[0]?.value ?? 1;
    this._action = this.params.actionTable.actions?.[0]?.key ?? "";
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.params) {
      return nothing;
    }
    const { hass, modules, actionTable } = this.params;
    const channelFallback = (channel: number) =>
      `${hass.localize("component.velbus.config_panel.module.channel")} ${channel}`;
    const channels = sourceChannelOptions(
      modules,
      this._sourceModuleAddress,
      channelFallback,
    );
    const title =
      actionTable.kind === "input"
        ? hass.localize("component.velbus.config_panel.module.add_input_action")
        : hass.localize("component.velbus.config_panel.module.add_action");

    return html`
      <ha-dialog open header-title=${title}>
        <p>
          ${hass.localize("component.velbus.config_panel.module.program_action")}
        </p>
        <ha-select
          .label=${hass.localize(
            "component.velbus.config_panel.module.source_module",
          )}
          .value=${String(this._sourceModuleAddress)}
          .options=${modules.map((module) => ({
            value: String(module.address),
            label: `${module.name} (${module.address})`,
          }))}
          @selected=${this._sourceModuleChanged}
        ></ha-select>
        <ha-select
          .label=${hass.localize(
            "component.velbus.config_panel.module.source_channel",
          )}
          .value=${String(this._sourceChannel)}
          .options=${channels.map((channel) => ({
            value: String(channel.value),
            label: channel.label,
          }))}
          @selected=${this._sourceChannelChanged}
        ></ha-select>
        <ha-select
          .label=${hass.localize("component.velbus.config_panel.module.action")}
          .value=${this._action}
          .options=${(actionTable.actions || []).map((action) => ({
            value: action.key,
            label: action.label,
          }))}
          @selected=${this._actionChanged}
        ></ha-select>
        <ha-dialog-footer slot="footer">
          <ha-button
            slot="secondaryAction"
            appearance="plain"
            @click=${this.closeDialog}
          >
            ${hass.localize("ui.common.cancel")}
          </ha-button>
          <ha-button
            slot="primaryAction"
            .disabled=${this._submitting}
            @click=${this._confirm}
          >
            ${hass.localize("component.velbus.config_panel.module.add_action")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }

  private _channelOptions() {
    return sourceChannelOptions(
      this.params!.modules,
      this._sourceModuleAddress,
      (channel) =>
        `${this.params!.hass.localize("component.velbus.config_panel.module.channel")} ${channel}`,
    );
  }

  private _sourceModuleChanged(ev: HaSelectSelectEvent): void {
    this._sourceModuleAddress = Number(ev.detail.value);
    this._sourceChannel = this._channelOptions()[0]?.value ?? 1;
  }

  private _sourceChannelChanged(ev: HaSelectSelectEvent): void {
    this._sourceChannel = Number(ev.detail.value);
  }

  private _actionChanged(ev: HaSelectSelectEvent): void {
    this._action = String(ev.detail.value ?? "");
  }

  private async _confirm(): Promise<void> {
    if (!this.params || !this._action) {
      return;
    }
    this._submitting = true;
    try {
      await programAction(
        this.params.callWs,
        this.params.moduleAddress,
        this.params.actionChannel,
        this._sourceModuleAddress,
        this._sourceChannel,
        this._action,
      );
      await this.params.onComplete();
      this.closeDialog();
    } finally {
      this._submitting = false;
    }
  }

  static styles: CSSResultGroup = [
    haStyleDialog,
    css`
      ha-select {
        display: block;
        margin-bottom: var(--ha-space-4);
      }
    `,
  ];
}

export const showVelbusAddActionDialog = (
  element: HTMLElement,
  params: VelbusAddActionDialogParams,
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "velbus-add-action-dialog",
    // eslint-disable-next-line import-x/no-self-import -- lazy dialog chunk
    dialogImport: () => import("./velbus-add-action-dialog"),
    dialogParams: params,
  });
};

declare global {
  interface HTMLElementTagNameMap {
    "velbus-add-action-dialog": VelbusAddActionDialog;
  }
}
