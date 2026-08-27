import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { excluirParceiro, getParceiroById } from "../services/parceiroService";
import { formatarTelefone } from "../utils/formatters";

// Sub-components
import SecaoEndereco from "../components/parceiros/SecaoEndereco";
import ModalExclusao from "../components/geral/ModalExclusao";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";
import ModalAtencao from "../components/geral/ModalAtencao";
import { DetailPageSkeleton } from "../components/geral/Loading";

const ParceiroDetalhes = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [parceiro, setParceiro] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
    const [modalAtencaoAberto, setModalAtencaoAberto] = useState(false);
    const [excluindo, setExcluindo] = useState(false);

    useEffect(() => {
        const fetchParceiro = async () => {
            try {
                setLoading(true);
                const userString = localStorage.getItem("user");
                const usuarioLogado = userString ? JSON.parse(userString) : null;

                const data = await getParceiroById(id);

                // Verifica se o parceiro pertence ao fabrico do usuário
                if (usuarioLogado && data.fabrico_id !== usuarioLogado.fabrico_id) {
                    setModalAtencaoAberto(true);
                    return; // Interrompe para não setar o parceiro no estado
                }

                setParceiro(data);
            } catch (error) {
                console.error("Erro ao buscar parceiro", error);
                setModalAtencaoAberto(true);
            } finally {
                setLoading(false);
            }
        };

        fetchParceiro();
    }, [id]);

    const handleAcessoNegadoConfirm = () => {
        setModalAtencaoAberto(false);
        navigate("/Parceiros", { replace: true });
    };

    const abrirModalExclusao = () => {
        setModalExclusaoAberto(true);
    };

    const handleConfirmarExclusao = async () => {
        if (!parceiro || excluindo) return;
        try {
            setExcluindo(true);
            await excluirParceiro(parceiro.id);
            setModalExclusaoAberto(false);
            setModalConfirmacaoAberto(true);
        } catch (error) {
            console.error("Erro ao excluir parceiro:", error);
            alert("Erro ao excluir parceiro.");
        } finally {
            setExcluindo(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 pt-0 mt-6 w-full">
                <div className="bg-white p-8 rounded-[24px] shadow-sm w-full mx-auto">
                    <h1 className="flex items-center gap-3 text-[28px] font-light mb-6">
                        <img
                            src="/maquina-costura-preta.png"
                            alt="Ícone"
                            className="w-[30px] h-[30px]"
                        />
                        Detalhes do parceiro
                    </h1>
                    <DetailPageSkeleton variant="parceiro" />
                </div>
            </div>
        );
    }

    if (!parceiro && !modalAtencaoAberto) {
        return (
            <div className="p-6">
                <p>Parceiro não encontrado.</p>
                <button onClick={() => navigate("/Parceiros")}>Voltar</button>
            </div>
        );
    }

    return (
        <div className="p-6 pt-0 mt-6 w-full">
            <div className="bg-white p-8 rounded-[24px] shadow-sm w-full mx-auto">
                <h1 className="flex items-center gap-3 text-[28px] font-light mb-6">
                    <img
                        src="/maquina-costura-preta.png"
                        alt="Ícone"
                        className="w-[30px] h-[30px]"
                    />
                    Detalhes do parceiro
                </h1>

                {/* Etapa de Produção + Dados gerais */}
                <div className="mb-6">
                    <div className="flex">
                        <div className="w-[250px] shrink-0">
                            <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
                                Etapa de Produção
                            </h3>
                            <p className="text-[20px] font-Outfit font-light text-[#4696AD] block">
                                Etapa
                            </p>
                            <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-none">
                                {parceiro.categoria}
                            </p>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
                                Dados gerais
                            </h3>
                            <div className="flex gap-6">
                                <div className="w-[200px] shrink-0">
                                    <p className="text-[20px] font-Outfit font-light text-[#4696AD] block">
                                        Nome
                                    </p>
                                    <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-none">
                                        {parceiro.nome}
                                    </p>
                                </div>

                                <div className="w-[250px] shrink-0">
                                    <p className="text-[20px] font-Outfit font-light text-[#4696AD] block">
                                        Nome do responsável
                                    </p>
                                    <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-none">
                                        {parceiro.responsavel || "Não informado"}
                                    </p>
                                </div>

                                <div className="ml-10">
                                    <p className="text-[20px] font-Outfit font-light text-[#4696AD] block">
                                        Telefone
                                    </p>
                                    <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-none">
                                        {parceiro.telefone
                                            ? formatarTelefone(parceiro.telefone)
                                            : "Não informado"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SecaoEndereco endereco={parceiro.endereco} />

                {/* financeiro */}
                <div className="mt-7 mb-6">
                    <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
                        Financeiro
                    </h3>

                    <div>
                        <p className="text-[20px] font-Outfit font-light text-[#4696AD] block">
                            {parceiro.forma_pagamento || "Forma de pagamento"}
                        </p>

                        {/* Lógica para PIX */}
                        {parceiro.forma_pagamento === "PIX" && (
                            <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-none">
                                {parceiro.chave_pix || "Chave pix não informada"}
                            </p>
                        )}

                        {/* Lógica para TED */}
                        {parceiro.forma_pagamento === "TED" && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <p className="text-[16px] font-Outfit font-light text-[#898c8f]">
                                    <strong>Banco:</strong> {parceiro.banco}
                                </p>
                                <p className="text-[16px] font-Outfit font-light text-[#898c8f]">
                                    <strong>Agência:</strong> {parceiro.agencia}
                                </p>
                                <p className="text-[16px] font-Outfit font-light text-[#898c8f]">
                                    <strong>Conta:</strong> {parceiro.conta}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Lógica para quando NÃO for nem PIX nem TED */}
                    {parceiro.forma_pagamento !== "PIX" && parceiro.forma_pagamento !== "TED" && (
                        <p className="text-[16px] font-Outfit font-light text-[#898c8f]">
                            Forma de pagamento não informada
                        </p>
                    )}
                </div>

                {/* Ações */}
                <div className="flex justify-between items-center mt-10 w-full">
                    <button
                        onClick={() => navigate("/parceiros")}
                        className="w-[147px] h-[39px] rounded-[18.9px] bg-[#F3F4FA] border border-[#4696ad] text-[#4696ad] font-Outfit text-[16px] transition-colors hover:bg-[#E1F1F6]"
                    >
                        Voltar
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={() => abrirModalExclusao()}
                            className="w-[189px] h-[39px] rounded-[18.9px] border border-[#D75757] bg-[#FFFFFF] text-[#D75757] font-Outfit text-[16px] transition-colors hover:bg-[#FDF1F1]"
                        >
                            Excluir Parceiro
                        </button>

                        <button
                            onClick={() => navigate(`/parceiros/editar/${id}`)}
                            className="w-[189px] h-[39px] rounded-[18.9px] bg-[#a9e2f2] text-[#4696ad] font-Outfit text-[16px] transition-colors hover:bg-[#A2DCED]"
                        >
                            Editar Parceiro
                        </button>
                    </div>
                </div>
            </div>

            <ModalExclusao
                isOpen={modalExclusaoAberto}
                onClose={() => setModalExclusaoAberto(false)}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir parceiro"
                nomeItem={parceiro?.nome}
                tipoItem="o parceiro"
                loading={excluindo}
            />

            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => navigate("/Parceiros", { replace: true })}
                type="excluído"
            />

            <ModalAtencao
                isOpen={modalAtencaoAberto}
                onConfirm={handleAcessoNegadoConfirm}
                titulo="Atenção!"
                mensagem="Este parceiro não pertence ou não existe no seu fabrico. Você será redirecionado para a lista de parceiros."
            />
        </div>
    );
};

export default ParceiroDetalhes;
