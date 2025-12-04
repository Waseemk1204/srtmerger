import './index.css';
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </AuthProvider>
    </GoogleOAuthProvider>
);