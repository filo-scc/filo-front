import React, { useState, useEffect, useCallback } from "react";
import { getTecidosByFabrico } from "../services/produtoService";
import { TecidosTableSkeleton } from "../components/tecidos/TecidosTableSkeleton";
import { CadastrarTecidoModal } from "../components/produtos/CadastrarTecidoModal";
import MenuOpcoes from "../components/geral/MenuOpcoes";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";
import ModalExclusao from "../components/geral/ModalExclusao";
import { EditarTecidoModal } from "../components/tecidos/EdicaoTecidoModal";
import { deletarTecido } from "../services/tecidoService";

// Mapeamento visual das unidades de medida
const UNIDADES_MEDIDA_MAP = {
    METRO: "Metro (m)",
    CENTIMETRO: "Centímetro (cm)",
    GRAMA: "Grama (g)",
    QUILOGRAMA: "Quilograma (kg)",
    UNIDADE: "Unidade (un)",
    PAR: "Par (pr)",
};

const formatarUnidade = (unidade) => {
    if (!unidade) return "-";
    return UNIDADES_MEDIDA_MAP[unidade.toUpperCase()] || unidade;
};

export default function Tecidos() {
    const userString = localStorage.getItem("user");

    const [tecidos, setTecidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Estados para controle dos Modais
    const [isModalCadastrarOpen, setIsModalCadastrarOpen] = useState(false);
    const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
    const [isModalExclusaoOpen, setIsModalExclusaoOpen] = useState(false);
    const [isModalConfirmacaoOpen, setIsModalConfirmacaoOpen] = useState(false);
    const [tecidoSelecionado, setTecidoSelecionado] = useState(null);

    const fabricoId = userString ? JSON.parse(userString).fabrico_id : null;

    const fetchTecidos = useCallback(async () => {
        if (!fabricoId) return;
        setLoading(true);
        try {
            const dados = await getTecidosByFabrico(fabricoId);
            setTecidos(Array.isArray(dados) ? dados : []);
        } catch (error) {
            console.error("Erro ao carregar tecidos:", error);
        } finally {
            setLoading(false);
        }
    }, [fabricoId]);

    useEffect(() => {
        fetchTecidos();
    }, [fetchTecidos]);

    // Ações do usuário
    const handleAbrirCadastro = () => {
        setTecidoSelecionado(null);
        setIsModalCadastrarOpen(true);
    };

    const handleEdit = (tecido) => {
        setTecidoSelecionado(tecido);
        setIsModalEditarOpen(true);
    };

    const abrirModalExclusao = (tecido) => {
        setTecidoSelecionado(tecido);
        setIsModalExclusaoOpen(true);
    };

    const handleConfirmarExclusao = async () => {
        if (!tecidoSelecionado) return;
        try {
            await deletarTecido(tecidoSelecionado.id);
            setIsModalExclusaoOpen(false);
            setIsModalConfirmacaoOpen(true);
            fetchTecidos();
        } catch (error) {
            console.error("Erro ao excluir tecido:", error);
        }
    };

    // Filtra os tecidos pelo termo de busca
    const filteredTecidos = tecidos.filter((tecido) =>
        tecido.nome?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="p-6 pt-0 mt-6 font-['Outfit',_sans-serif]">
            {/* Container Branco Principal */}
            <div className="bg-white rounded-[24px] shadow-sm min-h-[400px] w-full overflow-hidden pb-8">
                {/* Cabeçalho */}
                <div className="p-8 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 pl-[21px]">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <img src="/tecidos-ativado.png" alt="" className="w-7 h-7" />
                            <h1 className="text-[30px] font-light text-gray-800">Tecidos</h1>
                        </div>

                        <div className="flex items-center gap-4 flex-1 justify-end min-w-[300px]">
                            {/* Input de Buscar */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar"
                                    className="pl-4 pr-10 border border-[#D3D3D3] rounded-[16px] text-[14px] focus:outline-none w-[196px] h-[39px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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

                            {/* Botão Cadastrar Tecido */}
                            <button
                                onClick={handleAbrirCadastro}
                                className="bg-[#A9E2F2] hover:bg-[#A2DCED] text-[#4696AD] w-[196px] h-[39px] rounded-[18.9px] flex items-center justify-center gap-2 text-sm font-normal transition-colors cursor-pointer"
                            >
                                <img
                                    src="/add-fabric-pin-azul.png"
                                    alt="Adicionar tecido"
                                    className="w-[20px] h-[20px]"
                                />
                                Cadastrar tecido
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabela de Tecidos */}
                <div className="px-8">
                    <div className="rounded-[16px] overflow-hidden border border-[#E8E8E8]">
                        <table className="w-full text-center border-collapse">
                            <thead className="bg-[#CBEBF6] h-[48px] text-[#4696AD] font-normal text-[14px]">
                                <tr>
                                    <th className="font-normal py-3 px-6">Nome</th>
                                    <th className="font-normal py-3 px-6">Un. de medida</th>
                                    <th className="font-normal py-3 px-6">Preço</th>
                                    <th className="font-normal py-3 px-6">Opções</th>
                                </tr>
                            </thead>
                            <tbody className="text-[14px] text-gray-700">
                                {loading ? (
                                    <TecidosTableSkeleton rows={5} />
                                ) : filteredTecidos.length > 0 ? (
                                    filteredTecidos.map((tecido, index) => {
                                        const isPar = index % 2 === 0;
                                        const isLast = index === filteredTecidos.length - 1;
                                        const valorNumerico = Number(tecido.custo_unitario);

                                        return (
                                            <tr
                                                key={tecido.id || index}
                                                className={`h-[60px] border-b border-[#E8E8E8] last:border-0 ${
                                                    isPar ? "bg-white" : "bg-[#F4F4F4]"
                                                }`}
                                            >
                                                <td className="px-6 py-4 font-normal">
                                                    {tecido.nome}
                                                </td>
                                                <td className="px-6 py-4 font-normal">
                                                    {/* Exibe o texto formatado */}
                                                    {formatarUnidade(tecido.unidade_de_medida)}
                                                </td>
                                                <td className="px-6 py-4 font-normal">
                                                    {!isNaN(valorNumerico) &&
                                                    tecido.custo_unitario !== null
                                                        ? valorNumerico.toLocaleString("pt-BR", {
                                                              style: "currency",
                                                              currency: "BRL",
                                                          })
                                                        : `R$ ${tecido.custo_unitario || "0,00"}`}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center items-center">
                                                        <MenuOpcoes
                                                            onEdit={() => handleEdit(tecido)}
                                                            onDelete={() =>
                                                                abrirModalExclusao(tecido)
                                                            }
                                                            isLast={isLast}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-gray-400">
                                            Nenhum tecido encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmação de Exclusão */}
            <ModalExclusao
                isOpen={isModalExclusaoOpen}
                onClose={() => setIsModalExclusaoOpen(false)}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir tecido"
                mensagem={
                    <>
                        Deseja mesmo prosseguir com esta ação e excluir{" "}
                        <strong>{tecidoSelecionado?.nome}</strong>?
                    </>
                }
            />

            {/* Modal de Sucesso após Exclusão */}
            <ModalConfirmacao
                isOpen={isModalConfirmacaoOpen}
                onClose={() => setIsModalConfirmacaoOpen(false)}
                type="excluído"
                message="Tecido excluído com sucesso!"
                compactButton
            />

            {/* Modal de Edição */}
            <EditarTecidoModal
                isOpen={isModalEditarOpen}
                onClose={() => setIsModalEditarOpen(false)}
                fabricoId={fabricoId}
                tecidoParaEditar={tecidoSelecionado}
                onSuccess={() => {
                    fetchTecidos();
                }}
            />

            {/* Modal de Cadastro */}
            <CadastrarTecidoModal
                isOpen={isModalCadastrarOpen}
                onClose={() => setIsModalCadastrarOpen(false)}
                fabricoId={fabricoId}
                onSuccess={() => {
                    fetchTecidos();
                }}
            />
        </div>
    );
}
