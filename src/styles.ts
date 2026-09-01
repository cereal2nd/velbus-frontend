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
    padding-block-end: calc(
      var(--ha-space-8) + var(--safe-area-inset-bottom, 0px)
    );
    padding-block-start: var(--ha-space-4);
    padding-inline: var(--ha-space-4);
    width: 100%;
  }
  .container--dashboard {
    max-width: 2000px;
  }
  .container--module {
    max-width: 1400px;
  }
  @media (max-width: 800px) {
    .container {
      padding-block-start: var(--ha-space-2);
      padding-inline: var(--ha-space-3);
    }
  }
`;
