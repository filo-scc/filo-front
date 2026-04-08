// src/routes/index.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Cliente from "@/pages/Clientes";
import PrivateRoute from "./PrivateRoute";
import { Layout } from "@/components/Layout";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Login (Totalmente Limpa) */}
        <Route path="/login" element={<Login />} />

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
        <Route
          path="/clientes"
          element={
            <PrivateRoute>
              <Cliente />
            </PrivateRoute>
          }
        ></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;