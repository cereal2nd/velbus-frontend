import { mdiAlertCircleOutline, mdiCheck } from "@mdi/js";
import type { CSSResultGroup, TemplateResult } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import "@ha/components/ha-card";
import "@ha/components/ha-svg-icon";
import type { HomeAssistant } from "@ha/types";
import { brandsUrl } from "@ha/util/brands-url";

@customElement("velbus-status-card")
export class VelbusStatusCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ type: Boolean }) public connected = false;

  @property({ attribute: false, type: Number }) public moduleCount = 0;

  protected render(): TemplateResult {
    const darkOptimized = Boolean(this.hass.themes?.darkMode);
    return html`
      <ha-card class="network-status">
        <div class="card-content">
          <div class="heading">
            <div class="icon ${this.connected ? "success" : "error"}">
              <ha-svg-icon
                .path=${this.connected ? mdiCheck : mdiAlertCircleOutline}
              ></ha-svg-icon>
            </div>
            <div class="details">
              ${
                this.connected
                  ? this.hass.localize(
                      "component.velbus.config_panel.status_online",
                    )
                  : this.hass.localize(
                      "component.velbus.config_panel.status_offline",
                    )
              }
              <br />
              <small>
                ${this.hass.localize("component.velbus.config_panel.modules", {
                  count: this.moduleCount,
                })}
              </small>
            </div>
            <img
              class="logo"
              alt=""
              crossorigin="anonymous"
              referrerpolicy="no-referrer"
              src=${brandsUrl(
                {
                  domain: "velbus",
                  type: "icon",
                  darkOptimized,
                },
                this.hass.auth.data.hassUrl,
              )}
            />
          </div>
        </div>
      </ha-card>
    `;
  }

  static styles: CSSResultGroup = css`
    .heading {
      align-items: center;
      column-gap: var(--ha-space-4);
      display: flex;
    }
    .logo {
      height: 40px;
      margin-inline-start: auto;
      object-fit: contain;
      width: 40px;
    }
    .icon {
      --icon-color: var(--primary-color);
      align-items: center;
      border-radius: var(--ha-border-radius-2xl);
      display: flex;
      flex-shrink: 0;
      height: 40px;
      justify-content: center;
      overflow: hidden;
      position: relative;
      width: 40px;
    }
    .icon.success {
      --icon-color: var(--success-color);
    }
    .icon.error {
      --icon-color: var(--error-color);
    }
    .icon::before {
      background-color: var(--icon-color);
      content: "";
      display: block;
      inset: 0;
      opacity: 0.2;
      position: absolute;
    }
    .icon ha-svg-icon {
      color: var(--icon-color);
      height: 24px;
      width: 24px;
    }
    .details {
      color: var(--primary-text-color);
      font-size: var(--ha-font-size-xl);
      font-weight: var(--ha-font-weight-normal);
      line-height: var(--ha-line-height-condensed);
    }
    small {
      color: var(--secondary-text-color);
      font-size: var(--ha-font-size-m);
      letter-spacing: 0.25px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "velbus-status-card": VelbusStatusCard;
  }
}
