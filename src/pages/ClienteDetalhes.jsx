import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { excluirCliente, getClienteById, getProdutosDoCliente } from "../services/clientesService";
import { Layout } from "../components/Layout";

// Sub-componentes
import DetalhesHeader from "../components/clientes/DetalhesHeader";
import SecaoDadosGerais from "../components/clientes/SecaoDadosGerais";
import SecaoEndereco from "../components/clientes/SecaoEndereco";
import TabelaReferencias from "../components/clientes/TabelaReferencias";
import ModalReferencias from "../components/clientes/ModalReferencias";
import ModalExclusao from "../components/geral/ModalExclusao";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";

export default function ClienteDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estados para o Modal de Exclusão
    const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);

    const abrirModalExclusao = () => {
        setModalExclusaoAberto(true);
    };

    const handleConfirmarExclusao = async () => {
        if (!cliente) return;

        try {
            await excluirCliente(cliente.id);

            setModalExclusaoAberto(false);
            setModalConfirmacaoAberto(true);
        } catch (error) {
            console.error("Erro ao excluir cliente:", error);
            alert("Erro ao excluir cliente.");
        }
    };

    const [loading, setLoading] = useState(true);
    const [cliente, setCliente] = useState(null);
    const [produtos, setProdutos] = useState([]);

    // Estado do modal de referências
    const [modalReferenciasAberto, setModalReferenciasAberto] = useState(false);

    // Recarrega a tabela chamando o endpoint de produtos novamente
    const recarregarTabela = async () => {
        try {
            const dadosProdutos = await getProdutosDoCliente(id);
            setProdutos(dadosProdutos);
        } catch (error) {
            console.error("Erro ao atualizar tabela", error);
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                const userString = localStorage.getItem("user");
                const usuarioLogado = JSON.parse(userString);

                const [dadosCliente, dadosProdutos] = await Promise.all([
                    getClienteById(id),
                    getProdutosDoCliente(id),
                ]);

                if (dadosCliente.fabrico_id !== usuarioLogado.fabrico_id) {
                    navigate("/clientes", {
                        replace: true,
                        state: {
                            error: "Acesso negado. Este cliente não pertence à sua fábrica.",
                        },
                    });
                    return;
                }

                setCliente(dadosCliente);
                setProdutos(dadosProdutos);
            } catch (error) {
                console.error(error);
                navigate("/clientes", {
                    replace: true,
                    state: { error: "Não foi possível ver detalhes desse cliente" },
                });
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, navigate]);

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <p className="text-[#4696AD] animate-pulse font-Outfit">
                        Carregando detalhes...
                    </p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6 pt-0 w-full flex justify-center">
                <div className="bg-white p-8 rounded-[24px] shadow-sm w-full min-h-[400px]">
                    <DetalhesHeader title="Detalhes de cliente" />

                    <div className="mt-8 space-y-8">
                        <SecaoDadosGerais cliente={cliente} />
                        <SecaoEndereco endereco={cliente.endereco} />

                        {/* Tabela de Referências: 
                Passe a função de abrir o modal como prop, para acionar de lá! */}
                        <TabelaReferencias
                            produtos={produtos}
                            onAbrirModal={() => setModalReferenciasAberto(true)}
                        />

                        {/* justify-between cria o espaço entre o botão da esquerda e o grupo da direita */}
                        <div className="flex justify-between items-center mt-10 w-full">
                            {/* Botão Voltar - Alinhado à esquerda */}
                            <button
                                onClick={() => navigate("/clientes")}
                                className="w-[147px] h-[39px] rounded-[18.9px] bg-[#F3F4FA] border border-[#4696ad] text-[#4696ad] font-Outfit text-[16px] transition-colors hover:bg-[#E1F1F6]"
                            >
                                Voltar
                            </button>

                            {/* Grupo de botões de ação - Permanecem juntos à direita */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => abrirModalExclusao()}
                                    className="w-[189px] h-[39px] rounded-[18.9px] bg-[#D75757] text-white font-Outfit text-[16px] transition-colors hover:bg-[#d74646]"
                                >
                                    Excluir cliente
                                </button>
                                <button
                                    className="w-[189px] h-[39px] rounded-[18.9px] bg-[#a9e2f2] text-[#4696ad] font-Outfit text-[16px] transition-colors hover:bg-[#A2DCED]"
                                    onClick={() => navigate("/clientes/editar/" + id)}
                                >
                                    Editar cliente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ModalReferencias
                isOpen={modalReferenciasAberto}
                onClose={() => setModalReferenciasAberto(false)}
                clienteId={id}
                fabricoId={cliente?.fabrico_id}
                produtosExistentes={produtos}
                onSuccess={recarregarTabela}
            />

            <ModalExclusao
                isOpen={modalExclusaoAberto}
                onClose={() => setModalExclusaoAberto(false)}
                onConfirm={handleConfirmarExclusao}
                nomeItem={cliente?.nome}
                tipoItem="o cliente"
            />

            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => {
                    setModalConfirmacaoAberto(false);
                    navigate("/clientes", {
                        replace: true,
                        state: { success: "Cliente excluído com sucesso." },
                    });
                }}
                type="excluído"
            />
        </Layout>
    );
}
