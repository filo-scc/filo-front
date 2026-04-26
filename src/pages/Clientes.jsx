import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { getClientes } from "../services/clientesService";

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState("");
    const navigate = useNavigate();

    // Estados para o Modal de Exclusão
    const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);

    // Estado para o Modal de Confirmação de Exclusão
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);

    useEffect(() => {
        const carregarClientes = async () => {
            const userString = localStorage.getItem("user");
            const usuarioLogado = userString ? JSON.parse(userString) : null;
            const fabricoId = usuarioLogado?.fabrico_id;

            if (!fabricoId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const dados = await getClientes(fabricoId);
                setClientes(dados);
            } catch (erro) {
                console.error("Erro ao carregar clientes:", erro);

                if (erro?.response?.status === 403) {
                    navigate("/", {
                        replace: true,
                        state: {
                            error: "Acesso negado. Administradores não podem acessar esta área.",
                        },
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        carregarClientes();
    }, [navigate]);

    // Funções de Ação do Menu
    const handleEdit = (id) => {
        navigate(`/editar-cliente/${id}`);
    };

    const abrirModalExclusao = (cliente) => {
        setClienteSelecionado(cliente);
        setModalExclusaoAberto(true);
    };

    const handleConfirmarExclusao = async () => {
        if (!clienteSelecionado) return;

            <div className="w-full overflow-x-auto">
              <div className="w-full border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-[16px] font-['Outfit',_sans-serif] font-light text-center">
                  <thead className="bg-[#D3EBF2] text-[#4696AD]">
                    <tr className="h-[64px]">
                      <th className="px-6 font-light">Cliente</th>
                      <th className="px-6 font-light">Responsável</th>
                      <th className="px-6 font-light">Contato</th>
                      <th className="px-6 font-light">Status</th>
                      <th className="px-6 font-light">Opções</th>
                    </tr>
                  </thead>

                  <tbody className="text-[#404040]">
                    {loading ? (
                      <tr className="h-[64px]">
                        <td colSpan="5" className="text-gray-400">
                          Carregando clientes...
                        </td>
                      </tr>
                    ) : clientes.length === 0 ? (
                      <tr className="h-[64px]">
                        <td colSpan="5" className="text-gray-400">
                          Nenhum cliente encontrado.
                        </td>
                      </tr>
                    ) : (
                      clientes.map((cliente, index) => {
                        // Definimos se a linha é par (branca) ou ímpar (cinza)
                        const isPar = index % 2 === 0;

                        return (
                          <tr
                            key={cliente.id}
                            onClick={() => navigate(`/clientes/${cliente.id}`)}
                            className={`
        h-[64px] transition-colors cursor-pointer border-b last:border-0
        ${isPar ? "bg-white hover:bg-[#FBFBFB] hover:text-[#4696ad]" : "bg-[#F4F4F4] hover:bg-[#ededed] hover:text-[#4696ad]"}
      `}
                          >
                            <td
                              title="Ver detalhes"
                              className="px-6 text-[14px]"
                            >
                              {cliente.nome}
                            </td>
                            <td
                              title="Ver detalhes"
                              className="px-6 text-[14px]"
                            >
                              {cliente.responsavel}
                            </td>
                            <td
                              title="Ver detalhes"
                              className="px-6 text-[14px]"
                            >
                              {cliente.telefone}
                            </td>

                            <td title="Ver detalhes" className="px-6">
                              <div className="flex justify-center">
                                <span
                                  className={`w-[109px] h-[19px] flex items-center justify-center rounded-[10px] text-[12px] font-light ${
                                    cliente.status
                                      ? "bg-[#B4D64E] text-white"
                                      : "bg-gray-200 text-[#404040]"
                                  }`}
                                >
                                  {cliente.status ? "Ativo" : "Inativo"}
                                </span>
                              </div>
                            </td>

                            <td className="px-6">
                              <div className="flex justify-center items-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Opções");
                                  }}
                                  /* Se a linha é Branca, o botão no hover fica Cinza. 
               Se a linha é Cinza, o botão no hover fica Branco. */
                                  className={`
              w-10 h-10 flex items-center justify-center transition-colors rounded-[8px]
            `}
                                >
                                  <img
                                    src="/tres-pontos.png"
                                    className="w-5 h-5 object-contain opacity-60"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
