import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
    syncFichaTecnicaCores,
    updateFichaTecnicaItem,
    deleteFichaTecnicaItem,
    updateParceiroProdutoPrice,
    createFichaTecnicaItem,
    createParceiroProduto,
} from "../../services/fichaTecnicaItemService";
import { getCoresByFabricoId } from "../../services/corService";
import {
    updateFichaTecnicaParceiro,
    deleteFichaTecnicaParceiro,
    createFichaParceiro,
} from "../../services/fichaParceiroService";
import { getProdutosDoCliente } from "../../services/clientesService";
import ProdutoParceiros from "../produtos/ProdutoParceiros";
import FichaTecnicaPrintView from "../FichaTecnicaPrintView";
import { getAviamentosDoProduto, getParceiroByProduto } from "../../services/produtoService";
import { updateFichaTecnica } from "../../services/fichasTecnicasService";
import { getParceirosByFabrico } from "../../services/parceiroService";
import { isCancel } from "axios";

const FloatingInput = ({
    label,
    valor,
    readOnly = false,
    type = "text",
    onChange,
    muted = false,
}) => (
    <div
        className={`relative border rounded-[10px] h-[39px] px-3 flex items-center mt-2 w-full bg-white ${
            muted ? "border-[#D7D7D7]" : "border-[#7B7D80]"
        }`}
    >
        <span
            className={`absolute -top-[9px] left-2 bg-white px-1 text-[11px] ${
                muted ? "text-[#D7D7D7]" : "text-[#7B7D80]"
            }`}
        >
            {label}
        </span>
        <input
            type={type}
            value={valor || ""}
            readOnly={readOnly}
            onChange={onChange}
            className={`w-full text-[14px] outline-none bg-transparent ${
                muted ? "text-[#D7D7D7]" : "text-[#7B7D80]"
            } ${readOnly ? "cursor-not-allowed opacity-70" : ""}`}
        />
    </div>
);

const simplificarUnidade = (unidade) => {
    const unidadesSimplificadas = {
        METRO: "m",
        CENTIMETRO: "cm",
        GRAMA: "g",
        QUILOGRAMA: "kg",
        UNIDADE: "un",
        PAR: "par",
    };
    return unidadesSimplificadas[unidade] || unidade;
};

const calcularProporcao = (totaisPorTamanho) => {
    const valoresValidos = totaisPorTamanho.map(Number).filter((t) => t > 0);
    if (valoresValidos.length === 0) return totaisPorTamanho.map(() => 0);
    const base = Math.min(...valoresValidos);
    return totaisPorTamanho.map((t) => (t > 0 ? Math.round(t / base) : 0));
};

const ColorDropdown = ({ coresDisponiveis, coresSelecionadas, onToggleCor }) => {
    const [aberto, setAberto] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
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
                className="border border-[#898C8F] rounded-[10px] h-[39px] px-3 flex justify-between items-center bg-white cursor-pointer"
                onClick={() => setAberto(!aberto)}
            >
                <span className="absolute -top-[9px] left-2 bg-white px-1 text-[11px] text-[#898C8F]">
                    Selecionar cores
                </span>
                <span className="text-[14px] text-[#707070]">
                    {coresSelecionadas.length === 0 ? "Selecione..." : "Selecionar cores"}
                </span>
                <span
                    className={`text-[#898C8F] text-[10px] transition-transform ${aberto ? "rotate-180" : ""}`}
                >
                    ▼
                </span>
            </div>

            {aberto && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#D9D9D9] rounded-[10px] shadow-lg z-20 max-h-[180px] overflow-y-auto scrollbar-sutil py-2">
                    {coresDisponiveis.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                            Nenhuma cor cadastrada.
                        </div>
                    ) : (
                        coresDisponiveis.map((cor) => {
                            const isSelected = coresSelecionadas.some((c) => c.id === cor.id);
                            return (
                                <button
                                    type="button"
                                    key={cor.id}
                                    onClick={() => onToggleCor(cor)}
                                    className={`flex w-full items-center border-l-[4px] px-4 py-2.5 transition bg-white text-[#707070] hover:bg-[#F4F4F4] ${
                                        isSelected
                                            ? "border-l-[3px] border-l-[#C4F042]"
                                            : "border-l-transparent"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span
                                            className="w-[16px] h-[16px] rounded-[4px] border border-gray-300 shrink-0"
                                            style={{ backgroundColor: cor.codigo_hex || "#E5E5E5" }}
                                        />
                                        <span className="flex-1 truncate text-left">
                                            {cor.nome}
                                        </span>
                                    </div>
                                    {isSelected ? (
                                        <img
                                            src="/check_cinza.png"
                                            className="w-[12px] h-[8px] shrink-0"
                                            alt=""
                                        />
                                    ) : (
                                        <img
                                            src="/mais_cinza.png"
                                            className="w-[12px] h-[12px] shrink-0"
                                            alt=""
                                        />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

const ColorPill = ({ nome, onRemove }) => (
    <div className="bg-[#A9E2F2] text-[#4696AD] px-3 py-1 rounded-full text-[13px] flex items-center gap-2">
        {nome}
        <button onClick={onRemove} className="flex items-center justify-center">
            <div className="w-[14px] h-[14px] bg-[#4696AD] rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                ✕
            </div>
        </button>
    </div>
);

const BORDER_DARK_05 = { borderWidth: "0.5px", borderStyle: "solid", borderColor: "#7B7D80" };
const BORDER_SHELL_05 = { borderWidth: "0.5px", borderStyle: "solid", borderColor: "#D9D9D9" };

export default function EdicaoFichaTecnicaModal({
    isOpen,
    onClose,
    onSuccess,
    fichaId,
    dadosFicha,
}) {
    const [loading, setLoading] = useState(false);

    const [coresSelecionadas, setCoresSelecionadas] = useState([]);
    const [todasCoresDisponiveis, setTodasCoresDisponiveis] = useState([]);
    const [matrizQuantidades, setMatrizQuantidades] = useState({});
    const [parceiros, setParceiros] = useState([]);
    const [parceirosRemovidos, setParceirosRemovidos] = useState([]);
    const [referenciaCliente, setReferenciaCliente] = useState("-");
    const [isProdutoParceirosOpen, setIsProdutoParceirosOpen] = useState(false);
    const [parceirosDisponiveis, setParceirosDisponiveis] = useState([]);
    const [aviamentos, setAviamentos] = useState([]);

    const sizeItems = useMemo(
        () => dadosFicha?.grade_versao?.itens || [],
        [dadosFicha?.grade_versao?.itens],
    );

    const produtoId = dadosFicha?.produto?.id;
    useEffect(() => {
        let isCurent = true;

        if (produtoId) {
            getAviamentosDoProduto(produtoId)
                .then((res) => {
                    if (isCurent) setAviamentos(res || []);
                })
                .catch((err) => {
                    console.error("Erro ao carregar aviamento para impressão", err);
                    if (isCurent) setAviamentos([]);
                });
        }
        return () => {
            isCurent = false;
        };
    }, [produtoId]);
    const listaAviamentos = produtoId ? aviamentos : [];

    const carregarParceirosDisponiveis = useCallback(async () => {
        if (!dadosFicha?.produto_id || !dadosFicha?.fabrico_id) return;
        try {
            const [parceirosDoFabrico, parceirosDoProduto] = await Promise.all([
                getParceirosByFabrico(dadosFicha.fabrico_id),
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
    }, [dadosFicha?.produto_id, dadosFicha?.fabrico_id]);

    const parceirosFiltrados = useMemo(() => {
        return parceirosDisponiveis.filter((parceiro) => {
            const categoria = parceiro.categoria || parceiro.parceiro?.categoria;
            if (!categoria) return false;

            const categoriaNormalizada = categoria
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();

            return (
                categoriaNormalizada === "costura" ||
                categoriaNormalizada === "faccao" ||
                categoriaNormalizada === "confeccao"
            );
        });
    }, [parceirosDisponiveis]);

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
                const cores = await getCoresByFabricoId(dadosFicha.fabrico_id);
                setTodasCoresDisponiveis(cores);
            } catch (error) {
                console.error("Erro ao buscar cores", error);
            }
        }
    }, [dadosFicha?.fabrico_id]);

    useEffect(() => {
        if (isOpen && dadosFicha) {
            carregarCoresDaFabrica();
            carregarParceirosDisponiveis();

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
                    id: item.id,
                    quantidade: item.quantidade,
                };
            });
            setMatrizQuantidades(matrizInicial);

            const categoriasAceitas = ["costura", "faccao", "confeccao"];

            const normalizarCategoria = (categoria) =>
                (categoria || "")
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase();

            const parceirosIniciais = (dadosFicha.ficha_parceiro || [])
                .filter((p) =>
                    categoriasAceitas.includes(normalizarCategoria(p.parceiro?.categoria)),
                )
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

    const handleAddParceiroSelecionado = (novoParceiro) => {
        const jaExiste = parceiros.some((p) => p.parceiro_id === novoParceiro.id);
        if (jaExiste) return;

        const novoVinculo = {
            parceiro_id: novoParceiro.id,
            parceiro: {
                id: novoParceiro.id,
                nome: novoParceiro.nome,
            },
            operacao: "",
            preco_editavel: novoParceiro.preco || 0,
            parceiroProdutoExiste: novoParceiro.preco !== null && novoParceiro.preco !== undefined,
            isNovo: true,
        };

        setParceiros((prev) => [...prev, novoVinculo]);
    };

    const quantidadeTotal = useMemo(() => {
        let total = 0;
        Object.values(matrizQuantidades).forEach((tamanhos) => {
            Object.values(tamanhos).forEach((celula) => {
                total += Number(celula.quantidade || 0);
            });
        });
        return total;
    }, [matrizQuantidades]);

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

    const proporcoes = useMemo(() => {
        const arrayDeTotais = sizeItems.map((s) => totaisPorTamanho[s.id] || 0);
        const arrayDeProporcoes = calcularProporcao(arrayDeTotais);
        const propsObj = {};
        sizeItems.forEach((s, index) => {
            propsObj[s.id] = arrayDeProporcoes[index];
        });

        return propsObj;
    }, [sizeItems, totaisPorTamanho]);

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

    const handleRemoverParceiro = (index) => {
        const parceiroParaRemover = parceiros[index];
        if (parceiroParaRemover.parceiro_id) {
            setParceirosRemovidos((prev) => [...prev, parceiroParaRemover.parceiro_id]);
        }
        setParceiros((prev) => prev.filter((_, i) => i !== index));
    };

    const handleConcluir = async () => {
        setLoading(true);
        try {
            const coresIds = coresSelecionadas.map((c) => c.id);

            const promessasItens = [];
            Object.keys(matrizQuantidades).forEach((corId) => {
                if (!coresSelecionadas.some((c) => c.id === Number(corId))) return;

                Object.keys(matrizQuantidades[corId]).forEach((gradeItemId) => {
                    const celula = matrizQuantidades[corId][gradeItemId];

                    if (celula.id) {
                        if (celula.quantidade > 0) {
                            promessasItens.push(
                                updateFichaTecnicaItem(celula.id, {
                                    quantidade: Number(celula.quantidade),
                                }),
                            );
                        } else {
                            promessasItens.push(deleteFichaTecnicaItem(celula.id));
                        }
                    } else if (celula.quantidade > 0) {
                        promessasItens.push(
                            createFichaTecnicaItem(fichaId, {
                                cor_id: Number(corId),
                                grade_versao_item_id: Number(gradeItemId),
                                quantidade: Number(celula.quantidade),
                            }),
                        );
                    }
                });
            });

            const promessasParceiros = parceiros.map((p) => {
                const requisicoesDoParceiro = [];

                if (p.parceiroProdutoExiste) {
                    requisicoesDoParceiro.push(
                        updateParceiroProdutoPrice(
                            p.parceiro_id,
                            dadosFicha.produto_id,
                            Number(p.preco_editavel),
                        ),
                    );
                } else {
                    requisicoesDoParceiro.push(
                        createParceiroProduto(
                            p.parceiro_id,
                            dadosFicha.produto_id,
                            Number(p.preco_editavel),
                        ),
                    );
                }

                const temMultiplosParceiros = parceiros.length > 1;

                const payloadFichaParceiro = {
                    operacao: p.operacao,
                    quantidade: temMultiplosParceiros ? 0 : quantidadeTotal,
                    valor: temMultiplosParceiros
                        ? undefined
                        : Number((quantidadeTotal * Number(p.preco_editavel)).toFixed(2)),
                };
                if (p.isNovo) {
                    requisicoesDoParceiro.push(
                        createFichaParceiro(
                            fichaId,
                            p.parceiro_id,
                            p.operacao,
                            payloadFichaParceiro.valor,
                            payloadFichaParceiro.quantidade,
                        ),
                    );
                } else {
                    requisicoesDoParceiro.push(
                        updateFichaTecnicaParceiro(fichaId, p.parceiro_id, payloadFichaParceiro),
                    );
                }

                return Promise.all(requisicoesDoParceiro);
            });

            const promessasDelecaoParceiros = parceirosRemovidos.map((parceiroId) =>
                deleteFichaTecnicaParceiro(fichaId, parceiroId),
            );

            const promessaAtualizarQuantidade = updateFichaTecnica(fichaId, {
                quantidade: quantidadeTotal,
            });

            await Promise.all([
                ...promessasItens,
                ...promessasParceiros,
                ...promessasDelecaoParceiros,
                promessaAtualizarQuantidade,
            ]);
            await syncFichaTecnicaCores(fichaId, coresIds);

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Erro ao salvar edição", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm print:hidden"
                onClick={() => {
                    if (!isProdutoParceirosOpen) {
                        onClose();
                    }
                }}
            >
                <div
                    className="bg-white rounded-[24px] w-full max-w-[850px] max-h-[95vh] flex flex-col shadow-2xl relative overflow-hidden font-['Outfit',_sans-serif]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <img
                                src="/etiqueta-preta.png"
                                alt="Tag"
                                className="w-[28px] h-[28px] object-contain opacity-70"
                            />
                            <h2 className="text-[26px] font-light text-[#404040]">
                                Editar Ficha Técnica {dadosFicha?.numero}
                            </h2>
                        </div>
                        <button onClick={onClose}>
                            <img
                                src="/fechar-cinza.png"
                                alt="icone de fechar"
                                className="w-[10.5px] h-[10.5px] object-contain"
                            />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-sutil">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-[209px] h-[160px] shrink-0 rounded-[10px] overflow-hidden border border-dashed border-[#898C8F]">
                                <img
                                    src={dadosFicha?.produto?.foto || "/image-placeholder.png"}
                                    alt="Foto do Produto"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3 content-start">
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

                                <ColorDropdown
                                    coresDisponiveis={todasCoresDisponiveis}
                                    coresSelecionadas={coresSelecionadas}
                                    onToggleCor={handleToggleCor}
                                />

                                <FloatingInput
                                    label="Grade Atual"
                                    valor={dadosFicha?.grade_versao?.grade?.nome || "Adulto"}
                                    readOnly
                                    muted
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            {coresSelecionadas.map((cor) => (
                                <ColorPill
                                    key={cor.id}
                                    nome={cor.nome}
                                    onRemove={() => handleToggleCor(cor)}
                                />
                            ))}
                        </div>

                        <div className="mt-4">
                            <div className="mb-2 text-center text-[15px] font-light text-[#737373]">
                                Grade
                            </div>
                            <div className="w-full">
                                <div className="flex w-full items-stretch min-h-[30px]">
                                    <div className="w-[160px] shrink-0" />
                                    <div className="flex flex-1 min-w-0">
                                        {sizeItems.map((s, i) => (
                                            <div
                                                key={`total-${s.id}`}
                                                className="bg-[#F4F4F4] flex-1 min-w-0 text-center text-[13px] font-light flex items-center justify-center text-[#D7D7D7]"
                                                style={{
                                                    borderColor: "#7B7D80",
                                                    borderLeftWidth: "0.5px",
                                                    borderRightWidth:
                                                        i === sizeItems.length - 1
                                                            ? "0.5px"
                                                            : "0px",
                                                    borderTopWidth: "0.5px",
                                                    borderBottomWidth: "0.5px",
                                                    borderTopLeftRadius: i === 0 ? "10px" : "0px",
                                                    borderTopRightRadius:
                                                        i === sizeItems.length - 1 ? "10px" : "0px",
                                                    color:
                                                        totaisPorTamanho[s.id] > 0
                                                            ? "#898C8F"
                                                            : "#D7D7D7",
                                                }}
                                            >
                                                {proporcoes[s.id] || 0}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex h-[40px] items-stretch">
                                    <div className="w-[160px] shrink-0 rounded-tl-[10px] font-normal bg-[#C9EAF6] px-4 text-[#4696AD] flex items-center justify-center overflow-hidden">
                                        Cores
                                    </div>
                                    <div className="flex flex-1 min-w-0">
                                        {sizeItems.map((s, idx) => (
                                            <div
                                                key={`header-${s.id}`}
                                                className="flex-1 min-w-0 text-center text-[14px] font-normal text-[#4696AD] flex items-center justify-center bg-[#C9EAF6]"
                                                style={{
                                                    borderLeftWidth: idx === 0 ? "0.5px" : "0px",
                                                    borderRightWidth: "0.5px",
                                                    borderColor: "#7B7D80",
                                                }}
                                            >
                                                {s.tamanho?.codigo || "-"}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    className="rounded-b-[10px] bg-white overflow-hidden"
                                    style={BORDER_SHELL_05}
                                >
                                    <div className="flex flex-col w-full">
                                        {coresSelecionadas.length > 0 ? (
                                            coresSelecionadas.map((cor, index) => (
                                                <div
                                                    key={cor.id}
                                                    className={`flex w-full min-h-[45px] items-stretch ${
                                                        index % 2 === 1
                                                            ? "bg-[#F9F9F9]"
                                                            : "bg-[#FFFFFF]"
                                                    }`}
                                                >
                                                    <div
                                                        className="w-[160px] shrink-0 pl-4 pr-4 flex items-center gap-3"
                                                        style={{
                                                            ...BORDER_DARK_05,
                                                            borderTopWidth: "0px",
                                                            borderLeftWidth: "0px",
                                                            borderBottomWidth: "0px",
                                                            borderRightWidth: "0.5px",
                                                        }}
                                                    >
                                                        <span
                                                            className="w-[18px] h-[18px] rounded-[4px] shrink-0 shadow-sm border border-black/10"
                                                            style={{
                                                                backgroundColor:
                                                                    cor.codigo_hex || "#E5E5E5",
                                                            }}
                                                        />
                                                        <span className="flex-1 text-[14px] font-light text-[#707070] truncate">
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
                                                                    borderLeftWidth: "0px",
                                                                    borderRightWidth:
                                                                        sizeIndex !==
                                                                        sizeItems.length - 1
                                                                            ? "0.5px"
                                                                            : "0px",
                                                                }}
                                                            >
                                                                <input
                                                                    type="number"
                                                                    min="0"
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
                                                                    className="w-full h-full text-center text-[14px] text-[#707070] bg-transparent outline-none placeholder:text-[#D7D7D7] [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-4 text-[13px] text-center text-[#888]">
                                                Nenhuma cor selecionada.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-[#E8E8E8] rounded-[10px]">
                            <table className="w-full text-center text-sm">
                                <thead className="bg-[#C9EAF6] text-[#4696AD]">
                                    <tr>
                                        <th className="py-3 border-r border-white/50 font-normal w-1/3 rounded-tl-[9px]">
                                            Facção
                                        </th>
                                        <th className="py-3 border-r border-white/50 font-normal w-1/3">
                                            Operação
                                        </th>
                                        <th className="py-3 font-normal w-1/3 rounded-tr-[9px]">
                                            Preço Unitário
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#707070]">
                                    {parceiros.map((vinculo, index) => {
                                        const isLastRow = index === parceiros.length - 1;

                                        return (
                                            <tr
                                                key={vinculo.id || index}
                                                className="group border-t border-[#E8E8E8] transition-colors hover:bg-[#F9F9F9]"
                                            >
                                                <td
                                                    className={`py-3 ${isLastRow ? "rounded-bl-[9px]" : ""}`}
                                                >
                                                    {vinculo.parceiro?.nome || "-"}
                                                </td>
                                                <td className="p-0 border-r border-[#E8E8E8]">
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
                                                <td className="p-0 relative">
                                                    <div className="flex items-center justify-center w-full h-full">
                                                        <span className="text-[#707070]">R$</span>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={
                                                                vinculo.preco_editavel
                                                                    ? Number(vinculo.preco_editavel)
                                                                          .toFixed(2)
                                                                          .replace(".", ",")
                                                                    : ""
                                                            }
                                                            onChange={(e) => {
                                                                const numeros =
                                                                    e.target.value.replace(
                                                                        /\D/g,
                                                                        "",
                                                                    );
                                                                const valorNumerico = numeros
                                                                    ? Number(numeros) / 100
                                                                    : 0;
                                                                handleParceiroChange(
                                                                    index,
                                                                    "preco_editavel",
                                                                    valorNumerico,
                                                                );
                                                            }}
                                                            className="w-[50px] py-3 pl-1 text-left bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </div>

                                                    <div className="absolute top-0 -right-[30px] w-[30px] h-full flex items-center justify-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-20">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoverParceiro(index)
                                                            }
                                                            className="w-[18px] h-[18px] flex items-center justify-center hover:opacity-70 transition-opacity"
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
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Botão Atribuir Facção */}
                        <button
                            type="button"
                            onClick={() => setIsProdutoParceirosOpen(true)}
                            className="w-full py-3 bg-[#F8F8F8] text-[#898C8F] text-[14px] font-light rounded-[10px] flex items-center justify-center gap-2 hover:bg-[#ebebeb] transition-colors"
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

                        <div className="max-[30px] relative mt-5 break-inside-avoid">
                            <fieldset className="border border-[#E8E8E8] rounded-[10px] p-4 bg-[#F9F9F9] min-h-[80px]">
                                <legend className="px-2 text-[12px] text-[#898C8F] ml-2 font-light bg-white">
                                    Materiais necessários por peça:
                                </legend>
                                {listaAviamentos.length > 0 ? (
                                    <div className="flex flex-col gap-1 text-[13px] px-2 pt-1 font-light">
                                        {listaAviamentos.map((item, index) => {
                                            const quantidade = item.quantidade ?? "";
                                            const unidade = simplificarUnidade(
                                                item.aviamentos?.unidade_media ?? "",
                                            );
                                            const nome = item.aviamentos?.nome;
                                            return (
                                                <div
                                                    key={item.aviamentos?.id ?? index}
                                                    className="leading-relaxed"
                                                >
                                                    <span className="text-[#898C8F]">
                                                        {quantidade} {unidade}
                                                    </span>{" "}
                                                    <span className="text-[#898C8F]">
                                                        de {nome}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[13px] text-[#898C8F] font-light px-2 pt-1">
                                        Nenhum material cadastrado.
                                    </p>
                                )}
                            </fieldset>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="px-8 py-5 border-t border-gray-100 flex justify-end items-center shrink-0">
                        <button
                            onClick={handleConcluir}
                            disabled={loading}
                            className="px-10 h-[42px] rounded-full bg-[#A9E2F2] text-[#4996AD] font-normal text-[15px] hover:bg-[#A2DCED] transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading ? "Salvando..." : "Concluir"}
                        </button>
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
        </>
    );
}
