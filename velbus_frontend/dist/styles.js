export const PANEL_STYLES = `
  :host {
    display: block;
    height: 100%;
    width: 100%;
    min-width: 0;
    font-family: var(--ha-font-family-body, var(--primary-font-family, Roboto, Noto, sans-serif));
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-normal, 400);
    line-height: var(--ha-line-height-normal, 1.5);
    color: var(--primary-text-color, #212121);
    background: var(--primary-background-color, #fafafa);
    box-sizing: border-box;
    color-scheme: inherit;
    -webkit-font-smoothing: antialiased;
  }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  .subpage {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--primary-background-color, #fafafa);
    overflow: hidden;
  }
  .toolbar {
    background: var(--app-header-background-color, var(--primary-background-color, #fafafa));
    color: var(--app-header-text-color, var(--primary-text-color, #212121));
    flex: 0 0 auto;
    border-bottom: var(--app-header-border-bottom, 1px solid var(--divider-color, rgba(0, 0, 0, 0.12)));
  }
  .toolbar-content {
    display: flex;
    align-items: center;
    min-height: var(--header-height, 56px);
    padding: 4px 8px 4px 4px;
    gap: 4px;
  }
  .main-title {
    flex: 1 1 auto;
    min-width: 0;
    margin-inline-start: 12px;
    font-size: var(--ha-font-size-xl, 20px);
    font-weight: var(--ha-font-weight-normal, 400);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
  }
  .content {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    padding: 16px;
    padding-bottom: calc(24px + var(--safe-area-inset-bottom, 0px));
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb-color, rgba(0, 0, 0, 0.3)) transparent;
  }
  h1, h2, h3 {
    margin: 0;
    color: var(--primary-text-color, #212121);
    font-weight: var(--ha-font-weight-medium, 500);
  }
  h2 {
    font-size: var(--ha-font-size-xl, 20px);
    font-weight: var(--ha-font-weight-medium, 500);
  }
  h3 {
    font-size: var(--ha-font-size-l, 16px);
    font-weight: var(--ha-font-weight-medium, 500);
  }
  p { margin: 0 0 8px; }
  .muted, .secondary { color: var(--secondary-text-color, #727272); }
  .card {
    background: var(--ha-card-background, var(--card-background-color, #fff));
    color: var(--primary-text-color, #212121);
    border-radius: var(--ha-card-border-radius, 12px);
    border-width: var(--ha-card-border-width, 1px);
    border-style: solid;
    border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
    box-shadow: var(--ha-card-box-shadow, none);
    margin-bottom: 16px;
    overflow: hidden;
  }
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    font-size: var(--ha-card-header-font-size, 24px);
    font-weight: var(--ha-font-weight-normal, 400);
    letter-spacing: -0.012em;
    line-height: 1.3;
    color: var(--ha-card-header-color, var(--primary-text-color, #212121));
  }
  .card-header.compact {
    font-size: 16px;
    font-weight: 500;
    padding: 16px 16px 8px;
  }
  .card-header-text { min-width: 0; }
  .card-header-secondary {
    display: block;
    margin-top: 2px;
    font-size: 14px;
    letter-spacing: 0;
    color: var(--secondary-text-color, #727272);
  }
  .card-content { padding: 0 16px 16px; }
  .card-content:first-child { padding-top: 16px; }
  .card-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    padding: 0 16px 12px;
  }
  .extra-info {
    margin-top: 4px;
    color: var(--secondary-text-color, #727272);
    word-wrap: break-word;
  }
  .model {
    font-size: 16px;
    color: var(--secondary-text-color, #727272);
  }
  .search-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 16px;
    border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    color: var(--secondary-text-color, #727272);
  }
  .search-row input {
    flex: 1 1 auto;
    min-width: 0;
    border: none;
    background: transparent;
    padding: 12px 0;
    border-radius: 0;
    font-size: 16px;
  }
  .search-row input:focus-visible {
    outline: none;
  }
  .search-actions {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    margin-inline-start: 4px;
  }
  .search-row .icon-button {
    color: var(--secondary-text-color, #727272);
  }
  .list { display: flex; flex-direction: column; }
  .module-group {
    display: block;
    margin: 0;
    border: none;
  }
  .module-group + .module-group {
    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
  }
  .module-group-header {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    padding: 8px 16px;
    cursor: pointer;
    list-style: none;
    user-select: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text-color, #212121);
    background: color-mix(in srgb, var(--primary-text-color, #212121) 4%, transparent);
  }
  .module-group-header::-webkit-details-marker,
  .module-group-header::marker {
    display: none;
    content: "";
  }
  .module-group-header:hover {
    background: color-mix(in srgb, var(--primary-text-color, #212121) 8%, transparent);
  }
  .module-group-header .item-icon {
    width: 32px;
    height: 32px;
  }
  .module-group-header .item-title {
    font-size: 14px;
    font-weight: 500;
  }
  .module-group[open] .module-group-header {
    border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
  }
  .module-group-header .group-chevron {
    display: inline-flex;
    color: var(--secondary-text-color, #727272);
    transition: transform 0.15s ease;
  }
  .module-group[open] .group-chevron {
    transform: rotate(180deg);
  }
  .list-item,
  button.list-item,
  button.module-item,
  button.channel-item {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    min-height: 72px;
    padding: 8px 16px;
    margin: 0;
    text-align: left;
    background: transparent;
    color: var(--primary-text-color, #212121);
    border: none;
    border-radius: 0;
    box-shadow: none;
    cursor: pointer;
  }
  .list-item.static { cursor: default; }
  .list-item + .list-item,
  .module-item + .module-item,
  .channel-item + .channel-item {
    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
  }
  .module-item:hover,
  .channel-item:hover,
  .list-item:hover:not(.static) {
    background: color-mix(in srgb, var(--primary-text-color, #212121) 6%, transparent);
  }
  .module-item:focus-visible,
  .channel-item:focus-visible,
  .list-item:focus-visible {
    outline: none;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 10%, transparent);
  }
  .channel-item.active {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, transparent);
    color: var(--primary-text-color, #212121);
  }
  .channel-item.active .slot-badge {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent);
    color: var(--primary-color, #03a9f4);
  }
  .channel-list li + li {
    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
  }
  .channel-panel .channel-list {
    max-height: min(70vh, 720px);
    overflow-y: auto;
    scrollbar-width: thin;
  }
  .channel-item.disabled-channel .item-title { opacity: 0.65; }
  .item-icon {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 20%, transparent);
    color: var(--primary-color, #03a9f4);
  }
  .item-content {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
  }
  .item-title {
    font-size: 16px;
    font-weight: 400;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-secondary {
    font-size: 14px;
    color: var(--secondary-text-color, #727272);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-meta {
    flex: 0 0 auto;
    color: var(--secondary-text-color, #727272);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    background: var(--label-badge-background-color, var(--secondary-background-color, #e5e5e5));
    color: var(--secondary-text-color, #727272);
  }
  .chip.primary {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 16%, transparent);
    color: var(--primary-color, #03a9f4);
  }
  .slot-badge {
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    background: var(--secondary-background-color, #e5e5e5);
    color: var(--primary-text-color, #212121);
  }
  .module-grid { display: contents; }
  .modules-section { margin-bottom: 0; }
  .module-layout {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
    width: 100%;
  }
  .channel-panel {
    flex: 0 0 280px;
    width: 280px;
    margin-bottom: 0;
  }
  .actions-panel {
    flex: 1 1 0;
    min-width: 0;
    margin-bottom: 0;
  }
  .actions-panel .list,
  .actions-panel .empty-state,
  .actions-panel .loading-state {
    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
  }
  .channel-list { list-style: none; padding: 0; margin: 0; }
  .channel-list li { margin: 0; }
  .settings-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 16px;
    min-height: 64px;
    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
  }
  .settings-body { flex: 1 1 auto; min-width: 0; }
  .settings-title { font-size: 16px; }
  .settings-secondary {
    display: block;
    margin-top: 2px;
    font-size: 14px;
    color: var(--secondary-text-color, #727272);
  }
  .settings-row input,
  .settings-row select {
    flex: 0 1 220px;
    width: 220px;
    max-width: 50%;
    margin: 0;
  }
  .settings-row .toggle-wrap {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }
  label {
    display: block;
    margin-bottom: 16px;
    color: var(--primary-text-color, #212121);
  }
  label span, .field-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.1px;
    color: var(--input-label-ink-color, var(--secondary-text-color, #727272));
  }
  input, select {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    border-radius: var(--mdc-shape-small, 4px);
    border: 1px solid var(--input-idle-line-color, var(--divider-color, rgba(0, 0, 0, 0.38)));
    background: var(--mdc-text-field-fill-color, var(--input-fill-color, var(--secondary-background-color, #f5f5f5)));
    color: var(--input-ink-color, var(--primary-text-color, #212121));
    font: inherit;
    color-scheme: inherit;
  }
  input:hover, select:hover {
    border-color: var(--input-hover-line-color, var(--primary-text-color, #212121));
  }
  input:disabled, select:disabled {
    background: var(--input-disabled-fill-color, var(--input-fill-color, #fafafa));
    color: var(--input-disabled-ink-color, var(--disabled-text-color, #bdbdbd));
    border-color: var(--input-outlined-disabled-border-color, var(--divider-color, rgba(0, 0, 0, 0.06)));
  }
  input:focus-visible, select:focus-visible {
    outline: none;
    border-color: var(--primary-color, #03a9f4);
    box-shadow: 0 0 0 1px var(--primary-color, #03a9f4);
  }
  .toggle {
    appearance: none;
    width: 36px;
    height: 14px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 7px;
    background: var(--switch-unchecked-track-color, #9e9e9e);
    position: relative;
    cursor: pointer;
    flex: 0 0 auto;
  }
  .toggle::after {
    content: "";
    position: absolute;
    top: -3px;
    left: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--switch-unchecked-button-color, #fafafa);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    transition: transform 0.15s ease;
  }
  .toggle:checked {
    background: color-mix(in srgb, var(--switch-checked-track-color, var(--primary-color, #03a9f4)) 50%, transparent);
  }
  .toggle:checked::after {
    transform: translateX(16px);
    background: var(--switch-checked-button-color, var(--primary-color, #03a9f4));
  }
  .toggle:disabled { opacity: 0.38; cursor: not-allowed; }
  button {
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.1px;
    padding: 0 16px;
    min-height: 36px;
    border-radius: var(--ha-button-border-radius, 20px);
    border: none;
    background: var(--primary-color, #03a9f4);
    color: var(--text-primary-color, #fff);
    cursor: pointer;
  }
  button.primary {
    margin-top: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
  button.secondary {
    background: transparent;
    color: var(--primary-color, #03a9f4);
    border: 1px solid var(--primary-color, #03a9f4);
  }
  button.danger, button.link.danger {
    background: transparent;
    color: var(--error-color, #db4437);
    border: none;
  }
  button.link {
    background: none;
    border: none;
    color: var(--primary-color, #03a9f4);
    min-height: 36px;
    padding: 0 8px;
    border-radius: 4px;
  }
  button.icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    min-height: 48px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    flex: 0 0 auto;
  }
  button.icon-button:hover,
  button.link:hover {
    background: color-mix(in srgb, currentColor 10%, transparent);
  }
  button:disabled { opacity: 0.38; cursor: not-allowed; }
  .ha-alert {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px;
    margin-bottom: 16px;
    overflow: hidden;
  }
  .ha-alert::after {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.12;
    border-radius: 4px;
    pointer-events: none;
  }
  .ha-alert > svg { flex: 0 0 auto; margin-top: 2px; z-index: 1; }
  .ha-alert > div { z-index: 1; line-height: 1.4; }
  .ha-alert.warning { color: var(--warning-color, #f57c00); }
  .ha-alert.warning::after { background: var(--warning-color, #f57c00); }
  .ha-alert.warning > svg { color: var(--warning-color, #f57c00); }
  .ha-alert.error { color: var(--error-color, #db4437); }
  .ha-alert.error::after { background: var(--error-color, #db4437); }
  .ha-alert.error > svg { color: var(--error-color, #db4437); }
  .ha-alert.info { color: var(--info-color, #039be5); }
  .ha-alert.info::after { background: var(--info-color, #039be5); }
  .ha-alert.info > svg { color: var(--info-color, #039be5); }
  .loading-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 16px;
    color: var(--secondary-text-color, #727272);
    text-align: center;
  }
  .empty-state svg, .loading-state svg {
    color: var(--disabled-text-color, #bdbdbd);
  }
  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid color-mix(in srgb, var(--primary-color, #03a9f4) 20%, transparent);
    border-top-color: var(--primary-color, #03a9f4);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.32);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 10;
  }
  .dialog {
    width: min(560px, 100%);
    margin: 0;
    background: var(--ha-card-background, var(--card-background-color, #fff));
    color: var(--primary-text-color, #212121);
    border-radius: var(--ha-dialog-border-radius, 28px);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.24);
    overflow: hidden;
  }
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 24px 8px 8px 24px;
  }
  .dialog-header h2 {
    font-size: 24px;
    font-weight: 400;
  }
  .dialog-content { padding: 8px 24px 8px; }
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 24px 24px;
  }
  @media (max-width: 720px) {
    .module-layout { flex-direction: column; }
    .channel-panel { width: 100%; flex-basis: auto; }
    .settings-row {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      padding-bottom: 16px;
    }
    .settings-row input,
    .settings-row select {
      width: 100%;
      max-width: none;
    }
    .content { padding: 8px; }
  }
`;
