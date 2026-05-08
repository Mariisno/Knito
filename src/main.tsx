
  import { createRoot } from "react-dom/client";
  import { BrowserRouter } from "react-router";
  import { AuthProvider } from "./contexts/AuthContext.tsx";
  import { LanguageProvider } from "./contexts/LanguageContext.tsx";
  import App from "./App.tsx";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
