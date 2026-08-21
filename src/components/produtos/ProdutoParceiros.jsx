import React, { useCallback, useEffect, useMemo, useState } from "react";

import { getParceiroByProduto } from "../../services/produtoService";
import { ModalTableRowsSkeleton } from "../geral/Loading";

function normalizePreco(preco) {
    if (preco === null || preco === undefined || preco === "") return null;
    const parsed = Number(preco);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeParceiro(item) {
    if (!item) return null;

    if (item.parceiro) {
        return {
            id: item.parceiro.id,
            nome: item.parceiro.nome,
            preco: normalizePreco(item.preco),
            categoria: item.parceiro.categoria,
            possuiPedido: Boolean(item.possuiPedido ?? item.parceiro.possuiPedido ?? false),
        };
    }

    return {
        id: item.id,
        nome: item.nome,
        preco: normalizePreco(item.preco),
        categoria: item.categoria, // corrigido: item, não item.parceiro
        possuiPedido: Boolean(item.possuiPedido ?? false),
    };
}

const ProdutoParceiros = ({
    isOpen,
    onClose,
    produtoId,
    parceiros: parceirosProp = [],
    selectedParceiroIds = [],
    onSelectParceiro,
}) => {
    const [parceiros, setParceiros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [ordenacao, setOrdenacao] = useState("nome");

    const selectedIdsSet = useMemo(
        () => new Set((selectedParceiroIds || []).map((id) => String(id))),
        [selectedParceiroIds],
    );

    const filterSelected = useCallback(
        (list = []) =>
            list
                .map(normalizeParceiro)
                .filter(Boolean)
                .filter((item) => !selectedIdsSet.has(String(item.id))),
        [selectedIdsSet],
    );

    useEffect(() => {
        if (!isOpen) return;
        let ignorar = false;

        const fromProp = Array.isArray(parceirosProp) ? filterSelected(parceirosProp) : [];

        if (Array.isArray(parceirosProp) && parceirosProp.length > 0) {
            setParceiros(fromProp);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await getParceiroByProduto(produtoId);

                if (ignorar) return;

                const rawList = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.data)
                      ? response.data
                      : Array.isArray(response?.parceiros)
                        ? response.parceiros
                        : [];

                setParceiros(filterSelected(rawList));
            } catch (error) {
                if (ignorar) return;
                console.error("Erro ao buscar parceiros:", error);
                setParceiros([]);
            } finally {
                if (!ignorar) setLoading(false);
            }
        };

        fetchData();

        return () => {
            ignorar = true;
        };
    }, [isOpen, produtoId, parceirosProp, filterSelected]);

    const parceirosOrdenadas = useMemo(() => {
        return [...parceiros].sort((a, b) => {
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
    }, [parceiros, ordenacao]);

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
            <div
                className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-[999]"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onClose) onClose();
                }}
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
                                className="border border-[#898C8F] rounded-[10px] bg-white px-4 py-3 min-w-[180px] h-[39px] flex items-center justify-between text-[15px] font-Outfit text-[#7B7D80]"
                            >
                                <span className="text-[#7B7D80]">{getOrderLabel()}</span>

                                <svg
                                    className={`w-4 h-4 text-[#7B7D80] transition-transform duration-300 ${
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
                    <div className="rounded-[10px] overflow-hidden">
                        {/* HEADER */}
                        <div className="grid grid-cols-3 bg-[#C9EAF6] px-6 py-5 font-Outfit text-[#4F9DB8] !border-0">
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
                        {loading ? (
                            <ModalTableRowsSkeleton />
                        ) : parceirosOrdenadas.length === 0 ? (
                            <div className="border-x-[0.5px] border-b border-[#D9D9D9] rounded-b-[10px] bg-white py-12 text-center font-Outfit text-[16px] font-light text-[#898C8F]">
                                Nenhuma facção disponível.
                            </div>
                        ) : (
                            <div className="max-h-[360px] overflow-y-auto overflow-x-hidden scrollbar-sutil rounded-b-[10px]">
                                {parceirosOrdenadas.map((parceiro, index) => (
                                    <div
                                        key={parceiro.id}
                                        onClick={() => {
                                            onSelectParceiro?.(parceiro);
                                            onClose?.();
                                        }}
                                        className={`
                                        cursor-pointer
                                        grid grid-cols-3 px-6 py-5 items-center transition-colors border-x-[0.5px] border-[#D9D9D9]
                                        ${index % 2 === 0 ? "bg-white" : "bg-[#F4F4F4]"}
                                        ${
                                            index !== parceirosOrdenadas.length - 1
                                                ? ""
                                                : "border-b border-[#D9D9D9] rounded-b-[10px]"
                                        }
                                    `}
                                    >
                                        <div className="flex justify-center items-center text-center font-Outfit text-[16px] font-light text-[#404040] px-2">
                                            <span className="max-w-[180px] break-words">
                                                {parceiro.nome}
                                            </span>
                                        </div>

                                        <div className="flex justify-center font-Outfit text-[16px] font-light text-[#404040]">
                                            {parceiro.preco !== null
                                                ? `R$ ${Number(parceiro.preco).toFixed(2).replace(".", ",")}`
                                                : "-"}
                                        </div>

                                        <div className="flex justify-center">
                                            <span className="bg-[#D9D9D9] rounded-full w-[109px] h-[19px] text-[12px] font-Outfit font-light text-[#404040] inline-flex items-center justify-center">
                                                {parceiro.possuiPedido ? "Sim" : "Não"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProdutoParceiros;
