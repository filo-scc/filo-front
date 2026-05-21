/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { getFaccaoByProduto } from "../../services/produtoService";

function normalizePreco(preco) {
    if (preco === null || preco === undefined || preco === "") return null;
    const parsed = Number(preco);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeFaccao(item) {
    if (!item) return null;

    if (item.faccao) {
        return {
            id: item.faccao.id,
            nome: item.faccao.nome,
            preco: normalizePreco(item.preco),
            possuiPedido: Boolean(item.possuiPedido ?? item.faccao.possuiPedido ?? false),
        };
    }

    return {
        id: item.id,
        nome: item.nome,
        preco: normalizePreco(item.preco),
        possuiPedido: Boolean(item.possuiPedido ?? false),
    };
}

const ProdutoFaccoes = ({
    isOpen,
    onClose,
    produtoId,
    faccoes: faccoesProp = [],
    selectedFaccaoIds = [],
    onSelectFaccao,
}) => {
    const [faccoes, setFaccoes] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [ordenacao, setOrdenacao] = useState("nome");

    const selectedIdsSet = useMemo(
        () => new Set((selectedFaccaoIds || []).map((id) => String(id))),
        [selectedFaccaoIds],
    );

    const filterSelected = useCallback(
        (list = []) =>
            list
                .map(normalizeFaccao)
                .filter(Boolean)
                .filter((item) => !selectedIdsSet.has(String(item.id))),
        [selectedIdsSet],
    );

    useEffect(() => {
        if (!isOpen) return;

        const fromProp = Array.isArray(faccoesProp) ? filterSelected(faccoesProp) : [];

        if (Array.isArray(faccoesProp) && faccoesProp.length > 0) {
            setFaccoes(fromProp);
            return;
        }

        const fetchData = async () => {
            try {
                const response = await getFaccaoByProduto(produtoId);

                const rawList = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.data)
                      ? response.data
                      : Array.isArray(response?.faccoes)
                        ? response.faccoes
                        : [];

                setFaccoes(filterSelected(rawList));
            } catch (error) {
                console.error("Erro ao buscar facções:", error);
                setFaccoes([]);
            }
        };

        fetchData();
    }, [isOpen, produtoId, faccoesProp, filterSelected]);

    const faccoesOrdenadas = useMemo(() => {
        return [...faccoes].sort((a, b) => {
            if (ordenacao === "nome") {
                return (a.nome || "").localeCompare(b.nome || "");
            }

            if (ordenacao === "menor-preco") {
                return (a.preco ?? Infinity) - (b.preco ?? Infinity);
            }

            if (ordenacao === "maior-preco") {
                return (b.preco ?? -Infinity) - (a.preco ?? -Infinity);
            }

            return 0;
        });
    }, [faccoes, ordenacao]);

    const handleSelectOrder = (value) => {
        setOrdenacao(value);
        setDropdownOpen(false);
    };

    const getOrderLabel = () => {
        switch (ordenacao) {
            case "nome":
                return "Nome (A-Z)";
            case "menor-preco":
                return "Menor preço";
            case "maior-preco":
                return "Maior preço";
            default:
                return "Ordenar por";
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <style>
                {`
                .scrollbar-sutil::-webkit-scrollbar {
                    width: 4px;
                }

                .scrollbar-sutil::-webkit-scrollbar-track {
                    background: transparent;
                }

                .scrollbar-sutil::-webkit-scrollbar-thumb {
                    background-color: #d1d5db;
                    border-radius: 10px;
                }
            `}
            </style>

            <div
                className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-[999]"
                onClick={onClose}
            >
                <div
                    className="w-[900px] bg-white rounded-[24px] px-10 pt-10 pb-8 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <img
                                src="/maquina+-costura-icone-preto.png"
                                alt="Ícone máquina de costura"
                                className="w-8 h-8 object-contain"
                            />

                            <h2 className="text-[26px] font-Outfit font-light text-[#404040]">
                                Selecione a facção
                            </h2>
                        </div>

                        {/* DROPDOWN */}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="border border-[#D9D9D9] rounded-[12px] bg-white px-4 py-3 min-w-[180px] flex items-center justify-between text-[15px] font-Outfit text-[#404040]"
                            >
                                <span className="text-[#7B7D80]">{getOrderLabel()}</span>

                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                                        dropdownOpen ? "rotate-180" : ""
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            <div
                                className={`absolute top-14 right-0 w-[180px] bg-white border border-[#D9D9D9] rounded-[12px] overflow-hidden z-[999] shadow-md origin-top transition-all duration-300 ${
                                    dropdownOpen
                                        ? "opacity-100 scale-y-100 visible"
                                        : "opacity-0 scale-y-95 invisible pointer-events-none"
                                }`}
                            >
                                <div
                                    onClick={() => handleSelectOrder("nome")}
                                    className={`flex items-center border-l-[3px] px-4 py-[14px] cursor-pointer font-Outfit text-[15px] transition-colors ${
                                        ordenacao === "nome"
                                            ? "border-[#C4F042] bg-white text-[#707070]"
                                            : "border-transparent bg-white text-[#707070] hover:bg-[#F5F5F5]"
                                    }`}
                                >
                                    <div>Nome (A-Z)</div>
                                </div>

                                <div
                                    onClick={() => handleSelectOrder("menor-preco")}
                                    className={`flex items-center border-l-[3px] px-4 py-[14px] cursor-pointer font-Outfit text-[15px] transition-colors ${
                                        ordenacao === "menor-preco"
                                            ? "border-[#C4F042] bg-white text-[#707070]"
                                            : "border-transparent bg-white text-[#707070] hover:bg-[#F5F5F5]"
                                    }`}
                                >
                                    <div>Menor preço</div>
                                </div>

                                <div
                                    onClick={() => handleSelectOrder("maior-preco")}
                                    className={`flex items-center border-l-[3px] px-4 py-[14px] cursor-pointer font-Outfit text-[15px] transition-colors ${
                                        ordenacao === "maior-preco"
                                            ? "border-[#C4F042] bg-white text-[#707070]"
                                            : "border-transparent bg-white text-[#707070] hover:bg-[#F5F5F5]"
                                    }`}
                                >
                                    <div>Maior preço</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABELA */}
                    <div className="border border-[#EAEAEA] rounded-[16px] overflow-hidden">
                        {/* HEADER */}
                        <div className="grid grid-cols-3 bg-[#DFF5FF] px-6 py-5 font-Outfit text-[#4F9DB8]">
                            <div className="flex justify-center text-[16px] font-Outfit font-light text-[#4696AD] leading-none">
                                Facção
                            </div>

                            <div className="flex justify-center text-[16px] font-Outfit font-light text-[#4696AD] leading-none">
                                Preço
                            </div>

                            <div className="flex justify-center text-[16px] font-Outfit font-light text-[#4696AD] leading-none">
                                Possui pedido no momento
                            </div>
                        </div>

                        {/* ROWS */}
                        <div className="max-h-[360px] overflow-y-auto overflow-x-hidden scrollbar-sutil">
                            {faccoesOrdenadas.map((faccao, index) => (
                                <div
                                    key={faccao.id}
                                    onClick={() => {
                                        onSelectFaccao?.(faccao);
                                        onClose?.();
                                    }}
                                    className={`
                                        cursor-pointer
                                        grid grid-cols-3 px-6 py-5 items-center
                                        hover:bg-[#EEF9FF] transition-colors
                                        ${index % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}
                                        ${
                                            index !== faccoesOrdenadas.length - 1
                                                ? "border-b border-[#FAFAFA]"
                                                : ""
                                        }
                                    `}
                                >
                                    <div className="flex justify-center items-center text-center font-Outfit text-[16px] font-light text-[#404040] px-2">
                                        <span className="max-w-[180px] break-words">
                                            {faccao.nome}
                                        </span>
                                    </div>

                                    <div className="flex justify-center font-Outfit text-[16px] font-light text-[#404040]">
                                        {faccao.preco !== null
                                            ? `R$${Number(faccao.preco).toFixed(2).replace(".", ",")}`
                                            : "-"}
                                    </div>

                                    <div className="flex justify-center">
                                        <span className="bg-[#D9D9D9] rounded-full w-[109px] h-[19px] text-[12px] font-Outfit font-light text-[#404040] inline-flex items-center justify-center">
                                            {faccao.possuiPedido ? "Sim" : "Não"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProdutoFaccoes;
