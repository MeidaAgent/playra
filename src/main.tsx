import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { CONFIG } from "lib/config";
import { PortalApp } from "features/portal/PortalApp";
import "lib/firebase";

// Main Game
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Fatal: '#root' container element not found in DOM");
  }
  const root = createRoot(rootElement);
  if (CONFIG.PORTAL_APP) {
    root.render(<PortalApp />);
  } else {
    root.render(<App />);
  }
} catch (error: any) {
  // eslint-disable-next-line no-console
  console.error("[Playra Fatal Mount Error]", error);
  window.dispatchEvent(new ErrorEvent("error", { error, message: error?.message || String(error) }));
}
