import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Cliente from "@/pages/Clientes";
import PrivateRoute from "./PrivateRoute";
import { Layout } from "@/components/Layout";
import Faccoes from "@/pages/Faccoes";
import Produtos from "@/pages/Produtos";
import ClienteDetalhes from "../pages/ClienteDetalhes";
import ClientesCadastrar from "../pages/ClientesCadastrar";
import ClientesEditar from "../pages/ClientesEditar";
import FaccaoDetalhes from "../pages/FaccaoDetalhes";
import FaccaoEditar from "../pages/FaccaoEditar";
import ProdutoDetalhes from "../pages/ProdutoDetalhes";
import FaccaoCadastro from "../pages/FaccaoCadastro";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                {/* Rotas Protegidas */}
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
                />
                <Route
                    path="/clientes/cadastrar"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <ClientesCadastrar />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/clientes/editar/:id"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <ClientesEditar />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/clientes/:id"
                    element={
                        <PrivateRoute>
                            <ClienteDetalhes />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/produtos/:id"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <ProdutoDetalhes />
                            </Layout>
                        </PrivateRoute>
                    }
                />

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
                <Route
                    path="/faccoes/novo"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <FaccaoCadastro />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                {/* Rota de Edição de Facção */}
                <Route
                    path="/faccoes/editar/:id"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <FaccaoEditar />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                {/* Telas provisórias */}
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
                                <Produtos />
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
