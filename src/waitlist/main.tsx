import React from "react";
import { createRoot } from "react-dom/client";
import { WaitlistApp } from "./WaitlistApp";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <WaitlistApp />
    </React.StrictMode>
  );
}
