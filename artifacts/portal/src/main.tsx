import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { CompanyProvider } from "./context/CompanyContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <CompanyProvider>
    <AppProvider>
      <App />
    </AppProvider>
  </CompanyProvider>,
);
