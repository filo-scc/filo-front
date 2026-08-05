import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getProdutoById,
    getClientesDoProduto,
    excluirProduto,
    getAviamentosDoProduto,
    getTiposProdutoByFabrico,
} from "../services/produtoService";
import { getFabricoById } from "../services/fabricoService";
import { getAllEtapasByFabricoId } from "../services/etapaService";
import { getParceirosByFabrico } from "../services/parceiroService";
import { getVinculoParceiroProduto } from "../services/parceiroProdutoService";

import ProdutoDetalhesHeader from "../components/produtos/ProdutoDetalhesHeader";
import SecaoDadosProduto from "../components/produtos/SecaoDadosProduto";
import TabelaClientesDoProduto from "../components/produtos/TabelaClientesDoProduto";
import ProdutoDetalhesSkeleton from "../components/produtos/ProdutoDetalhesSkeleton";
import ModalExclusao from "../components/geral/ModalExclusao";
import ModalAtencao from "../components/geral/ModalAtencao";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";

// Função para deixar as unidades de medida mais bonitas visualmente
function formatarUnidadeDeMedida(unidade) {
    if (!unidade) return "";

    const unidadesMapeadas = {
        METRO: "m",
        CENTIMETRO: "cm",
        GRAMA: "g",
        QUILOGRAMA: "kg",
        UNIDADE: "und",
        PAR: "par",
    };

    return unidadesMapeadas[unidade.toUpperCase()] || unidade.toLowerCase();
}

function formatarPreco(valor) {
    if (valor === undefined || valor === null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export default function ProdutoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [produto, setProduto] = useState(null);
    const [clientesAssociados, setClientesAssociados] = useState([]);
    const [aviamentosProduto, setAviamentosProduto] = useState([]);
    const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
    const [modalAtencaoAberto, setModalAtencaoAberto] = useState(false);
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
    const [fabrico, setFabrico] = useState(null);
    const [excluindo, setExcluindo] = useState(false);
    const [colunasFlexiveis, setColunasFlexiveis] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                const userString = localStorage.getItem("user");
                const usuarioLogado = userString ? JSON.parse(userString) : null;
                const fabricoId = usuarioLogado?.fabrico_id;

                const [
                    dadosProduto,
                    dadosClientes,
                    dadosAviamentos,
                    dadosTipos,
                    todasEtapas,
                    parceirosDisponiveis,
                ] = await Promise.all([
                    getProdutoById(id),
                    getClientesDoProduto(id),
                    getAviamentosDoProduto(id),
                    getTiposProdutoByFabrico().catch(() => []),
                    getAllEtapasByFabricoId(fabricoId).catch(() => []),
                    getParceirosByFabrico(fabricoId).catch(() => []),
                ]);

                if (usuarioLogado && dadosProduto.fabrico_id !== usuarioLogado.fabrico_id) {
                    setModalAtencaoAberto(true);
                    setLoading(false);
                    return;
                }

                const tipoProdutoRelacionado =
                    dadosProduto.tipo_produto ||
                    dadosProduto.tipoProduto ||
                    (Array.isArray(dadosTipos)
                        ? dadosTipos.find((tipo) => tipo?.id === dadosProduto.tipo_produto_id)
                        : null);

                setProduto({
                    ...dadosProduto,
                    tipo_produto: tipoProdutoRelacionado || undefined,
                });
                setClientesAssociados(dadosClientes);
                setAviamentosProduto(dadosAviamentos);

                // 1. Mapeamento inicial das etapas com o parceiro correspondente
                const etapasPreMapeadas = (todasEtapas || []).map((etapa) => {
                    const parceiroMapeado = (parceirosDisponiveis || []).find((p) => {
                        const categoriaParceiro = (p?.categoria || "").trim().toLowerCase();
                        const nomeEtapa = (etapa?.nome || "").trim().toLowerCase();
                        return categoriaParceiro === nomeEtapa;
                    });

                    return {
                        ...etapa,
                        parceiro_id: parceiroMapeado ? parceiroMapeado.id : null,
                    };
                });

                // 2. 🌟 Busca dinâmica na tabela intermediária (parceiro_produto) para cada vínculo encontrado
                const etapasVinculadasComCustos = await Promise.all(
                    etapasPreMapeadas.map(async (etapa) => {
                        let custoFinal = 0;

                        // Se houver um parceiro associado a esta etapa, buscamos o preço customizado
                        if (etapa.parceiro_id) {
                            try {
                                const vinculo = await getVinculoParceiroProduto(
                                    etapa.parceiro_id,
                                    id,
                                );
                                if (vinculo && vinculo.preco !== undefined) {
                                    custoFinal = vinculo.preco;
                                }
                            } catch (err) {
                                console.error(
                                    `Erro ao buscar vínculo para parceiro ${etapa.parceiro_id} e produto ${id}:`,
                                    err,
                                );
                            }
                        }

                        // Fallback: Se não achou na tabela intermediária, tenta pegar do etapas_produto antigo (como backup)
                        if (custoFinal === 0) {
                            const custoExistente = dadosProduto?.etapas_produto?.find(
                                (ep) => ep.etapa_id === etapa.id,
                            )?.custo;
                            custoFinal = custoExistente || 0;
                        }

                        return {
                            ...etapa,
                            custo: custoFinal,
                        };
                    }),
                );

                setColunasFlexiveis(etapasVinculadasComCustos);
            } catch (error) {
                console.error("Erro ao carregar detalhes:", error);
                setModalAtencaoAberto(true);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, navigate]);

    useEffect(() => {
        async function carregarDadosDoFabrico() {
            if (produto && produto.fabrico_id) {
                try {
                    const dadosFabrico = await getFabricoById(produto.fabrico_id);
                    setFabrico(dadosFabrico);
                } catch (error) {
                    console.error("Erro ao buscar dados do fabrico:", error);
                }
            }
        }

        carregarDadosDoFabrico();
    }, [produto]);

    const handleAcessoNegadoConfirm = () => {
        setModalAtencaoAberto(false);
        navigate("/produtos", { replace: true });
    };

    const handleConfirmarExclusao = async () => {
        if (excluindo) return;
        try {
            setExcluindo(true);
            await excluirProduto(id);
            setModalExclusaoAberto(false);
            setModalConfirmacaoAberto(true);
        } catch {
            alert("Erro ao excluir produto.");
        } finally {
            setExcluindo(false);
        }
    };

    const custoTecido = Number(
        produto?.custo_tecido ||
            Number(String(produto?.quantidade_tecido || 0).replace(",", ".")) *
                Number(produto?.tecido?.custo_unitario || 0),
    );

    const custoAviamentos = aviamentosProduto.reduce((acc, pivot) => {
        const qtd = Number(String(pivot.quantidade || 0).replace(",", "."));
        const custo = Number(pivot.aviamento?.custo_unitario || 0);
        return acc + qtd * custo;
    }, 0);

    const valorTotalGasto = custoTecido + custoAviamentos;

    const totalCustosEtapas = colunasFlexiveis.reduce(
        (acc, etapa) => acc + (Number(etapa.custo) || 0),
        0,
    );

    const totalGeral =
        valorTotalGasto +
        totalCustosEtapas +
        (Number(produto?.custo_operacional) || 0) +
        (Number(produto?.outros_custos) || 0);

    if (loading) {
        return (
            <div className="p-6 pt-0 mt-6 w-full flex justify-center">
                <div className="bg-white p-8 rounded-[24px] shadow-sm w-full min-h-[400px]">
                    <ProdutoDetalhesHeader title="Detalhes de produto" />
                    <ProdutoDetalhesSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 pt-0 mt-6 w-full flex justify-center">
            <div className="bg-white p-8 rounded-[24px] shadow-sm w-full min-h-[400px]">
                <ProdutoDetalhesHeader title="Detalhes de produto" />

                <div className="mt-8 space-y-8">
                    {produto ? (
                        <>
                            <SecaoDadosProduto produto={produto} aviamentos={aviamentosProduto} />

                            {/* Tabela de Quantidade por aviamento - Visualização */}
                            <div className="mt-6 w-full">
                                <h3 className="text-[20px] font-light text-[#404040] mb-4">
                                    Quantidade por aviamento
                                </h3>
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full table-fixed border-separate border-spacing-0">
                                        <thead>
                                            <tr>
                                                <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] first:rounded-tl-[10px] last:rounded-tr-[10px] text-center border-none">
                                                    Tecido
                                                </th>
                                                {aviamentosProduto.map((pivot) => (
                                                    <th
                                                        key={pivot.id}
                                                        className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] text-center capitalize border-none"
                                                    >
                                                        {pivot.aviamento?.nome}
                                                    </th>
                                                ))}
                                                <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] first:rounded-tl-[10px] last:rounded-tr-[10px] text-center border-none">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="bg-[#FFFFFF] py-3 px-4 border-l-[0.5px] border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] first:rounded-bl-[10px] text-center">
                                                    <span className="text-[16px] font-light text-[#404040]">
                                                        {produto?.quantidade_tecido || "-"} (
                                                        {formatarUnidadeDeMedida(
                                                            produto?.tecido?.unidade_de_medida,
                                                        ) || ""}
                                                        )
                                                    </span>
                                                </td>
                                                {aviamentosProduto.map((pivot) => (
                                                    <td
                                                        key={pivot.id}
                                                        className="bg-[#FFFFFF] py-3 px-4 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] text-center"
                                                    >
                                                        <span className="text-[16px] font-light text-[#404040]">
                                                            {pivot.quantidade || "-"} (
                                                            {formatarUnidadeDeMedida(
                                                                pivot.aviamento?.unidade_de_medida,
                                                            ) || ""}
                                                            )
                                                        </span>
                                                    </td>
                                                ))}
                                                <td className="bg-[#FFFFFF] py-3 px-4 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] last:rounded-br-[10px] text-center text-[16px] font-light text-[#404040]">
                                                    {new Intl.NumberFormat("pt-BR", {
                                                        style: "currency",
                                                        currency: "BRL",
                                                    }).format(valorTotalGasto)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Bloco Inferior: Tabela de Custo */}
                            <div className="mt-6 w-full">
                                <h3 className="text-[20px] font-light text-[#404040] mb-4">
                                    Custo por peça
                                </h3>
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full table-fixed border-separate border-spacing-0">
                                        <thead>
                                            <tr>
                                                <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] first:rounded-tl-[10px] text-center border-none">
                                                    Aviamentos
                                                </th>
                                                {colunasFlexiveis.map((etapa, index) => (
                                                    <th
                                                        key={etapa.id || index}
                                                        className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] text-center border-none"
                                                    >
                                                        {etapa.nome}
                                                    </th>
                                                ))}
                                                <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] text-center border-none">
                                                    Operacional
                                                </th>
                                                <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] text-center border-none">
                                                    Outros
                                                </th>
                                                <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] last:rounded-tr-[10px] text-center border-none">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                {/* Aviamentos */}
                                                <td className="bg-[#FFFFFF] py-3 px-4 border-l-[0.5px] border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] first:rounded-bl-[10px] text-center text-[16px] font-light text-[#404040]">
                                                    {formatarPreco(custoAviamentos)}
                                                </td>

                                                {/* Colunas Flexíveis (Etapas) */}
                                                {colunasFlexiveis.map((etapa, index) => (
                                                    <td
                                                        key={etapa.id || index}
                                                        className="bg-[#FFFFFF] py-3 px-4 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] text-center text-[16px] font-light text-[#404040]"
                                                    >
                                                        {formatarPreco(etapa.custo || 0)}
                                                    </td>
                                                ))}

                                                {/* Operacional */}
                                                <td className="bg-[#FFFFFF] py-3 px-4 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] text-center text-[16px] font-light text-[#404040]">
                                                    {formatarPreco(produto.custo_operacional || 0)}
                                                </td>

                                                {/* Outros */}
                                                <td className="bg-[#FFFFFF] py-3 px-4 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] text-center text-[16px] font-light text-[#404040]">
                                                    {formatarPreco(produto.outros_custos || 0)}
                                                </td>

                                                {/* Total */}
                                                <td className="bg-[#FFFFFF] py-3 px-4 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] last:rounded-br-[10px] text-center text-[16px] font-light text-[#404040]">
                                                    {formatarPreco(totalGeral)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <TabelaClientesDoProduto
                                clientes={clientesAssociados}
                                produtoId={id}
                                referenciaInterna={produto.nome}
                                fabricacao_sob_demanda={fabrico?.fabricacao_sob_demanda}
                            />
                        </>
                    ) : (
                        <ProdutoDetalhesSkeleton />
                    )}

                    <div className="flex justify-between items-center mt-14 py-4 w-full">
                        <button
                            onClick={() => navigate("/produtos")}
                            className="w-[147px] h-[39px] rounded-[18.9px] bg-[#F3F4FA] border border-[#4696ad] text-[#4696ad] font-Outfit text-[16px] transition-colors hover:bg-[#E1F1F6]"
                        >
                            Voltar
                        </button>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setModalExclusaoAberto(true)}
                                className="w-[189px] h-[39px] rounded-[18.9px] bg-[#D75757] text-white font-Outfit text-[16px] transition-colors hover:bg-[#d74646]"
                            >
                                Excluir produto
                            </button>
                            <button
                                onClick={() => navigate("/produtos/editar/" + id)}
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
                loading={excluindo}
            />

            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => {
                    setModalConfirmacaoAberto(false);
                    navigate("/produtos", {
                        replace: true,
                        state: { success: "Produto excluído com sucesso." },
                    });
                }}
                type="excluído"
            />

            <ModalAtencao
                isOpen={modalAtencaoAberto}
                mensagem="Este produto não pertence ou não existe no seu fabrico. Você será redirecionado para a lista de produtos."
                onConfirm={handleAcessoNegadoConfirm}
            />
        </div>
    );
}
