import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TabelaFichaTecnica from "../components/pedidos/TabelaReferenciaFichaTecnica";
import { getClienteById, getProdutosDoCliente } from "../services/clientesService";
import { getProdutoById } from "../services/produtoService";
import { getFabricoById } from "../services/fabricoService";
import { findOne, getFichaTecnicaByFabrico } from "../services/fichasTecnicasService";
import { getPedidoById, getPedidosByFabricoId } from "../services/pedidoService";
import ModalAtencao from "../components/geral/ModalAtencao";
import { DetailPageSkeleton } from "../components/geral/Loading";

const sectionTitleClass = "text-[20px] font-light text-[#404040] mb-4 font-['Outfit']";
const fieldLabelClass = "text-[20px] font-Outfit font-light text-[#4696AD] block";
const fieldValueClass = "text-[16px] font-Outfit font-light text-[#898c8f] leading-none";

const primeiroNumeroValido = (...valores) => {
    for (const valor of valores) {
        if (valor === null || valor === undefined) continue;
        const texto = String(valor).trim();
        if (!texto) continue;
        const numero = Number(texto);
        if (Number.isFinite(numero)) return numero;
    }
    return undefined;
};

const formatarDataCompleta = (dataString) => {
    if (!dataString) return "-";
    const data = new Date(dataString);
    if (Number.isNaN(data.getTime())) return "-";
    return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const extrairCores = (ficha) => {
    if (Array.isArray(ficha?.cores) && ficha.cores.length > 0) return ficha.cores;

    const coresRelacao = ficha?.ficha_tecnica_cores || ficha?.cores_ficha || [];
    if (Array.isArray(coresRelacao) && coresRelacao.length > 0) {
        return coresRelacao.map((item) => item?.cor || item);
    }

    const mapa = {};
    (ficha?.ficha_tecnica_itens || []).forEach((item) => {
        if (item?.cor?.id != null) {
            mapa[item.cor.id] = item.cor;
        } else if (item?.cor) {
            mapa[item.cor.nome || item.cor_id] = item.cor;
        }
    });

    return Object.values(mapa);
};

const getProdutoId = (item) =>
    item?.produto?.id ?? item?.produto_id ?? item?.id_produto ?? item?.id;

const obterFabricoDoPedido = (pedido) =>
    primeiroNumeroValido(
        pedido?.fabrico_id,
        pedido?.fabricoId,
        pedido?.fabrico?.id,
        pedido?.cliente?.fabrico_id,
        pedido?.fichas_tecnicas?.[0]?.fabrico_id,
    );

const mapearFichaParaTabela = (ficha, relacaoClienteProduto) => {
    const quantidade = Number(ficha?.quantidade) || Number(ficha?.quantidade_pecas) || 0;

    return {
        id: ficha?.id,
        foto: ficha?.produto?.foto ?? ficha?.foto,
        referenciaInterna:
            ficha?.produto?.nome ?? ficha?.referenciaInterna ?? ficha?.ref_interna ?? "-",
        referenciaCliente:
            relacaoClienteProduto?.nome_para_cliente ??
            ficha?.referenciaCliente ??
            ficha?.ref_cliente ??
            "",
        cores: extrairCores(ficha),
        quantidade,
        preco_padrao:
            relacaoClienteProduto?.preco_padrao ??
            ficha?.preco_padrao ??
            ficha?.preco_unitario ??
            ficha?.preco ??
            null,
        custo_total:
            ficha?.produto?.custo_total ?? ficha?.custo_total ?? ficha?.custo_unitario ?? null,
    };
};

export default function PedidosDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const usuarioLogado = JSON.parse(localStorage.getItem("user") || "{}");
    const fabricoId = primeiroNumeroValido(
        usuarioLogado?.fabrico_id,
        usuarioLogado?.fabricoId,
        usuarioLogado?.fabrico?.id,
    );

    const [loading, setLoading] = useState(true);
    const [pedido, setPedido] = useState(null);
    const [fichas, setFichas] = useState([]);
    const [isSobDemanda, setIsSobDemanda] = useState(true);
    const [modalAtencaoAberto, setModalAtencaoAberto] = useState(false);

    useEffect(() => {
        if (!id) return;

        let ignorar = false;

        const carregarPedido = async () => {
            setLoading(true);
            try {
                let dadosPedido = null;

                try {
                    const respostaPedido = await getPedidoById(id);
                    dadosPedido = respostaPedido?.id ? respostaPedido : respostaPedido?.data;
                } catch (error) {
                    console.error(
                        "Erro ao buscar pedido por id, tentando lista do fabrico:",
                        error,
                    );
                    if (!fabricoId) throw error;

                    const lista = await getPedidosByFabricoId(fabricoId);
                    const pedidos = Array.isArray(lista)
                        ? lista
                        : lista?.data || lista?.pedidos || [];
                    dadosPedido = pedidos.find((item) => String(item.id) === String(id));
                }

                if (ignorar) return;

                if (!dadosPedido) {
                    setModalAtencaoAberto(true);
                    return;
                }

                const pedidoFabricoId = obterFabricoDoPedido(dadosPedido);
                if (fabricoId && pedidoFabricoId && Number(pedidoFabricoId) !== Number(fabricoId)) {
                    setModalAtencaoAberto(true);
                    return;
                }

                let produzSobDemanda = true;
                const fabricoParaConsulta = pedidoFabricoId || fabricoId;
                if (fabricoParaConsulta) {
                    try {
                        const fabricoInfo = await getFabricoById(fabricoParaConsulta);
                        if (ignorar) return;
                        produzSobDemanda = fabricoInfo?.fabricacao_sob_demanda === true;
                    } catch (error) {
                        console.error("Erro ao carregar configuração do fabrico:", error);
                    }
                }

                if (!dadosPedido.cliente && dadosPedido.cliente_id) {
                    try {
                        const cliente = await getClienteById(dadosPedido.cliente_id);
                        dadosPedido = { ...dadosPedido, cliente };
                    } catch (error) {
                        console.error("Erro ao carregar cliente do pedido:", error);
                    }
                }

                let fichasBase = dadosPedido.fichas_tecnicas || dadosPedido.fichas || [];
                if (fichasBase.length === 0 && fabricoParaConsulta) {
                    try {
                        const todasFichas = await getFichaTecnicaByFabrico(fabricoParaConsulta);
                        fichasBase = (Array.isArray(todasFichas) ? todasFichas : []).filter(
                            (ficha) =>
                                String(ficha?.pedido_id ?? ficha?.pedido?.id) ===
                                String(dadosPedido.id),
                        );
                    } catch (error) {
                        console.error("Erro ao carregar fichas técnicas do pedido:", error);
                    }
                }
                const fichasCompletas = await Promise.all(
                    fichasBase.map(async (ficha) => {
                        if (!ficha?.id) return ficha;
                        const precisaComplemento =
                            !ficha.produto ||
                            (!ficha.ficha_tecnica_itens &&
                                !ficha.ficha_tecnica_cores &&
                                !ficha.cores);
                        if (!precisaComplemento) return ficha;

                        try {
                            const detalhe = await findOne(ficha.id);
                            return { ...ficha, ...detalhe };
                        } catch (error) {
                            console.error("Erro ao complementar ficha técnica:", error);
                            return ficha;
                        }
                    }),
                );

                let relacoesPorProduto = new Map();
                const clienteId = dadosPedido.cliente?.id ?? dadosPedido.cliente_id;
                if (produzSobDemanda && clienteId) {
                    try {
                        const produtosDoCliente = await getProdutosDoCliente(clienteId);
                        relacoesPorProduto = new Map(
                            (produtosDoCliente || []).map((item) => [
                                String(getProdutoId(item)),
                                item,
                            ]),
                        );
                    } catch (error) {
                        console.error("Erro ao carregar produtos do cliente:", error);
                    }
                }

                const mapaCustos = new Map();
                if (!produzSobDemanda) {
                    const idsUnicos = [
                        ...new Set(
                            fichasCompletas
                                .map((ficha) => ficha?.produto?.id ?? ficha?.produto_id)
                                .filter(Boolean)
                                .map(String),
                        ),
                    ];
                    const produtos = await Promise.all(
                        idsUnicos.map((produtoId) => getProdutoById(produtoId).catch(() => null)),
                    );
                    produtos.forEach((produto) => {
                        if (produto?.id != null) {
                            mapaCustos.set(String(produto.id), produto.custo_total);
                        }
                    });
                }

                if (ignorar) return;

                setPedido(dadosPedido);
                setIsSobDemanda(produzSobDemanda);
                setFichas(
                    fichasCompletas.map((ficha) => {
                        const produtoId = ficha?.produto?.id ?? ficha?.produto_id;
                        const fichaComCusto = {
                            ...ficha,
                            custo_total:
                                mapaCustos.get(String(produtoId)) ??
                                ficha?.produto?.custo_total ??
                                ficha?.custo_total,
                        };
                        return mapearFichaParaTabela(
                            fichaComCusto,
                            relacoesPorProduto.get(String(produtoId)),
                        );
                    }),
                );
            } catch (error) {
                console.error("Erro ao carregar detalhes do pedido:", error);
                if (!ignorar) setModalAtencaoAberto(true);
            } finally {
                if (!ignorar) setLoading(false);
            }
        };

        carregarPedido();

        return () => {
            ignorar = true;
        };
    }, [id, fabricoId]);

    const handleAcessoNegadoConfirm = () => {
        setModalAtencaoAberto(false);
        navigate("/pedidos", { replace: true });
    };

    const numeroPedido = pedido?.numero ?? pedido?.id ?? "-";
    const tituloItem = isSobDemanda ? "Pedido" : "Produção";
    const referencias = fichas
        .map((ficha) => ficha.referenciaInterna)
        .filter((ref) => ref && ref !== "-")
        .filter((ref, index, lista) => lista.indexOf(ref) === index)
        .join(", ");

    if (loading) {
        return (
            <div className="p-6 pt-0 mt-6 w-full relative z-0 font-['Outfit']">
                <div className="bg-white p-10 rounded-[24px] shadow-sm w-full mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <img
                            src="/pedidos-desativado.png"
                            alt=""
                            className="h-8 w-8 shrink-0 object-contain brightness-0 opacity-[0.85]"
                        />
                        <h1 className="text-[28px] sm:text-[30px] font-light text-[#404040] tracking-tight leading-none">
                            Carregando...
                        </h1>
                    </div>
                    <DetailPageSkeleton />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-6 pt-0 mt-6 w-full relative z-0 font-['Outfit']">
                {pedido && (
                    <div className="bg-white p-10 rounded-[24px] shadow-sm w-full mx-auto">
                        <div className="mb-6">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/pedidos-desativado.png"
                                    alt=""
                                    className="h-8 w-8 shrink-0 object-contain brightness-0 opacity-[0.85]"
                                />
                                <h1 className="text-[28px] sm:text-[30px] font-light text-[#404040] tracking-tight leading-none">
                                    {tituloItem} Nº {numeroPedido}
                                </h1>
                            </div>
                        </div>

                        <section className="mb-8">
                            <div className="flex flex-wrap gap-8 justify-between items-start">
                                <div className="flex flex-col">
                                    <h2 className={sectionTitleClass}>Informações gerais</h2>
                                    <div className="flex flex-row flex-wrap gap-16">
                                        {isSobDemanda && (
                                            <div className="min-w-[160px]">
                                                <p className={fieldLabelClass}>Cliente</p>
                                                <p className={fieldValueClass}>
                                                    {pedido.cliente?.nome || "-"}
                                                </p>
                                            </div>
                                        )}
                                        <div className="min-w-[160px]">
                                            <p className={fieldLabelClass}>Referências</p>
                                            <p className={fieldValueClass}>{referencias || "-"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col w-fit max-w-full">
                                    <h2 className={sectionTitleClass}>Previsão de entrega</h2>
                                    <p className={fieldLabelClass}>Data</p>
                                    <p className={fieldValueClass}>
                                        {formatarDataCompleta(pedido.data_prevista)}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="mb-10">
                            <TabelaFichaTecnica
                                fichas={fichas}
                                isSobDemanda={isSobDemanda}
                                somenteLeitura
                            />
                        </div>

                        <div className="flex flex-wrap justify-between items-center gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => navigate("/pedidos")}
                                className="px-8 h-[39px] rounded-full border border-[#4696AD] text-[#4696AD] bg-[#F3F4FA] hover:bg-[#F3FBFC] transition-colors text-sm min-w-[180px]"
                            >
                                Voltar
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/pedidos/editar/${id}`)}
                                className="w-[189px] h-[39px] rounded-[18.9px] bg-[#a9e2f2] text-[#4696ad] font-Outfit text-[16px] transition-colors hover:bg-[#A2DCED]"
                            >
                                {isSobDemanda ? "Editar pedido" : "Editar produção"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ModalAtencao
                isOpen={modalAtencaoAberto}
                onConfirm={handleAcessoNegadoConfirm}
                titulo="Atenção"
                mensagem={
                    isSobDemanda
                        ? "Este pedido não pertence ou não existe no seu fabrico. Você será redirecionado para a lista de pedidos."
                        : "Esta produção não pertence ou não existe no seu fabrico. Você será redirecionado para a lista de produções."
                }
            />
        </>
    );
}
