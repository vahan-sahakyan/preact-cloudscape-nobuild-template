import "./src/lib/cloudscape-tokens.js";
import "./src/state/settings-signals.js";
import { render } from "preact";
import { html } from "htm/preact";

const root = document.getElementById("app");

// the app module graph waits on the json fetch in src/data/api.js, the boot message shows meanwhile
import("./src/app.js")
  .then(({ App }) => render(html`<${App} />`, root))
  .catch((error) => {
    const boot = root.querySelector(".boot");
    boot.textContent = `Could not load the app (${error.message}).`;
    console.error(error);
  });
