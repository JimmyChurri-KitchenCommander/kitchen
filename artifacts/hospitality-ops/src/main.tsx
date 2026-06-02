import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./providers/ThemeProvider";
import "./index.css";

console.log("🚨 ACTIVE FILE LOADED:", import.meta.url);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker unavailable — offline support disabled
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
