import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "@/context/AuthContext";
import { setupPreventButtonDoubleClick } from "@/utils/preventButtonDoubleClick";
import "./styles/global.css";

setupPreventButtonDoubleClick();

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>,
);
