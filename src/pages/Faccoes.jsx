import React, { useEffect, useState } from "react";
import { getFaccoesByFabrico } from "../services/faccaoService";

const Faccoes = () => {
  const [faccoes, setFaccoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulando o ID do fabrico logado (ajuste depois para pegar do contexto do usuário)
  const fabricoId = 1;

  useEffect(() => {
    const fetchFaccoes = async () => {
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
    // Container principal simulando o fundo da aplicação com a fonte Outfit
    <div className="w-full min-h-screen bg-[#F0F8FA] p-8 font-['Outfit',_sans-serif] font-light text-gray-700 flex justify-center">
      {/* Card Branco Principal - Radius 24px e Largura máxima próxima aos 1157px do design */}
      <div className="w-full max-w-[1157px] bg-white rounded-[24px] p-8 shadow-sm">
        {/* Cabeçalho do Card (Título, Busca e Botão) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
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
            {/* Input "Buscar" - 196x39 px */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar"
                className="pl-4 pr-10 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-cyan-400 w-[196px] h-[39px]"
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

            {/* Botão "Cadastrar facção" - 196x39 px, Cor A9E2F2, Radius 18.9px */}
            <button className="bg-[#A9E2F2] hover:bg-[#8acbdc] text-white w-[196px] h-[39px] rounded-[18.9px] flex items-center justify-center gap-2 text-sm font-normal transition-colors">
              <img 
                src="/maquina_costura_icone.png" 
                alt="Adicionar facção" 
                className="w-[20px] h-[20px]" 
              />
              Cadastrar facção
            </button>
          </div>
        </div>

        {/* Container da Tabela para alinhar ao centro e respeitar os 1112px */}
        <div className="overflow-x-auto flex justify-center">
          {/* Tabela de Dados - Largura 1112px */}
          <table className="w-full max-w-[1112px] text-sm text-center">
            {/* Cabeçalho da Tabela */}
            <thead className="bg-[#D3EBF2] text-[#4696AD] text-[16px]">
              <tr className="h-[64px]"> 
                {/* Trocamos font-medium por font-light em todos */}
                <th className="px-6 font-light rounded-tl-[24px]">Facção</th>
                <th className="px-6 font-light">Possui pedido</th>
                <th className="px-6 font-light">Consultar endereço</th>
                <th className="px-6 font-light">Contato</th>
                <th className="px-6 font-light rounded-tr-[24px]">Opções</th>
              </tr>
            </thead>

            {/* Corpo da Tabela */}
            <tbody>
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
                    // Altura 64px e cores intercaladas (FFFFFF e F4F4F4)
                    className={`h-[64px] ${index % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#F4F4F4]"}`}
                  >
                    <td className="px-6">{faccao.nome}</td>

                    <td className="px-6">
                      <div className="flex justify-center">
                        {/* Possui pedido - Radius 10 */}
                        <span className="bg-gray-200 text-gray-600 px-4 py-1 rounded-[10px] text-xs font-medium">
                          {faccao.id % 2 !== 0 ? "Sim" : "Não"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 cursor-pointer text-gray-700 hover:text-black">
                      Endereço
                    </td>

                    <td className="px-6">
                      {faccao.telefone || "Não informado"}
                    </td>

                    <td className="px-6">
                      <button className="text-gray-400 hover:text-gray-600 flex justify-center w-full">
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
  );
};

export default Faccoes;
