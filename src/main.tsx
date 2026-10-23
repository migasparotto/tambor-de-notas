import React from "react";
import ReactDOM from "react-dom/client";
import { loadPlacement, loadSettings } from "./domain/appData";
import App from "./ui/App";
import "./index.css";

// Settings and the drum placement come first, so the drum is drawn at the saved size and spot from the start.
void Promise.all([loadSettings(), loadPlacement()]).then(([{ settings, problems }, placement]) => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App settings={settings} startupProblems={problems} initialPlacement={placement} />
    </React.StrictMode>,
  );
});
