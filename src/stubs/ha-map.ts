import { reportStubbed } from "./stub-report";

class StubbedMapElement extends HTMLElement {
  public connectedCallback(): void {
    reportStubbed("maps", `showing <${this.localName}>`);
  }
}

for (const tagName of ["ha-map", "ha-locations-editor"]) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, class extends StubbedMapElement {});
  }
}

export const MAP_CARD_MARKER_LABEL_MODES = [
  "name",
  "state",
  "attribute",
  "icon",
];
