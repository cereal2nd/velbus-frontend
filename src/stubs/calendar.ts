import { reportStubbed } from "./stub-report";

class StubbedCalendarElement extends HTMLElement {
  public connectedCallback(): void {
    reportStubbed("calendars", `showing <${this.localName}>`);
  }
}

for (const tagName of ["ha-full-calendar", "ha-schedule-form"]) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, class extends StubbedCalendarElement {});
  }
}
