import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import FloatingLabelInput from "../components/FloatingLabelInput";
import { getClientes } from "../services/clientesService";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const navigate = useNavigate();

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
              error:
                "Acesso negado. Administradores não podem acessar esta área.",
            },
          });
        }
      } finally {
        setLoading(false);
      }
    };

    carregarClientes();
  }, [navigate]);

  return (
    <Layout>
      <div className="p-6 pt-0 w-full">
        <div className="bg-white p-8 rounded-[24px] shadow-sm w-full mx-auto">
          <div className="w-full">
            <div className="w-full flex items-center justify-between mb-8 pl-6 font-['Outfit',_sans-serif]">
              <div className="flex items-center gap-3">
                <img
                  src="/star.png"
                  alt="Ícone de clientes"
                  className="w-[30px] h-[30px]"
                />
                <h1 className="text-[30px] font-light text-gray-800">
                  Clientes
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <FloatingLabelInput
                  label="Buscar"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-[196px]"
                  endAdornment={
                    <svg
                      className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  }
                />

                <button className="bg-[#A9E2F2] hover:bg-[#8acbdc] text-white w-[196px] h-[39px] rounded-[18.9px] flex items-center justify-center gap-2 text-sm font-normal transition-colors">
                  <img
                    src="/add-star.png"
                    alt="Adicionar cliente"
                    className="w-[20px] h-[20px]"
                  />
                  Cadastrar cliente
                </button>
              </div>
            </div>

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
