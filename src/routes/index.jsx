// src/routes/index.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import HomeTeste from "@/pages/HomeTeste"; 
import PrivateRoute from "./PrivateRoute";
import { Layout } from "@/components/Layout";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Login (Totalmente Limpa) */}
        <Route path="/login" element={<Login />} />

        {/* Rota de Teste (Pública, mas com a moldura do sistema) */}
        <Route
          path="/teste"
          element={
            <Layout>
              <HomeTeste />
            </Layout>
          }
        />

        {/* Rota Oficial (Protegida) */}
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
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;