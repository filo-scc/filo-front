import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { excluirParceiro, getParceirosByFabrico } from "../services/parceiroService";

import ModalExclusao from "../components/geral/ModalExclusao";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";
import MenuOpcoes from "../components/geral/MenuOpcoes";

const Parceiros = () => {
    const userString = localStorage.getItem("user");

    const [parceiros, setParceiros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dropdownOpenId, setDropdownOpenId] = useState(null);

    const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
    const [parceiroSelecionado, setParceiroSelecionado] = useState(null);

    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);

    const navigate = useNavigate();

    const fabricoId = userString ? JSON.parse(userString).fabrico_id : null;

    useEffect(() => {
        const fetchParceiros = async () => {
            if (!fabricoId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const data = await getParceirosByFabrico(fabricoId);
                setParceiros(data);
            } catch (error) {
                console.error("Erro ao carregar parceiros", error);
            } finally {
                setLoading(false);
            }
        };

        fetchParceiros();
    }, [fabricoId]);

    useEffect(() => {
        const handleClickOutside = () => setDropdownOpenId(null);

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    const handleEdit = (id) => {
        navigate(`/parceiros/editar/${id}`);
    };

    const abrirModalExclusao = (parceiro) => {
        setParceiroSelecionado(parceiro);
        setModalExclusaoAberto(true);
    };

    const handleConfirmarExclusao = async () => {
        if (!parceiroSelecionado) return;

        try {
            await excluirParceiro(parceiroSelecionado.id);

            setParceiros((prev) => prev.filter((c) => c.id !== parceiroSelecionado.id));

            setModalExclusaoAberto(false);
            setParceiroSelecionado(null);
            setModalConfirmacaoAberto(true);
        } catch (error) {
            console.error("Erro ao excluir parceiro:", error);
            alert("Erro ao excluir parceiro.");
        }
    };

    const formatarTelefone = (telefone) => {
        const numeros = String(telefone ?? "").replace(/\D/g, "");

        if (!numeros) return "-";

        if (numeros.length === 11) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 3)} ${numeros.slice(3, 7)}-${numeros.slice(7)}`;
        }

        if (numeros.length === 10) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
        }

        if (numeros.length === 9) {
            return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
        }

        if (numeros.length === 8) {
            return `${numeros.slice(0, 4)}-${numeros.slice(4)}`;
        }

        return telefone;
    };

    const renderTelefonePadronizado = (telefone) => {
        const telefoneFormatado = formatarTelefone(telefone);

        return (
            <span className="inline-flex w-[140px] justify-center whitespace-nowrap">
                {telefoneFormatado.split("").map((char, index) => (
                    <span
                        key={`${telefoneFormatado}-${index}`}
                        className="inline-block w-[8px] text-center"
                    >
                        {char === " " ? "\u00A0" : char}
                    </span>
                ))}
            </span>
        );
    };

    return (
        <div className="p-6 pt-0 mt-6 w-full">
            {/* Card Branco Principal */}
            <div className="bg-white p-8 rounded-[24px] shadow-sm w-full mx-auto">
                <div className="w-full">
                    {/* Header */}
                    <div className="w-full flex items-center justify-between mb-8 pl-6 font-['Outfit',_sans-serif]">
                        {/* Título */}
                        <div className="flex items-center gap-3">
                            <img
                                src="/maquina-costura-preta.png"
                                alt="Ícone de máquina de costura"
                                className="w-[30px] h-[30px]"
                            />

                            <h1 className="text-[30px] font-light text-gray-800">Parceiros</h1>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-4">
                            {/* Busca */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar"
                                    className="pl-4 pr-10 border border-[#D3D3D3] rounded-[16px] text-sm focus:outline-none w-[196px] h-[39px]"
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

                            {/* Cadastro de parceiro */}
                            <button
                                onClick={() => navigate("/parceiros/novo")}
                                className="bg-[#A9E2F2] hover:bg-[#8acbdc] text-white w-[196px] h-[39px] rounded-[18.9px] flex items-center justify-center gap-2 text-sm font-normal transition-colors"
                            >
                                <img
                                    src="/maquina-costura-icone-branco.png"
                                    alt="Adicionar parceiro"
                                    className="w-[20px] h-[20px]"
                                />
                                Cadastrar parceiro
                            </button>
                        </div>
                    </div>

                    {/* Tabela */}
                    <div className="w-full pb-16">
                        <div className="w-full border border-gray-200 rounded-xl overflow-hidden bg-[#D3EBF2]">
                            <table className="w-full border-separate border-spacing-0 text-[16px] font-['Outfit',_sans-serif] font-light text-center">
                                <thead className="bg-[#D3EBF2] text-[#4696AD]">
                                    <tr className="h-[64px]">
                                        <th className="px-6 font-light">Parceiro</th>
                                        <th className="px-6 font-light">Possui pedido</th>

                                        <th className="px-6 font-light"> Etapa de Produção </th>

                                        <th className="px-6 font-light">Consultar endereço</th>
                                        <th className="px-6 font-light">Contato</th>
                                        <th className="px-6 font-light">Opções</th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white text-[#404040]">
                                    {loading ? (
                                        <tr className="h-[64px]">
                                            <td colSpan="5" className="text-gray-400">
                                                Carregando parceiros...
                                            </td>
                                        </tr>
                                    ) : parceiros.length === 0 ? (
                                        <tr className="h-[64px]">
                                            <td colSpan="5" className="text-gray-400">
                                                Nenhum parceiro encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        parceiros.map((parceiro, index) => {
                                            const isPar = index % 2 === 0;

                                            const isMenuOpen = dropdownOpenId === parceiro.id;

                                            return (
                                                <tr
                                                    key={parceiro.id}
                                                    onClick={() =>
                                                        navigate(`/parceiros/${parceiro.id}`)
                                                    }
                                                    className={`
                                                        h-[64px] transition-colors cursor-pointer border-b last:border-0
                                                        ${isMenuOpen ? "relative z-50" : ""}
                                                        ${
                                                            isPar
                                                                ? "bg-white hover:bg-[#FBFBFB] hover:text-[#4696ad]"
                                                                : "bg-[#F4F4F4] hover:bg-[#ededed] hover:text-[#4696ad]"
                                                        }
                                                    `}
                                                >
                                                    <td className="px-6 text-[14px]">
                                                        {parceiro.nome}
                                                    </td>

                                                    <td className="px-6 text-[14px]">
                                                        <div className="flex justify-center">
                                                            <span className="bg-gray-200 text-[#404040] w-[109px] h-[19px] flex items-center justify-center rounded-[10px] text-[12px] font-light">
                                                                {parceiro.id % 2 !== 0
                                                                    ? "Sim"
                                                                    : "Não"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 text-[14px]">
                                                        {parceiro.categoria}
                                                    </td>

                                                    <td className="px-6 text-[14px] hover:font-normal">
                                                        Endereço
                                                    </td>

                                                    <td className="px-6 text-[14px]">
                                                        {renderTelefonePadronizado(
                                                            parceiro.telefone,
                                                        )}
                                                    </td>

                                                    <td className="px-6">
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <MenuOpcoes
                                                                onEdit={() =>
                                                                    handleEdit(parceiro.id)
                                                                }
                                                                onDelete={() =>
                                                                    abrirModalExclusao(parceiro)
                                                                }
                                                            />
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

            {/* Modal Exclusão */}
            <ModalExclusao
                isOpen={modalExclusaoAberto}
                onClose={() => setModalExclusaoAberto(false)}
                onConfirm={handleConfirmarExclusao}
                nomeItem={parceiroSelecionado?.nome}
                tipoItem="um parceiro"
            />

            {/* Modal confirmação */}
            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => setModalConfirmacaoAberto(false)}
                type="excluído"
            />
        </div>
    );
};

export default Parceiros;
