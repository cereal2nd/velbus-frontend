import { css } from "lit";

export const velbusPageStyles = css`
  :host {
    --app-header-background-color: var(--sidebar-background-color);
    --app-header-border-bottom: 1px solid var(--divider-color);
    --app-header-text-color: var(--sidebar-text-color);
  }
  .container {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-4);
    margin-inline: auto;
    max-width: 1040px;
    padding-block-end: calc(
      var(--ha-space-8) + var(--safe-area-inset-bottom, 0px)
    );
    padding-block-start: var(--ha-space-4);
    padding-inline: var(--ha-space-4);
    width: 100%;
  }
  @media (max-width: 800px) {
    .container {
      padding-block-start: var(--ha-space-2);
      padding-inline: var(--ha-space-3);
    }
  }
`;

export const velbusIconWellStyles = css`
  .icon-background {
    align-items: center;
    background-color: var(--icon-background-color, var(--primary-color));
    border-radius: var(--ha-border-radius-circle);
    color: #fff;
    display: flex;
    flex-shrink: 0;
    height: 40px;
    justify-content: center;
    width: 40px;
  }
  .icon-background ha-svg-icon {
    color: #fff;
    display: block;
    height: 24px;
    padding: 0;
    width: 24px;
  }
  .icon-background.small {
    height: 36px;
    width: 36px;
  }
  .icon-background.small ha-svg-icon {
    height: 20px;
    width: 20px;
  }
`;

export const velbusEmptyStateStyles = css`
  .empty-state {
    align-items: center;
    color: var(--secondary-text-color);
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-2);
    justify-content: center;
    padding-block: var(--ha-space-12);
    padding-inline: var(--ha-space-4);
    text-align: center;
  }
  .empty-state ha-svg-icon {
    color: var(--disabled-color, var(--disabled-text-color));
    height: 64px;
    margin-block-end: var(--ha-space-2);
    width: 64px;
  }
  .empty-state p {
    font-size: var(--ha-font-size-l);
    margin: 0;
  }
  .empty-state small {
    font-size: var(--ha-font-size-m);
    max-width: 360px;
  }
`;
