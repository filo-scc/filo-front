import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFaccoesByFabrico } from "../services/faccaoService";

const Faccoes = () => {
    const userString = localStorage.getItem("user");

    const [faccoes, setFaccoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dropdownOpenId, setDropdownOpenId] = useState(null);
    const navigate = useNavigate();

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

    useEffect(() => {
        const handleClickOutside = () => setDropdownOpenId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div className="p-6 pt-0 w-full">
            {/* Card Branco Principal - 1157px cravados */}
            <div className="bg-white p-8 rounded-[24px] shadow-sm w-full mx-auto">
                {/* CONTAINER DA TABELA - 1112px cravados */}
                <div className="w-full">
                    {/* CABEÇALHO CENTRALIZADO: Mudamos de w-full para w-[950px] e adicionamos mx-auto */}
                    <div className="w-full flex items-center justify-between mb-8 pl-6 font-['Outfit',_sans-serif]">
                        {/* ESQUERDA - Título */}
                        <div className="flex items-center gap-3">
                            <img
                                src="/maquina-costura-preta.png"
                                alt="Ícone de máquina de costura"
                                className="w-[30px] h-[30px]"
                            />
                            <h1 className="text-[30px] font-light text-gray-800">Facções</h1>
                        </div>

                        {/* DIREITA - Ações */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar"
                                    className="pl-4 pr-10 border border-[#D3D3D3] rounded-[16px] text-sm focus:outline-none focus:border-cyan-400 w-[196px] h-[39px]"
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

                            <button
                                onClick={() => navigate("/faccoes/novo")}
                                className="bg-[#A9E2F2] hover:bg-[#8acbdc] text-white w-[196px] h-[39px] rounded-[18.9px] flex items-center justify-center gap-2 text-sm font-normal transition-colors"
                            >
                                <img
                                    src="/maquina-costura-icone-branco.png"
                                    alt="Adicionar facção"
                                    className="w-[20px] h-[20px]"
                                />
                                Cadastrar facção
                            </button>
                        </div>
                    </div>

                    {/* Container da Tabela - Adicionado pb-16 e overflow-visible para o menu não cortar */}
                    <div className="w-full overflow-visible pb-16">
                        <div className="w-full border border-gray-200 rounded-xl bg-white">
                            <table className="w-full text-[16px] font-['Outfit',_sans-serif] font-light text-center">
                                <thead className="bg-[#D3EBF2] text-[#4696AD]">
                                    <tr className="h-[64px]">
                                        <th className="px-6 font-light first:rounded-tl-xl">
                                            Facção
                                        </th>
                                        <th className="px-6 font-light">Possui pedido</th>
                                        <th className="px-6 font-light">Consultar endereço</th>
                                        <th className="px-6 font-light">Contato</th>
                                        <th className="px-6 font-light last:rounded-tr-xl">
                                            Opções
                                        </th>
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
                                        faccoes.map((faccao, index) => {
                                            // Definimos se a linha é par (branca) ou ímpar (cinza)
                                            const isPar = index % 2 === 0;
                                            const isMenuOpen = dropdownOpenId === faccao.id;

                                            return (
                                                <tr
                                                    key={faccao.id}
                                                    // Aqui aplicamos a mesma lógica de hover de clientes
                                                    onClick={() =>
                                                        navigate(`/faccoes/${faccao.id}`)
                                                    }
                                                    className={`
                                                        h-[64px] transition-colors cursor-pointer border-b last:border-0
                                                        ${isMenuOpen ? "relative z-50" : "relative z-0"}
                                                        ${isPar ? "bg-white hover:bg-[#FBFBFB] hover:text-[#4696ad]" : "bg-[#F4F4F4] hover:bg-[#ededed] hover:text-[#4696ad]"}
                                                    `}
                                                >
                                                    <td className="px-6 text-[14px]">
                                                        {faccao.nome}
                                                    </td>
                                                    <td className="px-6 text-[14px]">
                                                        <div className="flex justify-center">
                                                            <span className="bg-gray-200 text-[#404040] w-[109px] h-[19px] flex items-center justify-center rounded-[10px] text-[12px] font-light">
                                                                {faccao.id % 2 !== 0
                                                                    ? "Sim"
                                                                    : "Não"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 text-[14px] hover:font-normal">
                                                        Endereço
                                                    </td>
                                                    <td className="px-6 text-[14px]">
                                                        {faccao.telefone || "Não informado"}
                                                    </td>
                                                    <td className="px-6">
                                                        <div className="relative flex justify-center items-center">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDropdownOpenId(
                                                                        isMenuOpen
                                                                            ? null
                                                                            : faccao.id,
                                                                    );
                                                                }}
                                                                className={`w-10 h-10 flex items-center justify-center transition-colors rounded-[8px] text-[#7B7D80] hover:bg-gray-200 ${isMenuOpen ? "bg-gray-200" : ""}`}
                                                            >
                                                                <svg
                                                                    className="w-5 h-5"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path d="M6 12a2 2 0 11-4 0 2 2 0 014 0zM14 12a2 2 0 11-4 0 2 2 0 014 0zM22 12a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                </svg>
                                                            </button>

                                                            {/* Dropdown Menu Visual */}
                                                            {isMenuOpen && (
                                                                <div
                                                                    className="absolute top-full right-0 mt-2 bg-white border border-gray-100 rounded-[12px] shadow-[0px_4px_12px_rgba(0,0,0,0.15)] w-[120px] flex flex-col z-[999] overflow-hidden"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDropdownOpenId(null);
                                                                    }}
                                                                >
                                                                    <button className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-[#7B7D80] hover:bg-gray-50 transition-colors w-full text-left">
                                                                        <svg
                                                                            className="w-[14px] h-[14px] text-gray-500"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="2"
                                                                            viewBox="0 0 24 24"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        >
                                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                        </svg>
                                                                        Editar
                                                                    </button>

                                                                    <div className="h-[1px] w-full bg-gray-100"></div>

                                                                    <button className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                                                                        <svg
                                                                            className="w-[14px] h-[14px] text-red-500"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="2"
                                                                            viewBox="0 0 24 24"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        >
                                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                        </svg>
                                                                        Excluir
                                                                    </button>
                                                                </div>
                                                            )}
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
    );
};

export default Faccoes;
