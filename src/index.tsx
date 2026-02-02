import './index.css';
import React from "react";
import { render } from "react-dom";
import { App } from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { SalesProvider } from "./contexts/SalesContext";

render(
  <AuthProvider>
    <SalesProvider>
      <App />
    </SalesProvider>
  </AuthProvider>,
  document.getElementById("root")
);