// src/routes/index.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Cliente from "@/pages/Clientes";
import PrivateRoute from "./PrivateRoute";
import { Layout } from "@/components/Layout";
import Faccoes from "@/pages/Faccoes";
import ClienteDetalhes from "../pages/ClienteDetalhes";
import FaccaoDetalhes from "../pages/FaccaoDetalhes";

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
        ></Route>

        <Route
          path="/faccoes/:id"
          element={
            <PrivateRoute>
              <Layout>
                <FaccaoDetalhes />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Telas provisórias com a header + sidebar por enquanto que não são implementadas */}
        <Route
          path="/pedidos"
          element={
            <PrivateRoute>
              <Layout>
                <div className="flex justify-center items-center h-full text-gray-500 text-2xl font-light">
                  Página de Pedidos em construção...
                </div>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/produtos"
          element={
            <PrivateRoute>
              <Layout>
                <div className="flex justify-center items-center h-full text-gray-500 text-2xl font-light">
                  Página de Produtos em construção...
                </div>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/estoque"
          element={
            <PrivateRoute>
              <Layout>
                <div className="flex justify-center items-center h-full text-gray-500 text-2xl font-light">
                  Página de Estoque em construção...
                </div>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/financeiro"
          element={
            <PrivateRoute>
              <Layout>
                <div className="flex justify-center items-center h-full text-gray-500 text-2xl font-light">
                  Página do Financeiro em construção...
                </div>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracoes"
          element={
            <PrivateRoute>
              <Layout>
                <div className="flex justify-center items-center h-full text-gray-500 text-2xl font-light">
                  Página de Configurações em construção...
                </div>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
