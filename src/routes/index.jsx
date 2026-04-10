// src/routes/index.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Cliente from "@/pages/Clientes";
import PrivateRoute from "./PrivateRoute";
import { Layout } from "@/components/Layout";
import Faccoes from "@/pages/Faccoes";
import ClienteDetalhes from "../pages/ClienteDetalhes";

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
        <Route
          path="/clientes"
          element={
            <PrivateRoute>
              <Cliente />
            </PrivateRoute>
          }
        ></Route>

        <Route
          path="/clientes/:id"
          element={
            <PrivateRoute>
              <ClienteDetalhes />
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
