import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProdutoById, getClientesDoProduto, excluirProduto } from "../services/produtosService";

import ProdutoDetalhesHeader from "../components/produtos/ProdutoDetalhesHeader";
import SecaoDadosProduto from "../components/produtos/SecaoDadosProduto";
import TabelaClientesDoProduto from "../components/produtos/TabelaClientesDoProduto";
import ModalExclusao from "../components/geral/ModalExclusao"; // <-- Importado aqui (ajuste o caminho se necessário)

export default function ProdutoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [produto, setProduto] = useState(null);
    const [clientesAssociados, setClientesAssociados] = useState([]);
    const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                const userString = localStorage.getItem("user");
                const usuarioLogado = userString ? JSON.parse(userString) : null;

                const [dadosProduto, dadosClientes] = await Promise.all([
                    getProdutoById(id),
                    getClientesDoProduto(id),
                ]);

                // Validação de segurança: fabrico_id
                if (usuarioLogado && dadosProduto.fabrico_id !== usuarioLogado.fabrico_id) {
                    navigate("/produtos", {
                        replace: true,
                        state: { error: "Acesso negado." },
                    });
                    return;
                }

                setProduto(dadosProduto);
                setClientesAssociados(dadosClientes);
            } catch (error) {
                console.error("Erro ao carregar detalhes:", error);
                navigate("/produtos");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, navigate]);

    const handleConfirmarExclusao = async () => {
        try {
            await excluirProduto(id);
            setModalExclusaoAberto(false);
            navigate("/produtos");
        } catch {
            alert("Erro ao excluir produto.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-[#4696AD] font-Outfit">Carregando detalhes...</p>
            </div>
        );
    }

    return (
        <div className="p-6 pt-0 w-full flex justify-center">
            <div className="bg-white p-8 rounded-[24px] shadow-sm w-full min-h-[400px]">
                <ProdutoDetalhesHeader title="Detalhes de produto" />

                <div className="mt-8 space-y-8">
                    <SecaoDadosProduto produto={produto} />
                    <TabelaClientesDoProduto
                        clientes={clientesAssociados}
                        referenciaInterna={produto.nome}
                    />

                    {/* Botões de Ação */}
                    <div className="flex justify-between items-center mt-14 py-4 w-full">
                        <button
                            onClick={() => navigate("/produtos")}
                            className="w-[147px] h-[39px] rounded-[18.9px] bg-[#F3F4FA] border border-[#4696ad] text-[#4696ad] font-Outfit text-[16px] transition-colors hover:bg-[#E1F1F6]"
                        >
                            Voltar
                        </button>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setModalExclusaoAberto(true)} // <-- Abre o modal
                                className="w-[189px] h-[39px] rounded-[18.9px] bg-[#D75757] text-white font-Outfit text-[16px] transition-colors hover:bg-[#d74646]"
                            >
                                Excluir produto
                            </button>
                            <button
                                onClick={() => navigate("/editar-produto/" + id)}
                                className="w-[189px] h-[39px] rounded-[18.9px] bg-[#a9e2f2] text-[#4696ad] font-Outfit text-[16px] transition-colors hover:bg-[#A2DCED]"
                            >
                                Editar produto
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ModalExclusao
                isOpen={modalExclusaoAberto}
                onClose={() => setModalExclusaoAberto(false)}
                onConfirm={handleConfirmarExclusao}
                nomeItem={produto?.nome}
                tipoItem="o produto"
            />
        </div>
    );
}
