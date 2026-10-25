import "./src/lib/cloudscape-tokens.js";
import "./src/state/settings-signals.js";
import { render } from "preact";
import { html } from "htm/preact";
import { App } from "./src/app.js";

render(html`<${App} />`, document.getElementById("app"));
