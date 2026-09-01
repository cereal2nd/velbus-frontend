import { reportStubbed } from "./stub-report";

class StubbedMediaElement extends HTMLElement {
  public connectedCallback(): void {
    reportStubbed("media browser", `showing <${this.localName}>`);
  }
}

for (const tagName of [
  "dialog-join-media-players",
  "dialog-media-manage",
  "dialog-media-player-browse",
  "ha-browse-media-manual",
  "ha-browse-media-tts",
  "ha-media-browser-thumbnail",
  "ha-media-manage-button",
  "ha-media-player-browse",
  "ha-media-upload-button",
]) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, class extends StubbedMediaElement {});
  }
}
