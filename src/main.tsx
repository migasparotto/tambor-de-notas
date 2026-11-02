import React from "react";
import ReactDOM from "react-dom/client";
import { loadPlacement, loadSettings } from "./domain/appData";
import App from "./ui/App";
import { logUnexpectedError, watchUnexpectedErrors } from "./ui/appLog";
import "./index.css";

watchUnexpectedErrors();

// Settings and the drum placement come first, so the drum is drawn at the saved size and spot from the start.
Promise.all([loadSettings(), loadPlacement()])
  .then(([{ settings, problems }, placement]) => {
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement, {
      onUncaughtError: (error) => logUnexpectedError("tela", error),
    }).render(
      <React.StrictMode>
        <App settings={settings} startupProblems={problems} initialPlacement={placement} />
      </React.StrictMode>,
    );
  })
  .catch((error: unknown) => logUnexpectedError("abertura da interface", error));
