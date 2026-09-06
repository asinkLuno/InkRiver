import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/literata/opsz.css";
import { App } from "./App";
import "./app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
