import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TabelaFichaTecnica from "../components/pedidos/TabelaReferenciaFichaTecnica";
import {
    getClienteById,
    getClientes,
    getProdutosDoCliente,
    getProdutosPorFabrico,
} from "../services/clientesService";
import { getProdutoById } from "../services/produtoService";
import { getFabricoById } from "../services/fabricoService";
import { findOne, getFichaTecnicaByFabrico } from "../services/fichasTecnicasService";
import {
    getPedidoById,
    getPedidosByFabricoId,
    updatePedidoCompleto,
} from "../services/pedidoService";
import FichaTecnicaModal from "../components/fichas-tecnicas/FichaTecnicaModal";
import { getAllEtapasByFabricoId } from "../services/etapaService";
import ModalAtencao from "../components/geral/ModalAtencao";
import ModalConfirmacaoEscolha from "../components/geral/ModalConfirmacaoEscolha";
import {
    DetailPageSkeleton,
    DropdownOptionsSkeleton,
    LoadingButton,
    SkeletonBox,
} from "../components/geral/Loading";
import { parsePreco } from "../utils/preco";

const sectionTitleClass = "text-[20px] font-light text-[#404040] mb-4 font-['Outfit']";

const normalizarPrecoOpcional = (preco) => {
    if (preco === null || preco === undefined || preco === "") return null;

    const valorNormalizado =
        typeof preco === "string" ? preco.replace("R$", "").replace(",", ".").trim() : preco;
    const valorNumerico = Number(valorNormalizado);

    return Number.isFinite(valorNumerico) && valorNumerico > 0 ? valorNumerico : null;
};

function DropdownField({
    value,
    placeholder,
    options,
    isOpen,
    onToggle,
    onSelect,
    isSelectedOption,
    disabled = false,
    className = "",
    loading = false,
}) {
    const [termoBusca, setTermoBusca] = useState("");
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    const inputRef = useRef(null);
    const fieldDisabled = disabled || loading;

    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setTermoBusca("");
        }
    }

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const opcoesFiltradas = options.filter((option) =>
        option.label.toLowerCase().includes(termoBusca.toLowerCase()),
    );

    return (
        <div className={`relative ${isOpen ? "z-50" : "z-10"} ${className}`}>
            <div
                onClick={() => {
                    if (fieldDisabled) return;
                    if (!isOpen) onToggle();
                    inputRef.current?.focus();
                }}
                className={`w-full h-[39px] border border-[#898C8F] rounded-[10px] px-3 text-sm bg-white flex items-center justify-between transition-opacity ${
                    fieldDisabled ? "opacity-60 cursor-not-allowed" : "cursor-text"
                }`}
            >
                {loading ? (
                    <SkeletonBox className="h-[14px] w-36 rounded-[7px]" />
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        disabled={fieldDisabled}
                        value={isOpen ? termoBusca : value || ""}
                        onChange={(e) => {
                            setTermoBusca(e.target.value);
                            if (!isOpen) onToggle();
                        }}
                        placeholder={isOpen && value ? value : placeholder}
                        className="w-full bg-transparent outline-none text-[#707070] placeholder:text-[#898C8F] truncate disabled:cursor-not-allowed"
                    />
                )}

                <button
                    type="button"
                    disabled={fieldDisabled}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!fieldDisabled) onToggle();
                    }}
                    className="ml-2 py-2 shrink-0 outline-none disabled:cursor-not-allowed"
                >
                    <svg
                        className={`w-4 h-4 text-[#898C8F] transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
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
            </div>

            {isOpen && !fieldDisabled && (
                <>
                    <button
                        type="button"
                        aria-label="Fechar dropdown"
                        onClick={onToggle}
                        className="fixed inset-0 z-10 cursor-default outline-none"
                    />

                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-20 overflow-hidden rounded-[14px] border border-[#898C8F] bg-white max-h-[240px] overflow-y-auto scrollbar-sutil">
                        {loading ? (
                            <DropdownOptionsSkeleton />
                        ) : opcoesFiltradas.length === 0 ? (
                            <p className="px-3 py-3 text-sm text-[#898C8F] font-light">
                                Nenhuma opção encontrada
                            </p>
                        ) : (
                            opcoesFiltradas.map((option) => {
                                const selected = isSelectedOption(option);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => onSelect(option)}
                                        className={`relative overflow-hidden flex w-full items-center pl-[12px] pr-3 py-3 border-l-[3px] text-left text-[16px] transition-colors ${
                                            selected
                                                ? "border-[#C4F042] text-[#707070] bg-white"
                                                : "border-transparent text-[#707070] bg-white hover:bg-[#F5F5F5]"
                                        }`}
                                    >
                                        <span className="truncate">{option.label}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

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

const getProdutoId = (item) =>
    item?.produto?.id ?? item?.produto_id ?? item?.id_produto ?? item?.id;

const getReferenciaInterna = (item) =>
    item?.produto?.nome ?? item?.produto?.referencia ?? item?.nome ?? "-";

const extrairMensagemDeErro = (error) => {
    const mensagem = error?.response?.data?.message;

    if (Array.isArray(mensagem)) return mensagem.join(". ");

    return typeof mensagem === "string" ? mensagem : "";
};

const isoParaDataBr = (dataString) => {
    if (!dataString) return "";
    const data = new Date(dataString);
    if (Number.isNaN(data.getTime())) return "";

    const dia = String(data.getUTCDate()).padStart(2, "0");
    const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
    const ano = data.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
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

const obterFabricoDoPedido = (pedido) =>
    primeiroNumeroValido(
        pedido?.fabrico_id,
        pedido?.fabricoId,
        pedido?.fabrico?.id,
        pedido?.cliente?.fabrico_id,
        pedido?.fichas_tecnicas?.[0]?.fabrico_id,
    );

const isFichaPersistida = (ficha) =>
    !ficha?.isDraft && Number.isFinite(Number(ficha?.id)) && !String(ficha.id).startsWith("temp-");

const fichaTemPayloadDeModal = (ficha) =>
    Array.isArray(ficha?.itensPayload) && ficha.itensPayload.length > 0;

const montarFichaParaEnvio = (ficha, { etapaPadraoId, incluirDadosDoCliente }) => {
    const gradeVersaoId = ficha.gradeVersaoIdNova || ficha.gradeVersaoIdOriginal;
    const etapaAtualId = ficha.etapa_atual_id || ficha.etapaAtualId || etapaPadraoId;

    const payload = {
        produto_id: Number(ficha.produtoId ?? ficha.produto_id),
        quantidade: Number(ficha.quantidade) || 0,
        cores_ids: (ficha.selectedColorIds || []).map(Number),
        itens: (ficha.itensPayload || []).map((item) => ({
            cor_id: Number(item.cor_id),
            grade_versao_item_id: Number(item.grade_versao_item_id),
            quantidade: Number(item.quantidade) || 0,
        })),
        parceiros: (ficha.parceiroRows || []).map((parceiro) => ({
            parceiro_id: Number(parceiro.parceiroId ?? parceiro.id),
            operacao: parceiro.operacao || null,
            preco: normalizarPrecoOpcional(parceiro.preco),
        })),
    };

    if (gradeVersaoId) payload.grade_versao_id = Number(gradeVersaoId);
    if (etapaAtualId) payload.etapa_atual_id = Number(etapaAtualId);

    if (incluirDadosDoCliente) {
        payload.nome_para_cliente = ficha.referenciaCliente ?? ficha.ref_cliente ?? "";
        payload.preco_padrao = parsePreco(
            ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? 0,
        );
    }

    return payload;
};

const converterDetalheParaRascunhoModal = (detalhe, fichaLinha = {}) => {
    const itens = detalhe?.ficha_tecnica_itens || [];
    const coresMapa = {};
    const selectedColorIds = [];
    const itensPayload = [];

    itens.forEach((item) => {
        const corId = item?.cor_id ?? item?.cor?.id;
        if (corId == null) return;

        if (!coresMapa[corId]) {
            coresMapa[corId] = item.cor || { id: corId };
            selectedColorIds.push(Number(corId));
        }

        itensPayload.push({
            cor_id: Number(corId),
            grade_versao_item_id: Number(item.grade_versao_item_id),
            quantidade: Number(item.quantidade) || 0,
        });
    });

    const parceiroRows = (detalhe?.ficha_parceiro || detalhe?.parceiros || []).map((vinculo) => ({
        parceiroId: vinculo.parceiro_id ?? vinculo.parceiro?.id,
        parceiroNome: vinculo.parceiro?.nome || "",
        operacao: vinculo.operacao || "",
        preco: vinculo.parceiro?.preco ?? vinculo.valor ?? null,
        isDirty: false,
        isNew: false,
    }));

    const produtoId =
        detalhe?.produto?.id ??
        detalhe?.produto_id ??
        fichaLinha.produtoId ??
        fichaLinha.produto_id;

    return {
        id: detalhe?.id ?? fichaLinha.id,
        isDraft: false,
        produtoId,
        produto_id: produtoId,
        foto: detalhe?.produto?.foto ?? fichaLinha.foto,
        referenciaInterna:
            detalhe?.produto?.nome ?? fichaLinha.referenciaInterna ?? fichaLinha.ref_interna ?? "-",
        referenciaCliente: fichaLinha.referenciaCliente ?? fichaLinha.ref_cliente ?? "",
        preco_padrao: fichaLinha.preco_padrao ?? fichaLinha.preco_unitario ?? null,
        custo_total: detalhe?.produto?.custo_total ?? fichaLinha.custo_total ?? null,
        cores: Object.values(coresMapa),
        selectedColorIds,
        itensPayload,
        parceiroRows,
        quantidade: Number(detalhe?.quantidade) || Number(fichaLinha.quantidade) || 0,
        gradeVersaoIdOriginal: detalhe?.grade_versao_id,
        gradeVersaoIdNova: detalhe?.grade_versao_id,
        etapa_atual_id: detalhe?.etapa_atual_id ?? fichaLinha.etapa_atual_id,
        produto: detalhe?.produto,
    };
};

const mapearFichaParaTabela = (ficha, relacaoClienteProduto) => {
    const quantidade = Number(ficha?.quantidade) || Number(ficha?.quantidade_pecas) || 0;
    const produtoId = ficha?.produto?.id ?? ficha?.produto_id ?? ficha?.produtoId;

    return {
        id: ficha?.id,
        isDraft: false,
        produtoId,
        produto_id: produtoId,
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
        etapa_atual_id: ficha?.etapa_atual_id ?? ficha?.etapaAtualId ?? null,
        gradeVersaoIdOriginal: ficha?.grade_versao_id,
        gradeVersaoIdNova: ficha?.grade_versao_id,
        produto: ficha?.produto,
    };
};

export default function PedidosEditar() {
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
    const [primeiraEtapaId, setPrimeiraEtapaId] = useState(null);

    const [openDropdown, setOpenDropdown] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [referenciasDisponiveis, setReferenciasDisponiveis] = useState([]);
    const [carregandoClientes, setCarregandoClientes] = useState(true);
    const [carregandoReferencias, setCarregandoReferencias] = useState(false);
    const [salvandoPedido, setSalvandoPedido] = useState(false);

    const [isSobDemanda, setIsSobDemanda] = useState(true);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [referenciaSelecionada, setReferenciaSelecionada] = useState(null);
    const [dataPrevista, setDataPrevista] = useState("");

    const [modalFichaAberto, setModalFichaAberto] = useState(false);
    const [referenciaParaModal, setReferenciaParaModal] = useState(null);
    const [fichaInicialModal, setFichaInicialModal] = useState(null);
    const [chaveFichaEmEdicao, setChaveFichaEmEdicao] = useState(null);
    const [abrindoFicha, setAbrindoFicha] = useState(false);

    const [fichas, setFichas] = useState([]);
    const [erro, setErro] = useState("");
    const [modalAtencaoAberto, setModalAtencaoAberto] = useState(false);
    const [modalTrocaClienteAberto, setModalTrocaClienteAberto] = useState(false);
    const [clientePendente, setClientePendente] = useState(null);
    const [trocandoCliente, setTrocandoCliente] = useState(false);

    useEffect(() => {
        if (!fabricoId) return;

        let ignorar = false;

        const carregarEtapas = async () => {
            try {
                const etapas = await getAllEtapasByFabricoId(fabricoId);
                if (ignorar) return;

                if (etapas && etapas.length > 0) {
                    const etapaInicial = etapas
                        .sort((a, b) => a.ordem - b.ordem)
                        .find((etapa) => etapa.ativa === true);

                    if (etapaInicial) {
                        setPrimeiraEtapaId(etapaInicial.id);
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar as etapas do fabrico:", error);
            }
        };

        carregarEtapas();

        return () => {
            ignorar = true;
        };
    }, [fabricoId]);

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

                if (produzSobDemanda && fabricoId) {
                    try {
                        const listaClientes = await getClientes(fabricoId);
                        if (ignorar) return;
                        setClientes(listaClientes || []);
                    } catch (error) {
                        console.error("Erro ao carregar clientes:", error);
                        if (!ignorar) {
                            setClientes([]);
                            setErro("Não foi possível carregar clientes.");
                        }
                    }
                } else {
                    setClientes([]);
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
                    produtos.forEach((produtoItem) => {
                        if (produtoItem?.id != null) {
                            mapaCustos.set(String(produtoItem.id), produtoItem.custo_total);
                        }
                    });
                }

                if (ignorar) return;

                setPedido(dadosPedido);
                setIsSobDemanda(produzSobDemanda);
                setClienteSelecionado(dadosPedido.cliente || null);
                setDataPrevista(isoParaDataBr(dadosPedido.data_prevista));
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
                if (!ignorar) {
                    setLoading(false);
                    setCarregandoClientes(false);
                }
            }
        };

        carregarPedido();

        return () => {
            ignorar = true;
        };
    }, [id, fabricoId]);

    useEffect(() => {
        if (isSobDemanda && !clienteSelecionado?.id) {
            setReferenciasDisponiveis([]);
            setReferenciaSelecionada(null);
            return;
        }
        if (!fabricoId || loading) return;

        let ignorar = false;
        const carregarReferencias = async () => {
            setCarregandoReferencias(true);
            try {
                let listaProdutosCliente = [];
                const promessas = [getProdutosPorFabrico(fabricoId)];
                if (isSobDemanda && clienteSelecionado?.id) {
                    promessas.push(getProdutosDoCliente(clienteSelecionado.id));
                }
                const resultados = await Promise.all(promessas);
                const todosProdutos = resultados[0];
                if (resultados[1]) listaProdutosCliente = resultados[1];
                if (ignorar) return;

                const mapaAssociados = new Map(
                    (listaProdutosCliente || []).map((item) => [String(getProdutoId(item)), item]),
                );
                const idsJaAdicionados = new Set(
                    fichas.map((ficha) => String(ficha.produtoId ?? ficha.produto_id)),
                );

                const referenciasOrdenadas = (todosProdutos || [])
                    .filter((produto) => !idsJaAdicionados.has(String(produto.id)))
                    .map((produto) => {
                        const associado = mapaAssociados.get(String(produto.id));
                        if (associado) return { ...associado, produto, associadoAoCliente: true };
                        return { produto, produto_id: produto.id, associadoAoCliente: false };
                    })
                    .sort((a, b) => {
                        if (a.associadoAoCliente !== b.associadoAoCliente)
                            return a.associadoAoCliente ? -1 : 1;
                        return getReferenciaInterna(a).localeCompare(
                            getReferenciaInterna(b),
                            "pt-BR",
                            { sensitivity: "base" },
                        );
                    });
                setReferenciasDisponiveis(referenciasOrdenadas);
            } catch (error) {
                if (!ignorar) setErro("Não foi possível carregar as referências.");
                console.error("Erro ao carregar referências:", error);
            } finally {
                if (!ignorar) setCarregandoReferencias(false);
            }
        };
        carregarReferencias();
        return () => {
            ignorar = true;
        };
    }, [clienteSelecionado, fabricoId, fichas, isSobDemanda, loading]);

    const opcoesClientes = clientes.map((cliente) => ({
        value: String(cliente.id),
        label: cliente.nome,
        raw: cliente,
    }));

    const opcoesReferencias = referenciasDisponiveis.map((item) => ({
        value: String(getProdutoId(item)),
        label: getReferenciaInterna(item),
        raw: item,
    }));

    const toggleDropdown = (nome) => setOpenDropdown((atual) => (atual === nome ? null : nome));

    const aplicarCliente = (cliente) => {
        setClienteSelecionado(cliente);
        setReferenciaSelecionada(null);
        setErro("");
    };

    const handleSelecionarCliente = (opcao) => {
        setOpenDropdown(null);

        const mesmoCliente = String(clienteSelecionado?.id || "") === String(opcao.raw?.id || "");
        if (mesmoCliente) return;

        if (fichas.length > 0) {
            setClientePendente(opcao.raw);
            setModalTrocaClienteAberto(true);
            return;
        }

        aplicarCliente(opcao.raw);
    };

    const cancelarTrocaCliente = () => {
        if (trocandoCliente) return;
        setModalTrocaClienteAberto(false);
        setClientePendente(null);
    };

    const confirmarTrocaCliente = async () => {
        if (!clientePendente || trocandoCliente) return;

        const novoCliente = clientePendente;
        setTrocandoCliente(true);

        try {
            const produtosDoNovoCliente = await getProdutosDoCliente(novoCliente.id);
            const relacoesPorProduto = new Map(
                (produtosDoNovoCliente || []).map((item) => [String(getProdutoId(item)), item]),
            );

            setFichas((fichasAtuais) =>
                fichasAtuais.map((ficha) => {
                    const produtoId = ficha.produtoId ?? ficha.produto_id;
                    const relacao = relacoesPorProduto.get(String(produtoId));
                    const referenciaCliente = relacao?.nome_para_cliente ?? "";
                    const precoPadrao = relacao?.preco_padrao ?? null;

                    return {
                        ...ficha,
                        associadoAoCliente: Boolean(relacao),
                        referenciaCliente,
                        ref_cliente: referenciaCliente,
                        preco_padrao: precoPadrao,
                        preco_unitario: null,
                        preco: null,
                        subtotal: undefined,
                    };
                }),
            );

            aplicarCliente(novoCliente);
            setModalTrocaClienteAberto(false);
            setClientePendente(null);
        } catch (error) {
            console.error("Erro ao carregar produtos do novo cliente:", error);
            setErro("Não foi possível trocar o cliente. Tente novamente.");
        } finally {
            setTrocandoCliente(false);
        }
    };

    const handleSelecionarReferencia = async (opcao) => {
        if (isSobDemanda && !clienteSelecionado) {
            setErro("Selecione um cliente antes de adicionar a referência.");
            return;
        }

        let referenciaCliente = "";
        let preco_padrao = null;

        if (isSobDemanda && clienteSelecionado?.id) {
            try {
                const produtosDoCliente = await getProdutosDoCliente(clienteSelecionado.id);
                const produtoClienteSelecionado = (produtosDoCliente || []).find(
                    (item) => String(getProdutoId(item)) === String(opcao.value),
                );

                referenciaCliente = produtoClienteSelecionado?.nome_para_cliente || "";
                preco_padrao = produtoClienteSelecionado?.preco_padrao || null;
            } catch (error) {
                console.error("Erro ao buscar produto do cliente:", error);
            }
        }

        const dadosParaModal = {
            ...opcao.raw?.produto,
            clienteNome: clienteSelecionado?.nome,
            referenciaCliente,
            preco_padrao,
            id: getProdutoId(opcao.raw),
            associadoAoCliente: opcao.raw?.associadoAoCliente ?? false,
        };

        setReferenciaParaModal(dadosParaModal);
        setFichaInicialModal(null);
        setChaveFichaEmEdicao(null);
        setModalFichaAberto(true);
        setReferenciaSelecionada(null);
        setOpenDropdown(null);
        setErro("");
    };

    const handleDataPrevistaChange = (e) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 8) v = v.slice(0, 8);

        if (v.length > 4) {
            v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        } else if (v.length > 2) {
            v = `${v.slice(0, 2)}/${v.slice(2)}`;
        }
        setDataPrevista(v);
    };

    const fecharModalFicha = () => {
        setModalFichaAberto(false);
        setReferenciaParaModal(null);
        setFichaInicialModal(null);
        setChaveFichaEmEdicao(null);
    };

    const montarProdutoParaModal = (ficha, extras = {}) => ({
        id: ficha.produtoId ?? ficha.produto_id ?? ficha.produto?.id,
        nome: ficha.referenciaInterna || ficha.produto?.nome,
        foto: ficha.foto || ficha.produto?.foto,
        gradeVersaoId: ficha.gradeVersaoIdNova || ficha.gradeVersaoIdOriginal,
        grade_versao_id: ficha.gradeVersaoIdNova || ficha.gradeVersaoIdOriginal,
        referenciaCliente: ficha.referenciaCliente ?? ficha.ref_cliente ?? "",
        preco_padrao: ficha.preco_padrao ?? null,
        custo_total: ficha.custo_total ?? ficha.produto?.custo_total ?? null,
        associadoAoCliente: ficha.associadoAoCliente ?? false,
        clienteNome: clienteSelecionado?.nome,
        ...extras,
    });

    const handleAbrirFicha = async (ficha, itemKey) => {
        if (salvandoPedido || abrindoFicha || trocandoCliente) return;

        setErro("");
        setAbrindoFicha(true);

        try {
            let fichaParaModal = ficha;

            if (!fichaTemPayloadDeModal(ficha) && isFichaPersistida(ficha)) {
                const detalhe = await findOne(ficha.id);
                fichaParaModal = converterDetalheParaRascunhoModal(detalhe, ficha);
            }

            setChaveFichaEmEdicao(itemKey);
            setFichaInicialModal(fichaParaModal);
            setReferenciaParaModal(montarProdutoParaModal(fichaParaModal));
            setModalFichaAberto(true);
        } catch (error) {
            console.error("Erro ao abrir ficha técnica para edição:", error);
            setErro("Não foi possível abrir a ficha técnica. Tente novamente.");
        } finally {
            setAbrindoFicha(false);
        }
    };

    const handleFichaSalvaNoModal = (rascunhoFicha) => {
        const fichaAtualizada = {
            ...rascunhoFicha,
            foto: rascunhoFicha.foto || referenciaParaModal?.foto || fichaInicialModal?.foto,
            preco_padrao:
                rascunhoFicha.preco_padrao ??
                referenciaParaModal?.preco_padrao ??
                fichaInicialModal?.preco_padrao,
            custo_total:
                rascunhoFicha.custo_total ??
                referenciaParaModal?.custo_total ??
                fichaInicialModal?.custo_total,
            referenciaInterna:
                rascunhoFicha.referenciaInterna ||
                rascunhoFicha.nome ||
                referenciaParaModal?.nome ||
                fichaInicialModal?.referenciaInterna,
            referenciaCliente:
                rascunhoFicha.referenciaCliente ||
                referenciaParaModal?.referenciaCliente ||
                fichaInicialModal?.referenciaCliente ||
                "",
            cores: rascunhoFicha.cores || rascunhoFicha.selectedColors || [],
            etapa_atual_id:
                rascunhoFicha.etapa_atual_id ||
                rascunhoFicha.etapaAtualId ||
                fichaInicialModal?.etapa_atual_id ||
                primeiraEtapaId,
            associadoAoCliente:
                rascunhoFicha.associadoAoCliente ??
                referenciaParaModal?.associadoAoCliente ??
                fichaInicialModal?.associadoAoCliente ??
                false,
        };

        if (chaveFichaEmEdicao != null) {
            setFichas((prev) =>
                prev.map((ficha, index) => {
                    const itemKey = ficha.id ?? index;
                    if (itemKey !== chaveFichaEmEdicao) return ficha;
                    return {
                        ...ficha,
                        ...fichaAtualizada,
                        id: ficha.id,
                        isDraft: Boolean(ficha.isDraft),
                    };
                }),
            );
        } else {
            setFichas((prev) => [
                ...prev,
                {
                    ...fichaAtualizada,
                    isDraft: true,
                },
            ]);
        }

        setChaveFichaEmEdicao(null);
        setFichaInicialModal(null);
        setReferenciaParaModal(null);
    };

    const handleRemoverFicha = (identificador) => {
        setFichas((prev) =>
            prev.filter((ficha, index) => {
                const itemKey = ficha.id ?? index;
                return itemKey !== identificador;
            }),
        );
    };

    const handleAtualizarFicha = (identificador, campo, valor) => {
        setFichas((prevFichas) =>
            prevFichas.map((ficha, index) => {
                const ehAFicha =
                    ficha.id !== undefined && ficha.id !== null
                        ? ficha.id === identificador
                        : index === identificador;

                if (ehAFicha) {
                    return { ...ficha, [campo]: valor, subtotal: undefined };
                }
                return ficha;
            }),
        );
    };

    const handleSalvarPedido = async () => {
        if (trocandoCliente) {
            setErro("Aguarde a atualização dos produtos do novo cliente.");
            return;
        }

        if (isSobDemanda && !clienteSelecionado) {
            setErro("Selecione um cliente para prosseguir.");
            return;
        }

        if (fichas.length === 0) {
            setErro("Adicione pelo menos uma ficha técnica ao pedido.");
            return;
        }

        if (isSobDemanda) {
            const temPrecoInvalido = fichas.some((ficha) => {
                const preco = parsePreco(
                    ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? 0,
                );
                return preco <= 0;
            });

            if (temPrecoInvalido) {
                setErro(
                    "Não é possível salvar o pedido: existem fichas técnicas com valor unitário zerado.",
                );
                return;
            }
        }

        if (dataPrevista && dataPrevista.length < 10) {
            setErro("Por favor, insira uma data de previsão completa (dd/mm/aaaa).");
            return;
        }

        setSalvandoPedido(true);
        setErro("");

        try {
            let dataFormatadaBackend = undefined;
            if (dataPrevista && dataPrevista.length === 10) {
                const [dia, mes, ano] = dataPrevista.split("/");
                dataFormatadaBackend = new Date(`${ano}-${mes}-${dia}T12:00:00.000Z`).toISOString();
            }

            const clienteId = clienteSelecionado?.id ? Number(clienteSelecionado.id) : null;

            await updatePedidoCompleto(id, {
                cliente_id: clienteId,
                data_prevista: dataFormatadaBackend,
                fichas: fichas.map((ficha) => {
                    const incluirDadosDoCliente = isSobDemanda && Boolean(clienteId);
                    const persistida = isFichaPersistida(ficha);
                    const editadaNoModal = fichaTemPayloadDeModal(ficha);

                    if (persistida && !editadaNoModal) {
                        const payloadBase = {
                            id: Number(ficha.id),
                            produto_id: Number(ficha.produtoId ?? ficha.produto_id),
                            quantidade: Number(ficha.quantidade) || 0,
                        };

                        if (incluirDadosDoCliente) {
                            payloadBase.nome_para_cliente =
                                ficha.referenciaCliente ?? ficha.ref_cliente ?? "";
                            payloadBase.preco_padrao = parsePreco(
                                ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? 0,
                            );
                        }

                        return payloadBase;
                    }

                    const payloadCompleto = montarFichaParaEnvio(ficha, {
                        etapaPadraoId: primeiraEtapaId,
                        incluirDadosDoCliente,
                    });

                    if (persistida) {
                        return { id: Number(ficha.id), ...payloadCompleto };
                    }

                    return payloadCompleto;
                }),
            });

            navigate(`/pedidos/${id}`);
        } catch (error) {
            console.error("Erro ao salvar pedido:", error);
            setErro(
                extrairMensagemDeErro(error) ||
                    "Falha ao salvar pedido. Verifique os dados e tente novamente.",
            );
        } finally {
            setSalvandoPedido(false);
        }
    };

    const handleAcessoNegadoConfirm = () => {
        setModalAtencaoAberto(false);
        navigate("/pedidos", { replace: true });
    };

    const numeroPedido = pedido?.numero ?? pedido?.id ?? "-";

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
                            <div className="flex items-start gap-3">
                                <img
                                    src="/pedidos-desativado.png"
                                    alt=""
                                    className="h-8 w-8 shrink-0 object-contain brightness-0 opacity-[0.85]"
                                />
                                <div className="flex flex-col gap-0 items-start">
                                    <h1 className="text-[28px] sm:text-[30px] font-light text-[#404040] tracking-tight leading-none">
                                        {isSobDemanda ? "Editar Pedido" : "Editar Produção"}
                                    </h1>
                                    <p className="text-[18px] font-light text-[#898C8F] mt-0.5 leading-none">
                                        Nº {numeroPedido}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <section className="mb-4">
                            <div className="flex flex-wrap gap-4 justify-between items-start">
                                <div className="flex flex-col">
                                    <h2 className={sectionTitleClass}>Adicionar ficha técnica</h2>
                                    <div className="flex flex-row flex-wrap gap-4">
                                        {isSobDemanda && (
                                            <div className="w-[320px] shrink-0">
                                                <DropdownField
                                                    value={clienteSelecionado?.nome || ""}
                                                    placeholder="Selecionar cliente"
                                                    options={opcoesClientes}
                                                    isOpen={openDropdown === "cliente"}
                                                    onToggle={() => toggleDropdown("cliente")}
                                                    onSelect={handleSelecionarCliente}
                                                    isSelectedOption={(option) =>
                                                        String(clienteSelecionado?.id) ===
                                                        option.value
                                                    }
                                                    disabled={carregandoClientes || salvandoPedido}
                                                    loading={carregandoClientes}
                                                />
                                            </div>
                                        )}

                                        <div className="w-[320px] shrink-0">
                                            <DropdownField
                                                value={referenciaSelecionada?.label || ""}
                                                placeholder="Adicionar referência*"
                                                options={opcoesReferencias}
                                                isOpen={openDropdown === "referencia"}
                                                onToggle={() => toggleDropdown("referencia")}
                                                onSelect={handleSelecionarReferencia}
                                                isSelectedOption={(option) =>
                                                    referenciaSelecionada?.value === option.value
                                                }
                                                disabled={
                                                    (isSobDemanda && !clienteSelecionado) ||
                                                    carregandoReferencias ||
                                                    salvandoPedido
                                                }
                                                loading={carregandoReferencias}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col w-fit max-w-full">
                                    <h2 className={sectionTitleClass}>Previsão de entrega</h2>
                                    <input
                                        type="text"
                                        disabled={salvandoPedido}
                                        value={dataPrevista}
                                        onChange={handleDataPrevistaChange}
                                        placeholder="Data"
                                        className={`w-full h-[39px] border border-[#898C8F] rounded-[10px] px-3 bg-white outline-none text-[#707070] placeholder:text-[#898C8F]/60 text-sm font-['Outfit'] transition-opacity ${
                                            salvandoPedido ? "opacity-60 cursor-not-allowed" : ""
                                        }`}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="mb-10">
                            <TabelaFichaTecnica
                                fichas={fichas}
                                isSobDemanda={isSobDemanda}
                                onRemoverFicha={handleRemoverFicha}
                                onAtualizarFicha={handleAtualizarFicha}
                                onAbrirFicha={handleAbrirFicha}
                                bloqueada={salvandoPedido || abrindoFicha}
                            />
                        </div>

                        <div className="flex flex-wrap justify-end gap-4 pt-2">
                            <button
                                type="button"
                                disabled={salvandoPedido}
                                onClick={() => navigate(`/pedidos/${id}`)}
                                className="border border-[#D75757] bg-[#FFFFFF] hover:bg-[#FDF1F1] text-[#D75757] h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancelar
                            </button>
                            <LoadingButton
                                type="button"
                                loading={salvandoPedido}
                                loadingText="Salvando..."
                                onClick={handleSalvarPedido}
                                className="bg-[#A9E2F2] hover:bg-[#A2DCED] text-[#4696AD] h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px] disabled:opacity-50 flex items-center justify-center"
                            >
                                Salvar alterações
                            </LoadingButton>
                        </div>

                        {erro ? (
                            <p className="pt-4 text-sm text-[#D75757] text-right">{erro}</p>
                        ) : null}
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

            <ModalConfirmacaoEscolha
                isOpen={modalTrocaClienteAberto}
                onClose={cancelarTrocaCliente}
                onConfirm={confirmarTrocaCliente}
                mensagem={`Ao selecionar o cliente ${clientePendente?.nome || ""} todas as Fichas Técnicas criadas estarão associadas a esse cliente, deseja confirmar?`}
            />

            <FichaTecnicaModal
                isOpen={modalFichaAberto}
                onClose={fecharModalFicha}
                produto={referenciaParaModal}
                fabricoId={fabricoId}
                fichaInicial={fichaInicialModal}
                onFichaCreated={handleFichaSalvaNoModal}
            />
        </>
    );
}
