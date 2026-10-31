import ConfirmacaoFichaModal from "./ConfirmacaoFichaModal";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
    replaceMatriz,
    updateParceiroProdutoPrice,
    createParceiroProduto,
} from "../../services/fichaTecnicaItemService";
import { getCores } from "../../services/corService";
import {
    updateFichaTecnicaParceiro,
    deleteFichaTecnicaParceiro,
    createFichaParceiro,
} from "../../services/fichaParceiroService";
import { getProdutosDoCliente } from "../../services/clientesService";
import ProdutoParceiros from "../produtos/ProdutoParceiros";
import ImagePreview from "../geral/ImagePreview";
import { preventNumberInputWheel } from "../../utils/preventNumberInputWheel";
import { getAviamentosDoProduto, getParceiroByProduto } from "../../services/produtoService";
import { getParceiros } from "../../services/parceiroService";
import { ehParceiroDeCostura } from "../../utils/etapaDoParceiro.js";
import CorModal from "./CorModal";
import EstampaModal from "./EstampaModal";
import RelatorioDeAcabamento from "./RelatorioDeAcabamento";
import { getAllEtapas } from "../../services/etapaService";
import {
    calcularProporcoesGrade,
    isReferenciaProporcao,
    obterReferenciaProporcao,
} from "../../utils/gradeProportions";

function snapshotFicha(cores, matriz, parceiros, removidos, relatorio) {
    return JSON.stringify({
        cores: cores.map((cor) => cor.id).sort((a, b) => a - b),
        quantidades: cores
            .flatMap((cor) =>
                Object.entries(matriz[cor.id] || {})
                    .filter(([, item]) => Number(item.quantidade) > 0)
                    .map(([sizeId, item]) => [cor.id, sizeId, Number(item.quantidade)]),
            )
            .sort((a, b) => String(a).localeCompare(String(b))),
        parceiros,
        removidos,
        relatorio,
    });
}

const FloatingInput = ({
    label,
    valor,
    readOnly = false,
    type = "text",
    onChange,
    muted = false,
}) => (
    <div
        className={`relative border rounded-[12px] h-[48px] px-3 flex items-center mt-2 w-full min-w-0 bg-white max-md:mt-0 max-md:h-auto max-md:flex-col max-md:items-stretch max-md:rounded-none max-md:border-0 max-md:px-0 md:h-[44px] md:rounded-[10px] lg:h-[39px] ${
            muted ? "border-[#D7D7D7]" : "border-[#7B7D80]"
        }`}
    >
        <span
            className={`absolute -top-[9px] left-2 bg-white px-1 text-[12px] max-md:static max-md:p-0 max-md:text-[11px] max-md:leading-4 max-md:text-[#898C8F] lg:text-[11px] ${
                muted ? "text-[#D7D7D7]" : "text-[#7B7D80]"
            }`}
        >
            {label}
        </span>
        <input
            type={type}
            value={valor || ""}
            readOnly={readOnly}
            title={valor || undefined}
            onChange={onChange}
            className={`w-full text-ellipsis text-[16px] outline-none bg-transparent max-md:text-[14px] max-md:leading-[18px] max-md:text-[#404040] md:text-[15px] lg:text-[14px] ${
                muted ? "text-[#D7D7D7]" : "text-[#7B7D80]"
            } ${readOnly ? "cursor-not-allowed opacity-70 max-md:opacity-100" : ""}`}
        />
    </div>
);

const simplificarUnidade = (unidade) => {
    const unidadesSimplificadas = {
        METRO: "m",
        CENTIMETRO: "cm",
        GRAMA: "g",
        QUILOGRAMA: "kg",
        UNIDADE: "und",
        PAR: "par",
    };
    return unidadesSimplificadas[unidade] || unidade;
};

const ColorDropdown = ({
    coresDisponiveis,
    coresSelecionadas,
    onToggleCor,
    onCreateCor,
    onCreateEstampa,
}) => {
    const [aberto, setAberto] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target instanceof Element && event.target.closest("[data-image-preview]")) {
                return;
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setAberto(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative mt-2 w-full" ref={dropdownRef}>
            <div
                className="border border-[#898C8F] rounded-[12px] h-[48px] px-3 flex justify-between items-center bg-white cursor-pointer md:h-[44px] md:rounded-[10px] lg:h-[39px]"
                onClick={() => setAberto(!aberto)}
            >
                <span className="absolute -top-[9px] left-2 bg-white px-1 text-[12px] text-[#898C8F] lg:text-[11px]">
                    Selecionar cores
                </span>
                <span className="text-[16px] text-[#707070] md:text-[15px] lg:text-[14px]">
                    {coresSelecionadas.length === 0 ? "Selecione..." : "Selecionar cores"}
                </span>
                <span
                    className={`text-[#898C8F] text-[10px] transition-transform ${aberto ? "rotate-180" : ""}`}
                >
                    {/* Celular e tablet: chevron vazado de pontas arredondadas; desktop mantém o ▼ */}
                    <svg
                        className="lg:hidden"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                    <span className="hidden lg:inline">▼</span>
                </span>
            </div>

            {aberto && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#D9D9D9] rounded-[10px] shadow-lg z-20 overflow-hidden">
                    <div className="max-h-[240px] overflow-y-auto scrollbar-sutil lg:max-h-[180px]">
                        <button
                            type="button"
                            onClick={() => {
                                setAberto(false);
                                onCreateCor();
                            }}
                            className="flex min-h-[44px] w-full items-center px-4 py-2.5 text-left text-[14px] font-medium text-[#4696AD] bg-white hover:bg-[#F4F4F4] transition-colors lg:min-h-0"
                        >
                            + Nova cor
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setAberto(false);
                                onCreateEstampa();
                            }}
                            className="flex min-h-[44px] w-full items-center px-4 py-2.5 text-left text-[14px] font-medium text-[#4696AD] bg-white hover:bg-[#F4F4F4] transition-colors lg:min-h-0"
                        >
                            + Nova estampa
                        </button>

                        {coresDisponiveis.length === 0 ? (
                            <div className="px-4 py-3 text-[14px] text-[#898C8F]">
                                Nenhuma cor cadastrada.
                            </div>
                        ) : (
                            coresDisponiveis.map((cor) => {
                                const isSelected = coresSelecionadas.some((c) => c.id === cor.id);
                                const isEstampa = String(cor.tipo).toUpperCase() === "ESTAMPA";
                                return (
                                    <div
                                        key={cor.id}
                                        title={cor.nome}
                                        className={`flex min-h-[44px] w-full items-center border-l-[4px] px-4 py-2.5 transition-colors lg:min-h-0 bg-white text-[#707070] hover:bg-[#F4F4F4] ${
                                            isSelected
                                                ? "border-l-[3px] border-l-[#C4F042]"
                                                : "border-l-transparent"
                                        }`}
                                    >
                                        {isEstampa ? (
                                            <ImagePreview
                                                src={cor.foto}
                                                alt={cor.nome}
                                                title={cor.nome}
                                            />
                                        ) : (
                                            <span
                                                className="h-[20px] w-[20px] shrink-0 rounded-[6px] border border-[#D9D9D9]"
                                                style={{
                                                    backgroundColor: cor.codigo_hex || "#E5E5E5",
                                                }}
                                            />
                                        )}
                                        <button
                                            type="button"
                                            title={cor.nome}
                                            onClick={() => onToggleCor(cor)}
                                            className="ml-3 flex min-w-0 flex-1 items-center justify-between text-left"
                                        >
                                            <span className="truncate font-light">{cor.nome}</span>
                                            {isSelected ? (
                                                <img
                                                    src="/check_cinza.png"
                                                    className="ml-2 h-[8px] w-[12px] shrink-0"
                                                    alt=""
                                                />
                                            ) : (
                                                <img
                                                    src="/mais_cinza.png"
                                                    className="ml-2 h-[12px] w-[12px] shrink-0"
                                                    alt=""
                                                />
                                            )}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ColorPill = ({ nome, onRemove }) => (
    <div className="bg-[#A9E2F2] text-[#4696AD] h-[40px] pl-3 pr-2 rounded-full text-[14px] flex items-center gap-2 md:h-[36px] lg:h-auto lg:px-3 lg:py-1 lg:text-[13px]">
        {nome}
        <button
            type="button"
            onClick={onRemove}
            className="relative flex items-center justify-center before:absolute before:-inset-3 before:content-[''] lg:before:hidden"
        >
            <div className="w-[20px] h-[20px] bg-[#4696AD] rounded-full flex items-center justify-center lg:w-[14px] lg:h-[14px]">
                <img
                    src="/fechar-branco.png"
                    alt="Remover cor"
                    className="w-[10px] h-[10px] object-contain lg:w-[9px] lg:h-[9px]"
                />
            </div>
        </button>
    </div>
);

const BORDER_DARK_05 = { borderWidth: "0.5px", borderStyle: "solid", borderColor: "#7B7D80" };

// Celular: a coluna da cor fica fixa enquanto a grade rola na horizontal
const COLUNA_FIXA =
    "sticky left-0 z-10 shadow-[1px_0_0_#CBD3D6,6px_0_8px_-6px_rgba(0,0,0,0.22)] md:static md:shadow-none";

const CLASSE_CAMPO_CARTAO =
    "flex h-[44px] w-full min-w-0 items-center rounded-[10px] border border-[#898C8F] bg-white px-3 text-[16px] text-[#404040] focus-within:border-[#4696AD]";

export default function EdicaoFichaTecnicaModal({
    isOpen,
    onClose,
    onSuccess,
    fichaId,
    dadosFicha,
}) {
    const [loading, setLoading] = useState(false);
    const [saveError, setSaveError] = useState("");

    const [coresSelecionadas, setCoresSelecionadas] = useState([]);
    const [todasCoresDisponiveis, setTodasCoresDisponiveis] = useState([]);
    const [confirmarSaida, setConfirmarSaida] = useState(false);
    const initialSnapshot = useRef("");
    const [matrizQuantidades, setMatrizQuantidades] = useState({});
    const [referenceSizeId, setReferenceSizeId] = useState(null);
    const [parceiros, setParceiros] = useState([]);
    const [parceirosRemovidos, setParceirosRemovidos] = useState([]);
    const [referenciaCliente, setReferenciaCliente] = useState("-");
    const [isProdutoParceirosOpen, setIsProdutoParceirosOpen] = useState(false);
    const [parceirosDisponiveis, setParceirosDisponiveis] = useState([]);
    const [corModalOpen, setCorModalOpen] = useState(false);
    const [estampaModalOpen, setEstampaModalOpen] = useState(false);
    const [validacaoPrecoExibida, setValidacaoPrecoExibida] = useState(false);
    const [aviamentos, setAviamentos] = useState([]);
    const [ultimaEtapaId, setUltimaEtapaId] = useState(null);
    const [relatorioAcabamento, setRelatorioAcabamento] = useState({
        defeitoCostura: 0,
        defeitoTecido: 0,
        retiradas: 0,
        sobras: 0,
    });
    const corpoRef = useRef(null);
    const [tentativasSalvar, setTentativasSalvar] = useState(0);

    const sizeItems = useMemo(
        () => dadosFicha?.grade_versao?.itens || [],
        [dadosFicha?.grade_versao?.itens],
    );

    const produtoId = dadosFicha?.produto?.id;
    useEffect(() => {
        let isCurent = true;

        const carregarAviamentos = async () => {
            if (produtoId) {
                try {
                    const aviamentosDosProdutos = await getAviamentosDoProduto(produtoId);
                    if (isCurent) setAviamentos(aviamentosDosProdutos || []);
                } catch (err) {
                    console.error("Erro ao carregar aviamento para impressão", err);
                    if (isCurent) setAviamentos([]);
                }
            } else {
                if (isCurent) setAviamentos([]);
            }
        };
        carregarAviamentos();

        return () => {
            isCurent = false;
        };
    }, [produtoId]);

    useEffect(() => {
        let isCurrent = true;

        getAllEtapas()
            .then((etapas) => {
                if (!isCurrent) return;
                const etapasAtivas = (etapas || []).filter((e) => e.ativa);
                const etapasOrdenadas = etapasAtivas.sort((a, b) => a.ordem - b.ordem);
                const ultima = etapasOrdenadas[etapasOrdenadas.length - 1];
                setUltimaEtapaId(ultima?.id ?? null);
            })
            .catch((error) => {
                console.error("Erro ao verificar última etapa", error);
                setUltimaEtapaId(null);
            });

        return () => {
            isCurrent = false;
        };
    }, [dadosFicha?.fabrico_id]);
    const isUltimaEtapa = ultimaEtapaId != null && dadosFicha?.etapa_atual_id == ultimaEtapaId;

    const carregarParceirosDisponiveis = useCallback(async () => {
        if (!dadosFicha?.produto_id) return;
        try {
            const [parceirosDoFabrico, parceirosDoProduto] = await Promise.all([
                getParceiros(),
                getParceiroByProduto(dadosFicha.produto_id),
            ]);

            const precoPorParceiroId = {};
            if (Array.isArray(parceirosDoProduto)) {
                parceirosDoProduto.forEach((vinculo) => {
                    precoPorParceiroId[vinculo.parceiro_id] = vinculo.preco;
                });
            }

            const parceirosComPreco = (
                Array.isArray(parceirosDoFabrico) ? parceirosDoFabrico : []
            ).map((parceiro) => ({
                ...parceiro,
                preco: precoPorParceiroId[parceiro.id] ?? null,
            }));

            setParceirosDisponiveis(parceirosComPreco);
        } catch (error) {
            console.error("Erro ao buscar parceiros", error);
            setParceirosDisponiveis([]);
        }
    }, [dadosFicha?.produto_id]);

    const parceirosFiltrados = useMemo(
        () => parceirosDisponiveis.filter((parceiro) => ehParceiroDeCostura(parceiro)),
        [parceirosDisponiveis],
    );

    const carregarReferencia = useCallback(async () => {
        try {
            if (dadosFicha?.produto?.id && dadosFicha.pedido?.cliente?.id) {
                const prodtuoCleinte = await getProdutosDoCliente(dadosFicha.pedido.cliente.id);
                const produtoVinculado = prodtuoCleinte.find(
                    (item) => item.produto?.id == dadosFicha.produto.id,
                );
                setReferenciaCliente(produtoVinculado?.nome_para_cliente || "-");
            }
        } catch (error) {
            console.error("Erro ao carregar Referência", error);
        }
    }, [dadosFicha?.produto?.id, dadosFicha?.pedido?.cliente?.id]);

    const carregarCoresDaFabrica = useCallback(async () => {
        if (dadosFicha?.fabrico_id) {
            try {
                const cores = await getCores();
                setTodasCoresDisponiveis(cores);
            } catch (error) {
                console.error("Erro ao buscar cores", error);
            }
        }
    }, [dadosFicha?.fabrico_id]);

    useEffect(() => {
        if (isOpen && dadosFicha) {
            setRelatorioAcabamento({
                defeitoCostura: dadosFicha.defeitos_costura ?? 0,
                defeitoTecido: dadosFicha.defeitos_tecido ?? 0,
                retiradas: dadosFicha.retiradas ?? 0,
                sobras: dadosFicha.sobras ?? 0,
            });

            carregarCoresDaFabrica();
            carregarParceirosDisponiveis();
            setParceirosRemovidos([]);
            setValidacaoPrecoExibida(false);

            const coresUnicasMap = {};
            dadosFicha.ficha_tecnica_itens?.forEach((item) => {
                if (item.cor) {
                    coresUnicasMap[item.cor.id] = item.cor;
                }
            });
            setCoresSelecionadas(Object.values(coresUnicasMap));

            const matrizInicial = {};
            dadosFicha.ficha_tecnica_itens?.forEach((item) => {
                if (!matrizInicial[item.cor_id]) matrizInicial[item.cor_id] = {};
                matrizInicial[item.cor_id][item.grade_versao_item_id] = {
                    quantidade: item.quantidade,
                };
            });
            setMatrizQuantidades(matrizInicial);
            setReferenceSizeId(null);

            const parceirosIniciais = (dadosFicha.ficha_parceiro || [])
                .filter((p) => ehParceiroDeCostura(p.parceiro))
                .map((p) => {
                    const vinculoProduto = p.parceiro?.parceiro_produto?.find(
                        (pp) => pp.produto_id === dadosFicha.produto_id,
                    );

                    return {
                        ...p,
                        preco_editavel: vinculoProduto?.preco || 0,
                        parceiroProdutoExiste: Boolean(vinculoProduto),
                    };
                });
            setParceiros(parceirosIniciais);
            setConfirmarSaida(false);
            initialSnapshot.current = snapshotFicha(
                Object.values(coresUnicasMap),
                matrizInicial,
                parceirosIniciais,
                [],
                {
                    defeitoCostura: dadosFicha.defeitos_costura ?? 0,
                    defeitoTecido: dadosFicha.defeitos_tecido ?? 0,
                    retiradas: dadosFicha.retiradas ?? 0,
                    sobras: dadosFicha.sobras ?? 0,
                },
            );
            carregarReferencia();
        }
    }, [
        isOpen,
        dadosFicha,
        carregarCoresDaFabrica,
        carregarParceirosDisponiveis,
        carregarReferencia,
    ]);

    const handleToggleCor = (cor) => {
        setCoresSelecionadas((prev) => {
            const existe = prev.some((c) => c.id === cor.id);
            if (existe) {
                return prev.filter((c) => c.id !== cor.id);
            }
            return [...prev, cor];
        });
    };

    const handleCorCreated = (corCriada) => {
        if (!corCriada?.id) return;

        setTodasCoresDisponiveis((prev) =>
            prev.some((cor) => cor.id === corCriada.id) ? prev : [...prev, corCriada],
        );
        setCoresSelecionadas((prev) =>
            prev.some((cor) => cor.id === corCriada.id) ? prev : [...prev, corCriada],
        );
    };

    const handleRelatorioAcabamentoChange = (campo, valor) => {
        setRelatorioAcabamento((prev) => ({ ...prev, [campo]: valor }));
    };

    const handleAddParceiroSelecionado = (novoParceiro) => {
        const parceiroId = Number(novoParceiro.id);
        const jaExiste = parceiros.some((p) => Number(p.parceiro_id) === parceiroId);
        if (jaExiste) return;

        const vinculoRemovido = parceirosRemovidos.find(
            (vinculo) => Number(vinculo.parceiro_id) === parceiroId,
        );

        if (vinculoRemovido) {
            setParceirosRemovidos((prev) =>
                prev.filter((vinculo) => Number(vinculo.parceiro_id) !== parceiroId),
            );
            setParceiros((prev) => [...prev, vinculoRemovido]);
            return;
        }

        const novoVinculo = {
            parceiro_id: parceiroId,
            parceiro: {
                id: parceiroId,
                nome: novoParceiro.nome,
            },
            operacao: "",
            preco_editavel: novoParceiro.preco || 0,
            parceiroProdutoExiste: novoParceiro.preco !== null && novoParceiro.preco !== undefined,
            isNovo: true,
        };

        setParceiros((prev) => [...prev, novoVinculo]);
    };

    const parceirosSemPreco = useMemo(
        () =>
            parceiros.filter((parceiro) => {
                const preco = Number(parceiro.preco_editavel);
                return !Number.isFinite(preco) || preco <= 0;
            }),
        [parceiros],
    );

    const totaisPorTamanho = useMemo(() => {
        const totais = {};
        sizeItems.forEach((s) => {
            let sum = 0;
            coresSelecionadas.forEach((cor) => {
                const qtd = matrizQuantidades[cor.id]?.[s.id]?.quantidade || 0;
                sum += Number(qtd);
            });
            totais[s.id] = sum;
        });
        return totais;
    }, [sizeItems, coresSelecionadas, matrizQuantidades]);

    const totaisPorCor = useMemo(() => {
        const totais = {};
        coresSelecionadas.forEach((cor) => {
            totais[cor.id] = sizeItems.reduce(
                (sum, size) => sum + Number(matrizQuantidades[cor.id]?.[size.id]?.quantidade || 0),
                0,
            );
        });
        return totais;
    }, [sizeItems, coresSelecionadas, matrizQuantidades]);

    const totalGeral = useMemo(
        () => Object.values(totaisPorTamanho).reduce((sum, total) => sum + Number(total || 0), 0),
        [totaisPorTamanho],
    );

    const totalPerdas = useMemo(
        () =>
            Number(relatorioAcabamento.defeitoCostura || 0) +
            Number(relatorioAcabamento.defeitoTecido || 0) +
            Number(relatorioAcabamento.retiradas || 0) +
            Number(relatorioAcabamento.sobras || 0),
        [relatorioAcabamento],
    );
    const perdasValidas = !isUltimaEtapa || totalPerdas <= totalGeral;

    // O rodapé fica fixo no celular e no tablet: leva o aviso de erro para a área visível
    useEffect(() => {
        if (tentativasSalvar === 0) return;
        corpoRef.current
            ?.querySelector('[role="alert"]')
            ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [tentativasSalvar, saveError]);

    useEffect(() => {
        setReferenceSizeId(
            obterReferenciaProporcao({
                sizeIds: sizeItems.map((size) => size.id),
                totalsBySize: totaisPorTamanho,
            }),
        );
    }, [sizeItems, totaisPorTamanho]);

    const proporcoes = useMemo(
        () =>
            calcularProporcoesGrade({
                sizeIds: sizeItems.map((size) => size.id),
                colorIds: coresSelecionadas.map((cor) => cor.id),
                referenceSizeId,
                getQuantity: (colorId, sizeId) =>
                    matrizQuantidades[colorId]?.[sizeId]?.quantidade || 0,
            }),
        [sizeItems, coresSelecionadas, referenceSizeId, matrizQuantidades],
    );

    const handleAplicarProporcao = useCallback(
        (targetSizeId, rawMultiplier) => {
            const multiplier = Number(rawMultiplier);
            if (
                referenceSizeId === null ||
                !Number.isFinite(multiplier) ||
                !Number.isInteger(multiplier) ||
                multiplier < 0 ||
                isReferenciaProporcao(targetSizeId, referenceSizeId)
            ) {
                return;
            }

            setMatrizQuantidades((prev) => {
                const next = { ...prev };
                coresSelecionadas.forEach((cor) => {
                    const referenceQuantity = Number(
                        prev[cor.id]?.[referenceSizeId]?.quantidade || 0,
                    );
                    next[cor.id] = {
                        ...prev[cor.id],
                        [targetSizeId]: {
                            ...prev[cor.id]?.[targetSizeId],
                            quantidade: referenceQuantity * multiplier,
                        },
                    };
                });
                return next;
            });
        },
        [referenceSizeId, coresSelecionadas],
    );

    const handleQuantidadeChange = (corId, gradeItemId, novaQuantidade) => {
        setMatrizQuantidades((prev) => ({
            ...prev,
            [corId]: {
                ...prev[corId],
                [gradeItemId]: {
                    ...prev[corId]?.[gradeItemId],
                    quantidade: novaQuantidade === "" ? "" : Number(novaQuantidade),
                },
            },
        }));
    };

    const handleParceiroChange = (index, campo, valor) => {
        setParceiros((prev) => prev.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)));
    };

    const formatarPrecoEditavel = (vinculo) =>
        vinculo.preco_editavel ? Number(vinculo.preco_editavel).toFixed(2).replace(".", ",") : "";

    const handlePrecoChange = (index, texto) => {
        const numeros = texto.replace(/\D/g, "");
        handleParceiroChange(index, "preco_editavel", numeros ? Number(numeros) / 100 : 0);
    };

    const handleRemoverParceiro = (index) => {
        const parceiroParaRemover = parceiros[index];
        if (parceiroParaRemover.parceiro_id && !parceiroParaRemover.isNovo) {
            setParceirosRemovidos((prev) =>
                prev.some(
                    (vinculo) =>
                        Number(vinculo.parceiro_id) === Number(parceiroParaRemover.parceiro_id),
                )
                    ? prev
                    : [...prev, parceiroParaRemover],
            );
        }
        setParceiros((prev) => prev.filter((_, i) => i !== index));
    };

    const mensagemDeErro = (error, padrao) => {
        const message = error?.response?.data?.message;
        if (Array.isArray(message)) return message.join(" ");
        return message || padrao;
    };

    const ignorarStatus =
        (...statusIgnorados) =>
        (error) => {
            if (statusIgnorados.includes(error?.response?.status)) return null;
            throw error;
        };

    const handleConcluir = async () => {
        setTentativasSalvar((n) => n + 1);
        setValidacaoPrecoExibida(true);
        setSaveError("");

        if (parceirosSemPreco.length > 0 || !perdasValidas) {
            return;
        }

        // Células com quantidade > 0 das cores selecionadas
        const itens = coresSelecionadas.flatMap((cor) =>
            Object.entries(matrizQuantidades[cor.id] || {})
                .filter(([, celula]) => Number(celula.quantidade) > 0)
                .map(([gradeItemId, celula]) => ({
                    cor_id: Number(cor.id),
                    grade_versao_item_id: Number(gradeItemId),
                    quantidade: Number(celula.quantidade),
                })),
        );

        const matrizVazia = itens.length === 0;
        const temMatrizGravada = (dadosFicha?.ficha_tecnica_itens || []).some(
            (item) => Number(item.quantidade) > 0,
        );

        if (matrizVazia && temMatrizGravada) {
            setSaveError("Informe a quantidade de pelo menos um tamanho/cor antes de salvar.");
            return;
        }

        if (loading) return;
        setLoading(true);
        try {
            // 1) Parceiros (separados): o back reconcilia recalcula
            //    quantidade/valor na matriz usando o preço já atualizado
            await Promise.all(
                parceirosRemovidos.map((removido) =>
                    deleteFichaTecnicaParceiro(fichaId, removido.parceiro_id).catch(
                        ignorarStatus(404),
                    ),
                ),
            );

            for (const p of parceiros) {
                const preco = Number(p.preco_editavel);

                if (p.parceiroProdutoExiste) {
                    await updateParceiroProdutoPrice(p.parceiro_id, dadosFicha.produto_id, preco);
                } else {
                    await createParceiroProduto(p.parceiro_id, dadosFicha.produto_id, preco).catch(
                        (error) => {
                            if (error?.response?.status === 409) {
                                return updateParceiroProdutoPrice(
                                    p.parceiro_id,
                                    dadosFicha.produto_id,
                                    preco,
                                );
                            }
                            throw error;
                        },
                    );
                }

                if (p.isNovo) {
                    await createFichaParceiro(fichaId, p.parceiro_id, p.operacao).catch((error) => {
                        if (error?.response?.status === 409) {
                            return updateFichaTecnicaParceiro(fichaId, p.parceiro_id, {
                                operacao: p.operacao,
                            });
                        }
                        throw error;
                    });
                } else {
                    await updateFichaTecnicaParceiro(fichaId, p.parceiro_id, {
                        operacao: p.operacao,
                    });
                }
            }

            // 2) Matriz: UMA chamada atômica (itens, quantidade, perdas da ficha e totais do pedido)
            // Sem itens não há o que gravar (o endpoint exige ao menos 1)
            if (!matrizVazia) {
                const perdas = isUltimaEtapa
                    ? {
                          defeitos_costura: Number(relatorioAcabamento.defeitoCostura) || 0,
                          defeitos_tecido: Number(relatorioAcabamento.defeitoTecido) || 0,
                          retiradas: Number(relatorioAcabamento.retiradas) || 0,
                          sobras: Number(relatorioAcabamento.sobras) || 0,
                      }
                    : undefined;
                await replaceMatriz(fichaId, itens, perdas);
            }

            await onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Erro ao salvar edição", error);
            setSaveError(
                mensagemDeErro(error, "Não foi possível salvar a ficha. Tente novamente."),
            );
        } finally {
            setLoading(false);
        }
    };

    const solicitarSaida = () => {
        if (loading) return;
        const atual = snapshotFicha(
            coresSelecionadas,
            matrizQuantidades,
            parceiros,
            parceirosRemovidos,
            relatorioAcabamento,
        );
        if (atual !== initialSnapshot.current) setConfirmarSaida(true);
        else onClose();
    };

    if (!isOpen) return null;

    const seletorCores = (
        <ColorDropdown
            coresDisponiveis={todasCoresDisponiveis}
            coresSelecionadas={coresSelecionadas}
            onToggleCor={handleToggleCor}
            onCreateCor={() => setCorModalOpen(true)}
            onCreateEstampa={() => setEstampaModalOpen(true)}
        />
    );

    return (
        <>
            <ConfirmacaoFichaModal
                isOpen={confirmarSaida}
                mensagem="Ao sair, você perderá as alterações desta ficha técnica. Deseja continuar?"
                textoCancel="Continuar preenchendo"
                textoConfirm="Sair e descartar"
                onCancel={() => setConfirmarSaida(false)}
                onConfirm={() => {
                    setConfirmarSaida(false);
                    onClose();
                }}
            />
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-0 backdrop-blur-sm print:hidden md:p-4"
                onClick={() => {
                    if (!isProdutoParceirosOpen) {
                        solicitarSaida();
                    }
                }}
            >
                <div
                    className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[850px] flex-col overflow-hidden rounded-none bg-white shadow-2xl font-['Outfit',_sans-serif] md:h-auto md:max-h-[95vh] md:rounded-[24px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex h-[61px] shrink-0 items-center justify-between gap-2 pl-4 pr-1 md:h-auto md:px-8 md:py-6">
                        <div className="flex min-w-0 items-center gap-3">
                            <img
                                src="/etiqueta-preta.png"
                                alt="Tag"
                                className="hidden w-[28px] h-[28px] object-contain opacity-70 md:block"
                            />
                            <h2 className="truncate text-[18px] font-light leading-7 text-[#404040] md:text-[22px] lg:text-[26px]">
                                Editar Ficha Técnica {dadosFicha?.numero}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={solicitarSaida}
                            aria-label="Fechar"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full md:-my-2 md:-mr-2 lg:m-0 lg:h-auto lg:w-auto"
                        >
                            <img
                                src="/fechar-cinza.png"
                                alt=""
                                className="w-[10.5px] h-[10.5px] object-contain"
                            />
                        </button>
                    </div>

                    <div
                        ref={corpoRef}
                        className="flex-1 space-y-5 overflow-y-auto px-4 pb-6 pt-2 scrollbar-sutil md:space-y-6 md:px-8 md:pb-8 md:pt-1"
                    >
                        <div>
                            <div className="flex flex-row items-start gap-5 md:gap-6">
                                {/* Celular: a foto acompanha a altura dos campos ao lado (cerca de 3:4). Tablet: em pé (3:4). Desktop segue a medida original */}
                                <div className="w-[112px] min-[360px]:w-[157px] shrink-0 self-stretch rounded-[12px] overflow-hidden md:self-start md:border md:border-dashed md:border-[#898C8F] md:h-[176px] md:w-[132px] md:rounded-[10px] lg:h-[165px] lg:w-[209px]">
                                    <img
                                        src={dadosFicha?.produto?.foto || "/image-placeholder.png"}
                                        alt="Foto do Produto"
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="grid min-w-0 flex-1 grid-cols-1 content-start gap-x-6 gap-y-2.5 md:grid-cols-2 md:gap-y-4 lg:gap-y-3">
                                    <FloatingInput
                                        label="Referência Interna"
                                        valor={dadosFicha?.produto?.nome}
                                        readOnly
                                        muted
                                    />
                                    <FloatingInput
                                        label="Cliente"
                                        valor={dadosFicha?.pedido?.cliente?.nome}
                                        readOnly
                                        muted
                                    />
                                    <FloatingInput
                                        label="Referência do Cliente"
                                        valor={referenciaCliente}
                                        readOnly
                                        muted
                                    />
                                    <FloatingInput
                                        label="Tecido"
                                        valor={dadosFicha?.produto?.tecido?.nome || "-"}
                                        readOnly
                                        muted
                                    />

                                    {/* Tablet e desktop: o seletor segue dentro da grade de campos */}
                                    <div className="hidden md:block">{seletorCores}</div>

                                    <FloatingInput
                                        label="Grade Atual"
                                        valor={dadosFicha?.grade_versao?.grade?.nome || "Adulto"}
                                        readOnly
                                        muted
                                    />
                                </div>
                            </div>

                            {/* Celular: o seletor de cores fica abaixo, na largura toda */}
                            <div className="mt-5 md:hidden">{seletorCores}</div>
                        </div>
                        <div className="flex flex-wrap gap-2 !mt-3 max-md:empty:hidden md:!mt-6 md:pt-2">
                            {coresSelecionadas.map((cor) => (
                                <ColorPill
                                    key={cor.id}
                                    nome={cor.nome}
                                    onRemove={() => handleToggleCor(cor)}
                                />
                            ))}
                        </div>
                        <div className="mt-4">
                            <div className="mb-2 text-center text-[16px] font-light text-[#737373]">
                                Grade
                            </div>
                            {/* Celular: o bloco rola na horizontal e a coluna da cor fica fixa */}
                            <div className="w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-visible">
                                <div
                                    className="w-full min-w-[var(--grade-min)] md:min-w-0"
                                    style={{
                                        "--grade-min": `${112 + 56 + 64 * sizeItems.length}px`,
                                    }}
                                >
                                    <div className="flex w-full items-stretch min-h-[44px] md:min-h-[30px]">
                                        {/* Célula 0,0: sem fundo, texto nem borda (o branco só cobre os números ao rolar) */}
                                        <div className="w-[112px] shrink-0 bg-white max-md:sticky max-md:left-0 max-md:z-10 md:w-[160px] md:bg-transparent" />
                                        <div className="flex flex-1 min-w-0">
                                            {sizeItems.map((s, i) => (
                                                <div
                                                    key={`total-${s.id}`}
                                                    className="bg-[#F4F4F4] flex-1 min-w-0 text-center text-[14px] font-light flex items-center justify-center text-[#D7D7D7]"
                                                    style={{
                                                        borderColor: "#7B7D80",
                                                        borderLeftWidth: "0.5px",
                                                        borderRightWidth:
                                                            i === sizeItems.length - 1
                                                                ? "0.5px"
                                                                : "0px",
                                                        borderTopWidth: "0.5px",
                                                        borderBottomWidth: "0.5px",
                                                        borderTopLeftRadius:
                                                            i === 0 ? "10px" : "0px",
                                                        borderTopRightRadius:
                                                            i === sizeItems.length - 1
                                                                ? "10px"
                                                                : "0px",
                                                        color:
                                                            totaisPorTamanho[s.id] > 0
                                                                ? "#898C8F"
                                                                : "#D7D7D7",
                                                    }}
                                                >
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        inputMode="numeric"
                                                        value={proporcoes[s.id] || ""}
                                                        placeholder="0"
                                                        aria-label={`Proporção ${s.tamanho?.codigo || ""}`}
                                                        readOnly={isReferenciaProporcao(
                                                            s.id,
                                                            referenceSizeId,
                                                        )}
                                                        disabled={referenceSizeId === null}
                                                        onFocus={(event) => {
                                                            preventNumberInputWheel(event);
                                                            event.target.select();
                                                        }}
                                                        onChange={(event) =>
                                                            handleAplicarProporcao(
                                                                s.id,
                                                                event.target.value,
                                                            )
                                                        }
                                                        title={
                                                            isReferenciaProporcao(
                                                                s.id,
                                                                referenceSizeId,
                                                            )
                                                                ? "Coluna de referência"
                                                                : referenceSizeId === null
                                                                  ? "Preencha primeiro uma coluna da grade"
                                                                  : "Digite a proporção para recalcular esta coluna"
                                                        }
                                                        className="h-full w-full bg-transparent text-center outline-none disabled:cursor-not-allowed [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none max-md:text-[16px]"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-[56px] shrink-0 md:w-[90px]" />
                                    </div>

                                    <div className="flex h-[44px] items-stretch md:h-[40px]">
                                        <div
                                            className={`${COLUNA_FIXA} w-[112px] shrink-0 rounded-tl-[10px] font-normal bg-[#C9EAF6] px-2.5 text-[#4696AD] flex items-center justify-center overflow-hidden md:w-[160px] md:px-4`}
                                        >
                                            Cores
                                        </div>
                                        <div className="flex flex-1 min-w-0">
                                            {sizeItems.map((s, sizeIndex) => (
                                                <div
                                                    key={`header-${s.id}`}
                                                    className="flex-1 min-w-0 text-center text-[14px] font-normal text-[#4696AD] flex items-center justify-center bg-[#C9EAF6]"
                                                    style={{
                                                        borderLeftWidth: "0.5px",
                                                        borderRightWidth:
                                                            sizeIndex === sizeItems.length - 1
                                                                ? "0.5px"
                                                                : "0px",
                                                        borderColor: "#7B7D80",
                                                    }}
                                                >
                                                    {s.tamanho?.codigo || "-"}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-[56px] shrink-0 rounded-tr-[10px] bg-[#C9EAF6] px-2 text-center text-[14px] font-normal text-[#4696AD] flex items-center justify-center md:w-[90px]">
                                            <span className="md:hidden">Total</span>
                                            <span className="hidden md:inline">Total (cor)</span>
                                        </div>
                                    </div>

                                    <div className="rounded-b-[10px] bg-white overflow-clip">
                                        <div className="flex flex-col w-full">
                                            {coresSelecionadas.length > 0 ? (
                                                coresSelecionadas.map((cor, index) => (
                                                    <div
                                                        key={cor.id}
                                                        className={`flex w-full min-h-[48px] items-stretch md:min-h-[40px] ${
                                                            index % 2 === 1
                                                                ? "bg-[#F4F4F4]"
                                                                : "bg-[#FFFFFF]"
                                                        }`}
                                                    >
                                                        <div
                                                            title={cor.nome}
                                                            className={`${COLUNA_FIXA} w-[112px] shrink-0 pl-2 pr-2 flex items-center gap-1.5 md:w-[160px] md:gap-3 md:pr-4 ${
                                                                index % 2 === 1
                                                                    ? "bg-[#F4F4F4]"
                                                                    : "bg-[#FFFFFF]"
                                                            }`}
                                                            style={{
                                                                borderLeftWidth: "0.5px",
                                                                borderLeftColor: "#D9D9D9",
                                                            }}
                                                        >
                                                            {String(cor.tipo).toUpperCase() ===
                                                            "ESTAMPA" ? (
                                                                <img
                                                                    src={cor.foto}
                                                                    alt={cor.nome}
                                                                    className="w-[20px] h-[20px] rounded-[6px] shrink-0 border border-[#D9D9D9] object-cover"
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="w-[20px] h-[20px] rounded-[6px] shrink-0 border border-[#D9D9D9]"
                                                                    style={{
                                                                        backgroundColor:
                                                                            cor.codigo_hex ||
                                                                            "#E5E5E5",
                                                                    }}
                                                                />
                                                            )}
                                                            <span className="min-w-0 flex-1 line-clamp-2 text-left text-[13px] font-light leading-4 text-[#898C8F] md:block md:truncate md:text-center md:text-[14px] md:leading-none">
                                                                {cor.nome}
                                                            </span>
                                                        </div>

                                                        {sizeItems.map((s, sizeIndex) => {
                                                            const val =
                                                                matrizQuantidades[cor.id]?.[s.id]
                                                                    ?.quantidade;
                                                            return (
                                                                <div
                                                                    key={`input-${cor.id}-${s.id}`}
                                                                    className="flex-1 min-w-0 flex items-center justify-center"
                                                                    style={{
                                                                        ...BORDER_DARK_05,
                                                                        borderTopWidth: "0px",
                                                                        borderBottomWidth: "0px",
                                                                        borderLeftWidth: "0.5px",
                                                                        borderRightWidth:
                                                                            sizeIndex ===
                                                                            sizeItems.length - 1
                                                                                ? "0.5px"
                                                                                : "0px",
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="number"
                                                                        onFocus={
                                                                            preventNumberInputWheel
                                                                        }
                                                                        min="0"
                                                                        inputMode="numeric"
                                                                        aria-label={`${cor.nome}, tamanho ${s.tamanho?.codigo || ""}`}
                                                                        value={
                                                                            val === undefined ||
                                                                            val === 0
                                                                                ? ""
                                                                                : val
                                                                        }
                                                                        placeholder="-"
                                                                        onChange={(e) =>
                                                                            handleQuantidadeChange(
                                                                                cor.id,
                                                                                s.id,
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        className="w-full h-full text-center text-[14px] font-light text-[#898C8F] bg-transparent outline-none placeholder:text-[#D7D7D7] [&::-webkit-inner-spin-button]:appearance-none max-md:min-h-[48px] max-md:text-[16px] max-md:focus:bg-[#E6F4F9]"
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                        <div
                                                            className="w-[56px] shrink-0 px-2 flex items-center justify-center text-[14px] font-normal text-[#898C8F] md:w-[90px]"
                                                            style={{
                                                                borderRight: "0.5px solid #D9D9D9",
                                                            }}
                                                        >
                                                            {totaisPorCor[cor.id] || "-"}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-4 text-[13px] text-center text-[#888] bg-white w-full rounded-b-[10px] max-md:sticky max-md:left-0 max-md:w-[calc(100vw-2rem)]">
                                                    Nenhuma cor selecionada.
                                                </div>
                                            )}
                                            {coresSelecionadas.length > 0 && (
                                                <div className="flex w-full min-h-[44px] items-stretch md:min-h-[40px]">
                                                    <div
                                                        className={`${COLUNA_FIXA} w-[112px] shrink-0 bg-[#C9EAF6] px-2.5 text-center text-[12px] leading-[14px] font-normal text-[#4696AD] flex items-center justify-center md:w-[160px] md:px-3 md:text-[14px] md:leading-[1.5]`}
                                                    >
                                                        Total (tamanho)
                                                    </div>
                                                    <div className="flex flex-1 min-w-0">
                                                        {sizeItems.map((size, sizeIndex) => (
                                                            <div
                                                                key={`total-tamanho-${size.id}`}
                                                                className={`flex-1 min-w-0 px-2 flex items-center justify-center text-[14px] font-normal text-[#898C8F] border-l-[0.5px] border-[#7B7D80] ${
                                                                    coresSelecionadas.length % 2 ===
                                                                    1
                                                                        ? "bg-[#F4F4F4]"
                                                                        : "bg-[#FFFFFF]"
                                                                }`}
                                                                style={{
                                                                    borderLeftWidth: "0.5px",
                                                                    borderRightWidth:
                                                                        sizeIndex ===
                                                                        sizeItems.length - 1
                                                                            ? "0.5px"
                                                                            : "0px",
                                                                    borderColor: "#7B7D80",
                                                                    borderBottomWidth: "0.5px",
                                                                    borderBottomColor: "#D9D9D9",
                                                                }}
                                                            >
                                                                {totaisPorTamanho[size.id] || "-"}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="w-[56px] shrink-0 bg-[#C9EAF6] px-2 flex items-center justify-center text-[14px] font-normal text-[#4696AD] md:w-[90px]">
                                                        {totalGeral || "-"}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#6B6E72] md:hidden">
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                                Deslize para ver todos os tamanhos
                            </p>
                        </div>

                        {validacaoPrecoExibida && parceirosSemPreco.length > 0 && (
                            <div
                                className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-light text-red-700"
                                role="alert"
                            >
                                <span className="font-medium">Atenção:</span> cadastre o preço
                                unitário de todas as facções antes de concluir a edição.
                            </div>
                        )}

                        <div className="hidden overflow-visible md:block">
                            <table className="w-full table-fixed border-separate border-spacing-0 text-center text-sm">
                                <thead className="bg-[#C9EAF6] text-[#4696AD]">
                                    <tr>
                                        <th className="w-1/3 rounded-tl-[10px] py-3 border-r border-[#7B7D80] font-normal">
                                            Facção
                                        </th>
                                        <th className="w-1/3 py-3 border-r border-[#7B7D80] font-normal">
                                            Operação
                                        </th>
                                        <th className="w-1/3 rounded-tr-[10px] py-3 font-normal">
                                            Preço Unitário
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#707070]">
                                    {parceiros.length > 0 ? (
                                        parceiros.map((vinculo, index) => {
                                            const isLastRow = index === parceiros.length - 1;

                                            return (
                                                <tr
                                                    key={vinculo.id || index}
                                                    className="group odd:bg-[#FFFFFF] even:bg-[#F4F4F4]"
                                                >
                                                    <td
                                                        className={`w-1/3 py-3 border-l border-[#D9D9D9] border-r border-r-[#7B7D80] ${
                                                            isLastRow
                                                                ? "rounded-bl-[10px] border-b border-[#D9D9D9]"
                                                                : ""
                                                        }`}
                                                    >
                                                        {vinculo.parceiro?.nome || "-"}
                                                    </td>
                                                    <td
                                                        className={`w-1/3 p-0 border-r border-[#7B7D80] ${
                                                            isLastRow
                                                                ? "border-b border-b-[#D9D9D9]"
                                                                : ""
                                                        }`}
                                                    >
                                                        <input
                                                            type="text"
                                                            value={vinculo.operacao || ""}
                                                            placeholder="Ex: Completa"
                                                            onChange={(e) =>
                                                                handleParceiroChange(
                                                                    index,
                                                                    "operacao",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="w-full h-full py-3 text-center bg-transparent outline-none placeholder-[#D3D3D3]"
                                                        />
                                                    </td>
                                                    <td
                                                        className={`w-1/3 p-0 relative border-r border-[#D9D9D9] ${
                                                            isLastRow
                                                                ? "rounded-br-[10px] border-b border-[#D9D9D9]"
                                                                : ""
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-center w-full h-full">
                                                            <span className="text-[#707070]">
                                                                R$
                                                            </span>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={formatarPrecoEditavel(
                                                                    vinculo,
                                                                )}
                                                                onChange={(e) =>
                                                                    handlePrecoChange(
                                                                        index,
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                className="w-[50px] py-3 pl-1 text-left bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </div>

                                                        <div className="absolute top-0 -right-[30px] w-[30px] h-full flex items-center justify-center transition-opacity z-20 lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoverParceiro(index)
                                                                }
                                                                className="h-full w-full flex items-center justify-center hover:opacity-70 transition-opacity lg:w-[18px] lg:h-[18px]"
                                                                title="Remover parceiro"
                                                            >
                                                                <img
                                                                    src="/excluir-cinza-claro.png"
                                                                    alt="Remover parceiro"
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="rounded-bl-[10px] rounded-br-[10px] border-l border-r border-b border-[#D9D9D9] py-4 text-center text-[13px] text-[#888]"
                                            >
                                                Nenhuma facção vinculada a esta ficha.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Celular: cada facção vira um cartão (a tabela volta a partir do tablet) */}
                        <div className="flex flex-col gap-2.5 md:hidden">
                            {parceiros.length > 0 ? (
                                parceiros.map((vinculo, index) => {
                                    const nome = vinculo.parceiro?.nome || "-";

                                    return (
                                        <div
                                            key={vinculo.id || index}
                                            className="flex flex-col gap-1.5 rounded-[14px] border border-[#D5E4EA] bg-white p-3"
                                        >
                                            <div className="flex h-8 items-center gap-2.5">
                                                <span
                                                    title={nome}
                                                    className="min-w-0 flex-1 truncate text-[16px] font-medium text-[#404040]"
                                                >
                                                    {nome}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoverParceiro(index)}
                                                    aria-label={`Remover ${nome}`}
                                                    className="-my-1.5 -mr-3 flex h-11 w-11 shrink-0 items-center justify-center"
                                                >
                                                    <img
                                                        src="/excluir-cinza.png"
                                                        alt=""
                                                        className="h-[18px] w-[18px] object-contain"
                                                    />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-2.5">
                                                <label className="flex min-w-0 flex-col gap-1 text-[12px] leading-4 text-[#6B6E72]">
                                                    Operação
                                                    <input
                                                        type="text"
                                                        value={vinculo.operacao || ""}
                                                        placeholder="Ex: Completa"
                                                        onChange={(e) =>
                                                            handleParceiroChange(
                                                                index,
                                                                "operacao",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={`${CLASSE_CAMPO_CARTAO} outline-none placeholder:text-[#D3D3D3]`}
                                                    />
                                                </label>
                                                <label className="flex min-w-0 flex-col gap-1 text-[12px] leading-4 text-[#6B6E72]">
                                                    Preço unitário
                                                    <span className={CLASSE_CAMPO_CARTAO}>
                                                        <span className="mr-1.5 text-[#707070]">
                                                            R$
                                                        </span>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={formatarPrecoEditavel(vinculo)}
                                                            placeholder="0,00"
                                                            onChange={(e) =>
                                                                handlePrecoChange(
                                                                    index,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="w-full min-w-0 bg-transparent outline-none placeholder:text-[#D3D3D3]"
                                                        />
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="rounded-[10px] border border-[#D9D9D9] py-4 text-center text-[13px] text-[#888]">
                                    Nenhuma facção vinculada a esta ficha.
                                </p>
                            )}
                        </div>

                        {/* Botão Atribuir Facção */}
                        <button
                            type="button"
                            onClick={() => setIsProdutoParceirosOpen(true)}
                            className="w-full h-[48px] bg-[#F8F8F8] text-[#898C8F] text-[14px] font-light rounded-[12px] flex items-center justify-center gap-2 hover:bg-[#ebebeb] transition-colors md:h-auto md:py-3 md:rounded-[10px]"
                        >
                            <img
                                src="/maquina-costura-add.png"
                                alt="Maquina de Costura Cinza"
                                className="w-[14px] h-[14px] opacity-70"
                            />
                            <span>
                                {" "}
                                {parceiros.length > 0
                                    ? "Atribuir mais uma facção"
                                    : "Atribuir facção"}
                            </span>
                        </button>

                        {/* Relatório de acabamento */}
                        {isUltimaEtapa && (
                            <RelatorioDeAcabamento
                                defeitoCostura={relatorioAcabamento.defeitoCostura}
                                defeitoTecido={relatorioAcabamento.defeitoTecido}
                                retiradas={relatorioAcabamento.retiradas}
                                sobras={relatorioAcabamento.sobras}
                                onChange={handleRelatorioAcabamentoChange}
                                responsivo
                            />
                        )}

                        {!perdasValidas && (
                            <div
                                className="mt-4 rounded-[10px] border border-red-200 bg-red-50 p-4 text-[14px] font-light text-red-700"
                                role="alert"
                            >
                                A soma das perdas ({totalPerdas}) não pode ultrapassar a quantidade
                                da ficha ({totalGeral}).
                            </div>
                        )}

                        {saveError && (
                            <div
                                className="mt-4 rounded-[10px] border border-red-200 bg-red-50 p-4 text-[14px] font-light text-red-700"
                                role="alert"
                            >
                                {saveError}
                            </div>
                        )}

                        <div className="max-[30px] relative mt-5 break-inside-avoid">
                            <fieldset className="border border-[#E8E8E8] rounded-[10px] p-4 bg-[#F9F9F9] min-h-[80px]">
                                <legend className="px-2 text-[12px] text-[#898C8F] ml-2 font-light bg-white">
                                    Materiais necessários por peça:
                                </legend>
                                {aviamentos && aviamentos.length > 0 ? (
                                    <div className="flex flex-col gap-1 text-[14px] mt-1">
                                        {aviamentos.map((item, index) => {
                                            const quantidade = item.quantidade ?? "";
                                            const unidade = simplificarUnidade(
                                                item.aviamento?.unidade_de_medida ?? "",
                                            );
                                            const nome = item.aviamento?.nome ?? "";
                                            return (
                                                <div
                                                    key={item.aviamento?.id ?? index}
                                                    className="leading-relaxed"
                                                >
                                                    <span className="font-bold text-[#B0B4B8]">
                                                        {quantidade} {unidade}
                                                    </span>{" "}
                                                    <span className="font-normal text-[#B0B4B8]">
                                                        de {nome}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[13px] text-[#898C8F] font-light px-2 pt-1"></p>
                                )}
                            </fieldset>
                        </div>

                        {/* FOOTER (desktop: rola junto com o conteúdo) */}
                        <div className="py-5 hidden justify-end items-center shrink-0 lg:flex">
                            <button
                                onClick={handleConcluir}
                                disabled={loading || !perdasValidas}
                                className="px-10 h-[39px] rounded-full bg-[#A9E2F2] text-[#4696AD] font-normal text-[16px] hover:bg-[#97D8EA] transition-colors shadow-sm disabled:opacity-50"
                            >
                                {loading ? "Salvando..." : "Salvar Alterações"}
                            </button>
                        </div>
                    </div>

                    {/* Celular e tablet: rodapé fixo com total, perdas e ações */}
                    <div className="flex shrink-0 flex-col gap-3 border-t border-[#EEEEEE] bg-white px-4 pb-4 pt-3 shadow-[0_-6px_16px_rgba(0,0,0,0.06)] md:flex-row md:items-center md:justify-between md:gap-4 md:px-8 md:pb-5 md:pt-4 md:shadow-none lg:hidden">
                        <div className="flex items-center justify-between md:justify-start md:gap-8">
                            <div className="flex flex-col">
                                <span className="text-[12px] leading-4 text-[#6B6E72] md:text-[13px]">
                                    Total da ficha
                                </span>
                                <span className="text-[18px] font-medium leading-[22px] text-[#404040]">
                                    {totalGeral} peças
                                </span>
                            </div>
                            {isUltimaEtapa && (
                                <div className="flex flex-col items-end md:items-start">
                                    <span className="text-[12px] leading-4 text-[#6B6E72] md:text-[13px]">
                                        Perdas
                                    </span>
                                    <span
                                        className={`text-[15px] font-medium leading-[22px] md:text-[18px] ${
                                            perdasValidas ? "text-[#3F7A12]" : "text-red-700"
                                        }`}
                                    >
                                        {totalPerdas} de {totalGeral}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2.5 md:gap-3">
                            <button
                                type="button"
                                onClick={solicitarSaida}
                                disabled={loading}
                                className="h-[52px] flex-1 rounded-full border border-[#4696AD] bg-[#F3F4FA] text-[16px] text-[#4696AD] transition-colors hover:bg-[#F3FBFC] disabled:opacity-50 md:h-12 md:w-[140px] md:flex-none"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConcluir}
                                disabled={loading || !perdasValidas}
                                className="h-[52px] flex-[1.5] rounded-full bg-[#A9E2F2] text-[16px] font-normal text-[#4696AD] shadow-sm transition-colors hover:bg-[#97D8EA] disabled:opacity-50 md:h-12 md:w-[220px] md:flex-none"
                            >
                                {loading ? "Salvando..." : "Salvar Alterações"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <ProdutoParceiros
                isOpen={isProdutoParceirosOpen}
                onClose={() => setIsProdutoParceirosOpen(false)}
                produtoId={dadosFicha?.produto_id}
                parceiros={parceirosFiltrados}
                selectedParceiroIds={parceiros.map((p) => p.parceiro_id)}
                onSelectParceiro={handleAddParceiroSelecionado}
            />
            <CorModal
                isOpen={corModalOpen}
                onClose={() => setCorModalOpen(false)}
                fabricoId={dadosFicha?.fabrico_id}
                onSuccess={handleCorCreated}
            />
            <EstampaModal
                isOpen={estampaModalOpen}
                onClose={() => setEstampaModalOpen(false)}
                fabricoId={dadosFicha?.fabrico_id}
                onSuccess={handleCorCreated}
            />
        </>
    );
}
