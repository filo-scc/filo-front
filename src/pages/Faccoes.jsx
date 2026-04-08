import React, { useEffect, useState } from "react";
import { getFaccoesByFabrico } from "../services/faccaoService";

const Faccoes = () => {
  const userString = localStorage.getItem("user");

  const [faccoes, setFaccoes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fabricoId = userString ? JSON.parse(userString).fabrico_id : null;

  useEffect(() => {
    const fetchFaccoes = async () => {
      // Se não tiver fabricoId, não faz a requisição
      if (!fabricoId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getFaccoesByFabrico(fabricoId);
        setFaccoes(data);
      } catch (error) {
        console.error("Erro ao carregar facções", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaccoes();
  }, [fabricoId]);

  return (
    <div className="overflow-x-auto w-full flex justify-center py-4">
      {/* Card Branco Principal - 1157px cravados */}
      <div className="w-[1250px] bg-white rounded-[24px] py-8 px-4 flex flex-col items-center shadow-sm">
        {/* CONTAINER DA TABELA - 1112px cravados */}
        <div className="w-[1200px]">
          {/* CABEÇALHO CENTRALIZADO: Mudamos de w-full para w-[950px] e adicionamos mx-auto */}
          <div className="w-[1130px] mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 font-['Outfit',_sans-serif]">
            {/* Título com Ícone */}
            <div className="flex items-center gap-3">
              <img
                src="/maquina_costura_icone.png"
                alt="Ícone de máquina de costura"
                className="w-[30px] h-[30px]"
              />
              <h1 className="text-[30px] font-light text-gray-800">Facções</h1>
            </div>

            {/* Ações (Input e Botão) */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar"
                  className="pl-4 pr-10 border border-[#898C8F] rounded-full text-sm focus:outline-none focus:border-cyan-400 w-[196px] h-[39px]"
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <button className="bg-[#A9E2F2] hover:bg-[#8acbdc] text-white w-[196px] h-[39px] rounded-[18.9px] flex items-center justify-center gap-2 text-sm font-normal transition-colors">
                <img
                  src="/maquina_costura_icone_branco.png"
                  alt="Adicionar facção"
                  className="w-[20px] h-[20px]"
                />
                Cadastrar facção
              </button>
            </div>
          </div>

          {/* Container da Tabela */}
          <div className="w-full overflow-x-auto">
            <div className="w-full border border-gray-200 rounded-[24px] overflow-hidden">
              <table className="w-full text-[16px] font-['Outfit',_sans-serif] font-light text-center">
                <thead className="bg-[#D3EBF2] text-[#4696AD]">
                  <tr className="h-[64px]">
                    <th className="px-6 font-light">Facção</th>
                    <th className="px-6 font-light">Possui pedido</th>
                    <th className="px-6 font-light">Consultar endereço</th>
                    <th className="px-6 font-light">Contato</th>
                    <th className="px-6 font-light">Opções</th>
                  </tr>
                </thead>

                <tbody className="text-[#404040]">
                  {loading ? (
                    <tr className="h-[64px]">
                      <td colSpan="5" className="text-gray-400">
                        Carregando facções...
                      </td>
                    </tr>
                  ) : faccoes.length === 0 ? (
                    <tr className="h-[64px]">
                      <td colSpan="5" className="text-gray-400">
                        Nenhuma facção encontrada.
                      </td>
                    </tr>
                  ) : (
                    faccoes.map((faccao, index) => (
                      <tr
                        key={faccao.id}
                        className={`h-[64px] ${index % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#F4F4F4]"}`}
                      >
                        <td className="px-6">{faccao.nome}</td>
                        <td className="px-6">
                          <div className="flex justify-center">
                            <span className="bg-gray-200 text-[#404040] w-[109px] h-[19px] flex items-center justify-center rounded-[10px] text-[16px] font-light">
                              {faccao.id % 2 !== 0 ? "Sim" : "Não"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 cursor-pointer hover:font-normal">
                          Endereço
                        </td>
                        <td className="px-6">
                          {faccao.telefone || "Não informado"}
                        </td>
                        <td className="px-6">
                          <button className="text-[#404040] hover:opacity-70 flex justify-center w-full transition-opacity">
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 12a2 2 0 11-4 0 2 2 0 014 0zM14 12a2 2 0 11-4 0 2 2 0 014 0zM22 12a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Faccoes;
