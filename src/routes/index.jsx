import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import PrivateRoute from "./PrivateRoute";
import Faccoes from "@/pages/Faccoes";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Envolvendo a Home */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } 
        />

        {/* Envolvendo a página de Facções */}
        <Route 
          path="/faccoes" 
          element={
            <PrivateRoute>
              <Faccoes />
            </PrivateRoute>
          } 
        />
        
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;   