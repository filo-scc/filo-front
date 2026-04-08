// src/routes/index.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import PrivateRoute from "./PrivateRoute";
import { Layout } from "@/components/Layout";
import Faccoes from "@/pages/Faccoes";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Login (Totalmente Limpa) */}
        <Route path="/login" element={<Login />} />

        {/* Rota Oficial (Protegida) */}
        {/* Envolvendo a Home */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Layout>
                <Home />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Envolvendo a página de Facções */}
        <Route 
          path="/faccoes" 
          element={
            <PrivateRoute>
              <Layout>
                <Faccoes />
              </Layout>
            </PrivateRoute>
          } 
        />
        
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;