import "@ha/resources/roboto";
import "./velbus-panel";

const styleEl = document.createElement("style");
styleEl.innerHTML = `
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
body {
  font-family: Roboto, sans-serif;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  font-weight: 400;
  background-color: var(--primary-background-color, #fafafa);
  color: var(--primary-text-color, #212121);
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: var(--primary-background-color, #111111);
    color: var(--primary-text-color, #e1e1e1);
  }
}
`;
document.head.appendChild(styleEl);
