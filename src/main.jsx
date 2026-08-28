import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { MonthProvider } from "./context/MonthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <MonthProvider>
            <App />
          </MonthProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
