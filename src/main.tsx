import React from "react";
import ReactDOM from "react-dom/client";
import { loadSettings } from "./domain/appData";
import App from "./ui/App";
import "./index.css";

// Settings come first, so the drum is drawn at the saved size from the start.
void loadSettings().then(({ settings, problems }) => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App settings={settings} startupProblems={problems} />
    </React.StrictMode>,
  );
});
