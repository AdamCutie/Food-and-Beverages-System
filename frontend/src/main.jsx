import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx"; // <-- 1. IMPORT
import { SocketProvider } from "./context/SocketContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
 // <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* <-- 2. WRAP YOUR APP */}
        <SocketProvider>
        <App />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
 // </React.StrictMode>
);