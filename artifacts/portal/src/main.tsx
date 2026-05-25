import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { CompanyProvider } from "./context/CompanyContext";
import "./index.css";

// Swallow the harmless "ResizeObserver loop" notification that React Flow
// (and many other libraries with internal ResizeObservers) trigger. Without
// this, Vite's runtime-error overlay catches it with an empty stack and
// renders a full-page error modal even though the page is fine.
const swallowResizeObserverLoop = (message: unknown) => {
  if (typeof message !== "string") return false;
  return (
    message.includes("ResizeObserver loop completed with undelivered notifications") ||
    message.includes("ResizeObserver loop limit exceeded")
  );
};
window.addEventListener("error", (e) => {
  if (swallowResizeObserverLoop(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});
window.addEventListener("unhandledrejection", (e) => {
  const reason = e.reason as { message?: unknown } | string | undefined;
  const msg = typeof reason === "string" ? reason : reason?.message;
  if (swallowResizeObserverLoop(msg)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <CompanyProvider>
    <AppProvider>
      <App />
    </AppProvider>
  </CompanyProvider>,
);
