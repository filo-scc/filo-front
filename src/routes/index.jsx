import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Cliente from "@/pages/Clientes";
import PrivateRoute from "./PrivateRoute";
import { Layout } from "@/components/Layout";
import Parceiros from "@/pages/Parceiros";
import Produtos from "@/pages/Produtos";
import ClienteDetalhes from "../pages/ClienteDetalhes";
import ClientesCadastrar from "../pages/ClientesCadastrar";
import ClientesEditar from "../pages/ClientesEditar";
import ParceiroDetalhes from "../pages/ParceiroDetalhes";
import ParceiroEditar from "../pages/ParceiroEditar";
import ProdutoDetalhes from "../pages/ProdutoDetalhes";
import ProdutoEditar from "../pages/ProdutoEditar";
import ParceiroCadastro from "../pages/ParceiroCadastro";
import ProdutoCadastar from "../pages/ProdutoCadastrar";
import PedidosCadastar from "../pages/PedidosCadastrar";
import Pedidos from "../pages/Pedidos";
import Aviamentos from "../pages/Aviamentos";
import Tecidos from "../pages/Tecidos";

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
                    path="/produtos/cadastar"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <ProdutoCadastar />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/produtos/editar/:id"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <ProdutoEditar />
                            </Layout>
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
                    path="/parceiros"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <Parceiros />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/parceiros/:id"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <ParceiroDetalhes />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/parceiros/novo"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <ParceiroCadastro />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                {/* Rota de Edição de Parceiro */}
                <Route
                    path="/parceiros/editar/:id"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <ParceiroEditar />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/pedidos"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <Pedidos />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/pedidos/cadastrar"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <PedidosCadastar />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/pedidos/editar/:id"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <div className="flex justify-center items-center h-full text-gray-500 text-2xl font-light">
                                    Página de edição de pedido em construção...
                                </div>
                            </Layout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/aviamentos"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <Aviamentos />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/aviamentos/editar/:id"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <div className="flex justify-center items-center h-full text-gray-500 text-2xl font-light">
                                    Página de edição de aviamento em construção...
                                </div>
                            </Layout>
                        </PrivateRoute>
                    }
                />

                {/* Telas provisórias */}

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
                    path="/tecidos"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <Tecidos />
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
