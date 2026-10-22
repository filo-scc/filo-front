import React, { useState, useEffect, useRef, useMemo } from "react";
import { getAllEtapas } from "../../services/etapaService";
import { getParceiros } from "../../services/parceiroService";
import { transferirEtapaFicha } from "../../services/fichasTecnicasService";

import { getFichaParceiroByFicha } from "../../services/fichaParceiroService";
import RelatorioDeAcabamento from "./RelatorioDeAcabamento.jsx";
import NovoParceiroModal from "../parceiros/NovoParceiroModal.jsx";
import {
    formatarQuantidadeCampo,
    getEffectiveQuantity,
    lerQuantidadeDigitada,
} from "../../utils/quantidadesTransferencia.js";
import {
    montarAvisoPrecoInvalido,
    obterMensagemErroTransferencia,
} from "../../utils/mensagensTransferencia.js";
import { encontrarParceiroPorNome, filtrarParceirosDaEtapa } from "../../utils/parceiroForm.js";
import { calcularPercentualSoma, obterIniciais } from "../../utils/layoutTransferencia.js";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

function parseCurrencyToNumber(value) {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return value;

    const normalized = String(value).replace(/[^\d]/g, "");
    if (!normalized) return 0;

    return Number(normalized) / 100;
}

function formatCurrencyBR(value) {
    return currencyFormatter.format(parseCurrencyToNumber(value));
}

import { InlineLoading, SkeletonBox } from "../geral/Loading";

function TransferenciaEtapaLoading() {
    return (
        <div className="flex flex-1 flex-col md:block">
            <div className="flex justify-center pb-4 md:pb-7">
                <InlineLoading label="Carregando modal de transferência" />
            </div>

            {/* Etapas (mobile): os dois chips */}
            <div className="mb-4 flex w-full items-center gap-1 md:hidden">
                <SkeletonBox className="h-8 min-w-0 flex-1 rounded-full" />
                <SkeletonBox className="h-[14px] w-[14px] shrink-0 rounded-full" />
                <SkeletonBox className="h-8 min-w-0 flex-1 rounded-full" />
            </div>

            {/* Etapas (tablet e desktop): barra de progressão */}
            <div className="hidden w-full overflow-hidden pb-8 md:block">
                <div className="flex w-full items-center justify-center px-2 py-2 lg:min-w-max">
                    {[0, 1, 2, 3].map((item) => (
                        <React.Fragment key={item}>
                            <div className="relative">
                                <SkeletonBox className="h-[62px] w-[62px] rounded-[22px] lg:h-[83px] lg:w-[83px] lg:rounded-[30px]" />
                                <SkeletonBox className="absolute -bottom-6 left-1/2 h-[14px] w-[56px] -translate-x-1/2 rounded-[8px] lg:-bottom-7 lg:h-4 lg:w-[72px]" />
                            </div>
                            {item < 3 && (
                                <SkeletonBox className="mx-1 h-[2px] min-w-[12px] flex-1 rounded-none lg:w-[60px] lg:flex-none" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="mb-6 flex flex-col items-start">
                <SkeletonBox className="mb-2 h-[18px] w-[230px] max-w-full rounded-[8px]" />
                <SkeletonBox className="h-[48px] w-full rounded-[10px] md:h-[44px] md:max-w-[360px] lg:h-[39px] lg:w-[45%] lg:max-w-[320px]" />
            </div>

            {/* Tabela (desktop) */}
            <div className="mb-6 hidden w-full lg:block">
                <div className="grid h-10 grid-cols-3 overflow-hidden rounded-t-[10px]">
                    {[0, 1, 2].map((item) => (
                        <SkeletonBox
                            key={item}
                            className="h-10 rounded-none border-r border-[#D9D9D9] last:border-r-0"
                        />
                    ))}
                </div>
                <div className="overflow-hidden rounded-b-[10px] border-x border-b border-[#D9D9D9]">
                    {[0, 1, 2].map((row) => (
                        <div
                            key={row}
                            className="grid h-10 grid-cols-3 border-b border-[#E8E8E8] last:border-b-0"
                        >
                            {[0, 1, 2].map((cell) => (
                                <div
                                    key={`${row}-${cell}`}
                                    className={`flex items-center justify-center border-r border-[#E8E8E8] px-4 last:border-r-0 ${
                                        row % 2 === 1 ? "bg-[#F4F4F4]" : "bg-white"
                                    }`}
                                >
                                    <SkeletonBox className="h-[14px] w-[65%] rounded-[8px]" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Cartões de parceiros (tablet e mobile) */}
            <div className="mb-6 flex flex-col gap-3 lg:hidden">
                {[0, 1].map((cartao) => (
                    <div
                        key={cartao}
                        className="rounded-[16px] border border-[#D5E4EA] p-3.5 md:rounded-[14px] md:p-4"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <SkeletonBox className="h-9 w-9 shrink-0 rounded-full md:hidden" />
                                <SkeletonBox className="h-4 w-[120px] rounded-[8px]" />
                            </div>
                            <SkeletonBox className="h-5 w-[90px] rounded-[8px]" />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                            {[0, 1, 2].map((campo) => (
                                <div
                                    key={campo}
                                    className={`flex flex-col gap-1 ${
                                        campo === 0 ? "col-span-2 md:col-span-1" : ""
                                    }`}
                                >
                                    <SkeletonBox className="h-3 w-[60px] rounded-[8px]" />
                                    <SkeletonBox className="h-9 w-full rounded-[10px]" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Botão (desktop) */}
            <div className="hidden justify-end pt-4 lg:flex">
                <SkeletonBox className="h-[39px] w-[200px] rounded-full" />
            </div>

            {/* Rodapé fixo (tablet e mobile): empurrado para o fim da tela no celular */}
            <div className="min-h-6 flex-1 md:hidden" aria-hidden="true" />
            <div className="sticky -bottom-4 z-20 -mx-4 -mb-4 flex flex-col gap-3 border-t border-[#EEEEEE] bg-white px-4 pb-4 pt-3 md:-bottom-8 md:-mx-8 md:-mb-8 md:mt-6 md:flex-row md:items-center md:gap-6 md:px-8 md:py-4 lg:hidden">
                <div className="flex items-end justify-between gap-6 md:flex-1 md:items-center">
                    <div className="flex flex-col gap-1.5 md:flex-1">
                        <SkeletonBox className="h-[14px] w-[100px] rounded-[8px]" />
                        <SkeletonBox className="hidden h-2 w-full rounded-full md:block" />
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-1 md:ml-0 md:items-start">
                        <SkeletonBox className="h-3 w-[70px] rounded-[8px]" />
                        <SkeletonBox className="h-[22px] w-[90px] rounded-[8px]" />
                    </div>
                </div>
                <SkeletonBox className="h-[52px] w-full rounded-full md:h-[48px] md:w-[180px] md:shrink-0" />
            </div>
        </div>
    );
}

// Botão do topo no mobile (só a seta) que expande a lista de etapas antes/depois dos chips.
function BotaoEtapasVizinhas({ quantidade, anteriores, aberto, onClick }) {
    const rotulo = `${quantidade} ${quantidade === 1 ? "etapa" : "etapas"}`;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-expanded={aberto}
            aria-label={`${rotulo} ${anteriores ? "anteriores" : "seguintes"}`}
            className={`flex h-11 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#6B6E72] ${
                anteriores ? "-ml-3" : "-mr-3"
            }`}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={aberto ? (anteriores ? "-rotate-90" : "rotate-90") : ""}
            >
                <path d={anteriores ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
            </svg>
        </button>
    );
}

// Campos dos cartões de parceiro (tablet e mobile): 48px no celular (evita zoom do iOS) e 44px no tablet.
const CAMPO_CARTAO =
    "h-[48px] w-full rounded-[12px] border border-[#898C8F] bg-white px-3 text-[16px] font-normal text-[#404040] outline-none md:h-[44px] md:rounded-[10px] md:text-[15px]";

export default function TransferenciaEtapaModal({
    isOpen,
    onClose,
    fichaTecnica,
    fabricoId,
    etapaConcluida,
    proximaEtapa,
    onSuccess,
}) {
    // --- Estados ---
    const [etapas, setEtapas] = useState([]);
    const [parceirosDisponiveis, setParceirosDisponiveis] = useState([]);
    const [linhasTabela, setLinhasTabela] = useState([]);

    const [buscaParceiro, setBuscaParceiro] = useState("");
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [novoParceiroAberto, setNovoParceiroAberto] = useState(false);
    const [etapasAnterioresAbertas, setEtapasAnterioresAbertas] = useState(false);
    const [etapasPosterioresAbertas, setEtapasPosterioresAbertas] = useState(false);

    // Estados para o comportamento visual da nova tabela
    const [hoveredParceiroIndex, setHoveredParceiroIndex] = useState(null);
    const [tabelaScrollTop, setTabelaScrollTop] = useState(0);

    // Estado do relatório de acabamento (perdas)
    const [relatorioPerdas, setRelatorioPerdas] = useState({
        defeitoCostura: 0,
        defeitoTecido: 0,
        retiradas: 0,
        sobras: 0,
    });

    // Refs
    const dropdownRef = useRef(null);
    const tabelaScrollRef = useRef(null);
    const etapasScrollRef = useRef(null);
    const etapasRefs = useRef({});
    const dragStateRef = useRef({
        isDragging: false,
        startX: 0,
        scrollLeft: 0,
    });

    const indiceProximaEtapa = useMemo(() => {
        return etapas.findIndex((e) => e.id === proximaEtapa?.id);
    }, [etapas, proximaEtapa?.id]);

    const isUltimaEtapa = useMemo(() => {
        if (etapas.length === 0 || !proximaEtapa?.id) return false;
        return etapas[etapas.length - 1]?.id === proximaEtapa.id;
    }, [etapas, proximaEtapa?.id]);

    const somaQuantidades = useMemo(() => {
        return linhasTabela.reduce((acc, curr) => acc + Number(curr.quantidade || 0), 0);
    }, [linhasTabela]);

    const quantidadeValida = useMemo(() => {
        if (linhasTabela.length <= 1) return true;
        return somaQuantidades === Number(fichaTecnica?.quantidade || 0);
    }, [linhasTabela.length, somaQuantidades, fichaTecnica?.quantidade]);

    const parceirosComPrecoInvalido = useMemo(() => {
        return linhasTabela.filter(
            (linha) => parseCurrencyToNumber(linha.precoUnitarioFormatado) <= 0,
        );
    }, [linhasTabela]);

    const precoUnitarioValido = parceirosComPrecoInvalido.length === 0;

    const custoTotalGeral = useMemo(() => {
        return linhasTabela.reduce(
            (acc, linha) => acc + parseCurrencyToNumber(linha.custoTotalFormatado),
            0,
        );
    }, [linhasTabela]);

    const etapasAnteriores = useMemo(() => {
        const indice = etapas.findIndex((e) => e.id === etapaConcluida?.id);
        return indice > 0 ? etapas.slice(0, indice) : [];
    }, [etapas, etapaConcluida?.id]);

    const etapasPosteriores = useMemo(
        () => (indiceProximaEtapa >= 0 ? etapas.slice(indiceProximaEtapa + 1) : []),
        [etapas, indiceProximaEtapa],
    );

    const totalPerdas = useMemo(
        () =>
            Number(relatorioPerdas.defeitoCostura || 0) +
            Number(relatorioPerdas.defeitoTecido || 0) +
            Number(relatorioPerdas.retiradas || 0) +
            Number(relatorioPerdas.sobras || 0),
        [relatorioPerdas],
    );
    const perdasValidas = !isUltimaEtapa || totalPerdas <= Number(fichaTecnica?.quantidade || 0);

    const gridTemplateColumnsTabela =
        linhasTabela.length > 1
            ? "minmax(180px, 1.15fr) minmax(150px, 0.85fr) minmax(130px, 0.6fr) minmax(160px, 0.8fr) minmax(170px, 0.85fr)"
            : "minmax(180px, 1.15fr) minmax(150px, 0.85fr) minmax(160px, 0.8fr) minmax(170px, 0.85fr)";

    const registrarRefEtapa = (etapaId) => (node) => {
        if (node) {
            etapasRefs.current[etapaId] = node;
        } else {
            delete etapasRefs.current[etapaId];
        }
    };

    const iniciarArrasteEtapas = (event) => {
        if (!etapasScrollRef.current) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;

        dragStateRef.current = {
            isDragging: true,
            startX: event.clientX,
            scrollLeft: etapasScrollRef.current.scrollLeft,
        };

        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch (error) {
            console.log(error);
            // Ignorado de propósito.
        }
    };

    const moverArrasteEtapas = (event) => {
        if (!dragStateRef.current.isDragging || !etapasScrollRef.current) return;

        const delta = event.clientX - dragStateRef.current.startX;
        etapasScrollRef.current.scrollLeft = dragStateRef.current.scrollLeft - delta;
    };

    const finalizarArrasteEtapas = (event) => {
        dragStateRef.current.isDragging = false;

        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch (error) {
            console.log(error);
            // Ignorado de propósito.
        }
    };

    useEffect(() => {
        const carregarDadosIniciais = async () => {
            setLoading(true);
            try {
                // 1. Buscar todas as etapas do contexto autenticado
                const listaEtapas = await getAllEtapas();
                const ativasEOrdenadas = listaEtapas
                    .filter((e) => e.ativa)
                    .sort((a, b) => a.ordem - b.ordem);
                setEtapas(ativasEOrdenadas);

                // 2. Buscar parceiros do fabrico filtrando pela categoria da etapa concluída
                const listaParceiros = await getParceiros();
                const filtradosPorCategoria = filtrarParceirosDaEtapa(
                    listaParceiros,
                    etapaConcluida?.nome,
                );
                setParceirosDisponiveis(filtradosPorCategoria);

                // 3. Buscar parceiros já associados a esta Ficha Técnica
                const parceirosExistentesRaw = await getFichaParceiroByFicha(fichaTecnica.id);
                const parceirosExistentes = Array.isArray(parceirosExistentesRaw)
                    ? parceirosExistentesRaw
                    : [];

                const vinculadosDestaEtapa = parceirosExistentes.filter(
                    (fp) =>
                        fp?.parceiro?.categoria?.toLowerCase() ===
                        etapaConcluida?.nome?.toLowerCase(),
                );

                const jaVinculadosDestaEtapa = vinculadosDestaEtapa.map((fp) => {
                    // Zero registrado é zero: só com parceiro único a linha assume o total da ficha.
                    const quantidade = getEffectiveQuantity(
                        fp,
                        vinculadosDestaEtapa.length,
                        fichaTecnica?.quantidade,
                    );

                    // o backend pode devolver "valor" ou "custo";
                    const valorBruto = Number(fp?.valor ?? fp?.custo ?? 0);

                    // se o valor recebido for o total, o unitário é o total dividido pela quantidade
                    // com que ele foi registrado (a exibida só substitui quando não havia registro)
                    const quantidadeRegistrada = Number(fp?.quantidade || 0);
                    const quantidadeBase =
                        quantidadeRegistrada > 0 ? quantidadeRegistrada : quantidade;
                    const precoUnitario = quantidadeBase > 0 ? valorBruto / quantidadeBase : 0;

                    return {
                        id: fp.parceiro.id,
                        nome: fp.parceiro.nome,
                        operacao: fp.operacao || "",
                        quantidade,
                        precoUnitarioFormatado: formatCurrencyBR(precoUnitario),
                        custoTotalFormatado: formatCurrencyBR(valorBruto),
                    };
                });

                setLinhasTabela(jaVinculadosDestaEtapa);

                // 4. Inicializar relatório de acabamento (perdas) a partir da Ficha Técnica,
                // aceitando tanto snake_case quanto camelCase, conforme o que a API retornar.
                setRelatorioPerdas({
                    defeitoCostura: Number(
                        fichaTecnica?.defeitos_costura ?? fichaTecnica?.defeitoCostura ?? 0,
                    ),
                    defeitoTecido: Number(
                        fichaTecnica?.defeitos_tecido ?? fichaTecnica?.defeitoTecido ?? 0,
                    ),
                    retiradas: Number(fichaTecnica?.retiradas ?? 0),
                    sobras: Number(fichaTecnica?.sobras ?? 0),
                });
            } catch (err) {
                console.error("Erro ao carregar dados do modal de transferência:", err);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && fabricoId && fichaTecnica?.id) {
            carregarDadosIniciais();
        }
    }, [
        isOpen,
        fabricoId,
        fichaTecnica.id,
        fichaTecnica?.quantidade,
        etapaConcluida.id,
        etapaConcluida?.nome,
        proximaEtapa.id,
        proximaEtapa.nome,
        fichaTecnica?.defeitos_costura,
        fichaTecnica?.defeitoCostura,
        fichaTecnica?.defeitos_tecido,
        fichaTecnica?.defeitoTecido,
        fichaTecnica?.retiradas,
        fichaTecnica?.sobras,
    ]);

    useEffect(() => {
        if (!isOpen || loading || !proximaEtapa?.id) return;

        const frame = window.requestAnimationFrame(() => {
            const alvo = etapasRefs.current[proximaEtapa.id];
            if (alvo) {
                alvo.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest",
                });
            }
        });

        return () => window.cancelAnimationFrame(frame);
    }, [isOpen, loading, proximaEtapa?.id, etapas]);

    useEffect(() => {
        // --- Fechamento do Dropdown ao clicar fora ---
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownAberto(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Filtragem Dinâmica do Dropdown ---
    const parceirosFiltrados = useMemo(() => {
        return parceirosDisponiveis.filter((p) => {
            const jaAdicionado = linhasTabela.some((linha) => linha.id === p.id);
            const bateBusca = p.nome?.toLowerCase().includes(buscaParceiro.toLowerCase());
            return !jaAdicionado && bateBusca;
        });
    }, [parceirosDisponiveis, linhasTabela, buscaParceiro]);

    // --- Cadastro de parceiro novo dentro do modal ---
    // O cadastro responde só com uma mensagem; por isso a lista é recarregada para achar o parceiro criado.
    const aoCadastrarParceiro = async ({ nome }) => {
        setNovoParceiroAberto(false);

        try {
            const listaAtualizada = await getParceiros();
            setParceirosDisponiveis(filtrarParceirosDaEtapa(listaAtualizada, etapaConcluida?.nome));

            const criado = encontrarParceiroPorNome(listaAtualizada, nome);
            if (criado) {
                adicionarParceiroNaTabela(criado);
                return;
            }
        } catch (error) {
            console.error("Erro ao atualizar a lista de parceiros:", error);
        }

        setSubmitError(
            "Parceiro cadastrado, mas não foi possível selecioná-lo. Escolha-o na lista.",
        );
    };

    // --- Ações da Tabela ---
    const adicionarParceiroNaTabela = (parceiro) => {
        const quantidadeInicial =
            linhasTabela.length === 0 ? Number(fichaTecnica?.quantidade || 0) : 0;

        const novaLinha = {
            id: parceiro.id,
            nome: parceiro.nome,
            operacao: "",
            quantidade: quantidadeInicial,
            precoUnitarioFormatado: formatCurrencyBR(0),
            custoTotalFormatado: formatCurrencyBR(0),
        };

        setLinhasTabela((prev) => [...prev, novaLinha]);
        setBuscaParceiro("");
        setDropdownAberto(false);
    };

    const removerParceiroDaTabela = (id) => {
        setLinhasTabela((prev) => {
            const restantes = prev.filter((linha) => linha.id !== id);

            if (restantes.length === 1) {
                const unicaLinha = restantes[0];
                const quantidadeEfetiva = Number(fichaTecnica?.quantidade || 0);
                const precoUnitario = parseCurrencyToNumber(unicaLinha.precoUnitarioFormatado);

                return [
                    {
                        ...unicaLinha,
                        quantidade: quantidadeEfetiva,
                        custoTotalFormatado: formatCurrencyBR(precoUnitario * quantidadeEfetiva),
                    },
                ];
            }

            return restantes;
        });
    };

    const atualizarCampoLinha = (id, campo, valor) => {
        setLinhasTabela((prev) =>
            prev.map((linha) => {
                if (linha.id !== id) return linha;

                const linhaAtualizada = {
                    ...linha,
                };

                if (campo === "precoUnitarioFormatado" || campo === "custoTotalFormatado") {
                    linhaAtualizada[campo] = formatCurrencyBR(valor);
                } else {
                    linhaAtualizada[campo] = valor;
                }

                const quantidade =
                    prev.length === 1
                        ? Number(fichaTecnica?.quantidade || 0)
                        : Number(linhaAtualizada.quantidade || 0);

                if (campo === "precoUnitarioFormatado" || campo === "quantidade") {
                    const preco = parseCurrencyToNumber(linhaAtualizada.precoUnitarioFormatado);

                    linhaAtualizada.custoTotalFormatado = formatCurrencyBR(preco * quantidade);
                }

                if (campo === "custoTotalFormatado") {
                    const total = parseCurrencyToNumber(linhaAtualizada.custoTotalFormatado);

                    const preco = quantidade > 0 ? total / quantidade : 0;

                    linhaAtualizada.precoUnitarioFormatado = formatCurrencyBR(preco);
                }

                return linhaAtualizada;
            }),
        );
    };

    const alterarQuantidade = (id, texto) => {
        atualizarCampoLinha(id, "quantidade", lerQuantidadeDigitada(texto));
    };

    // --- Ação do Relatório de Acabamento (perdas) ---
    const handleChangeRelatorioPerdas = (campo, valor) => {
        setRelatorioPerdas((prev) => ({
            ...prev,
            [campo]: valor,
        }));
    };

    // --- Submit / Processamento da Transferência ---
    const handleTransferir = async () => {
        if (!quantidadeValida || !precoUnitarioValido || !perdasValidas) {
            return;
        }

        setSubmitError("");
        setSubmitting(true);
        try {
            const payload = {
                ficha_tecnica_id: fichaTecnica.id,
                etapa_origem_id: etapaConcluida?.id,
                etapa_destino_id: proximaEtapa?.id,
                parceiros: linhasTabela.map((linha) => ({
                    parceiro_id: linha.id,
                    operacao: linha.operacao,
                    preco: parseCurrencyToNumber(linha.precoUnitarioFormatado),
                    quantidade: getEffectiveQuantity(
                        linha,
                        linhasTabela.length,
                        fichaTecnica?.quantidade,
                    ),
                })),
            };

            if (isUltimaEtapa) {
                payload.relatorio = {
                    quantidade: Number(fichaTecnica?.quantidade || 0),
                    defeitos_costura: Number(relatorioPerdas.defeitoCostura) || 0,
                    defeitos_tecido: Number(relatorioPerdas.defeitoTecido) || 0,
                    retiradas: Number(relatorioPerdas.retiradas) || 0,
                    sobras: Number(relatorioPerdas.sobras) || 0,
                };
            }

            await transferirEtapaFicha(payload);

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Falha ao processar a transferência de etapa:", error);
            setSubmitError(obterMensagemErroTransferencia(error));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-0 font-['Outfit'] md:p-4">
            {/* CONTAINER PRINCIPAL DO MODAL */}
            <div className="scrollbar-sutil relative flex h-[100dvh] max-h-[100dvh] flex-col md:block w-full max-w-6xl overflow-y-auto rounded-none bg-white p-4 shadow-2xl md:h-auto md:max-h-[90vh] md:rounded-[24px] md:p-8">
                {/* CABEÇALHO DO MODAL */}
                <div className="sticky -top-4 z-30 -mx-4 -mt-4 mb-4 flex items-start justify-between border-b border-[#EEEEEE] bg-white px-4 pb-3 pt-4 md:static md:z-auto md:mx-0 md:mt-0 md:mb-8 md:border-0 md:p-0">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <img
                                src="/transferencia.png"
                                alt="Ícone"
                                className="hidden h-6 w-6 object-contain md:block md:max-lg:translate-y-[2px]"
                            />
                            <h2 className="text-[18px] font-light leading-tight text-[#404040] md:text-[22px] md:leading-none">
                                Transferência para {proximaEtapa.nome}
                            </h2>
                        </div>

                        <div className="mt-1 text-[12px] font-light leading-none text-[#7B7D80] md:ml-9 md:text-[14px]">
                            {[
                                fichaTecnica?.pedido?.numero
                                    ? `Nº${fichaTecnica.pedido.numero}`
                                    : null,
                                fichaTecnica?.numero ? (
                                    <>
                                        <span className="md:hidden">FT {fichaTecnica.numero}</span>
                                        <span className="hidden md:inline">
                                            Ficha Técnica: {fichaTecnica.numero}
                                        </span>
                                    </>
                                ) : null,
                                fichaTecnica?.pedido?.cliente?.nome || null,
                            ]
                                .filter(Boolean)
                                .map((texto, index, arrayOriginal) => (
                                    <React.Fragment key={index}>
                                        {texto}
                                        {/* Insere a barra colorida apenas se não for o último item da lista */}
                                        {index < arrayOriginal.length - 1 && (
                                            <span className="mx-2 text-[#D9D9D9]">|</span>
                                        )}
                                    </React.Fragment>
                                ))}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="-mr-2 -mt-1 rounded-full p-4 transition-colors md:m-0 md:p-2"
                    >
                        <img src="/fechar-cinza.png" alt="Fechar" className="h-3 w-3 opacity-50" />
                    </button>
                </div>

                {loading ? (
                    <TransferenciaEtapaLoading />
                ) : (
                    <>
                        {/* ETAPAS (MOBILE): chips da etapa concluída e da próxima, com as vizinhas recolhidas */}
                        <div className="mb-4 flex flex-col gap-1 md:hidden">
                            <div className="flex w-full items-center gap-1">
                                {etapasAnteriores.length > 0 && (
                                    <BotaoEtapasVizinhas
                                        quantidade={etapasAnteriores.length}
                                        anteriores
                                        aberto={etapasAnterioresAbertas}
                                        onClick={() =>
                                            setEtapasAnterioresAbertas((aberto) => !aberto)
                                        }
                                    />
                                )}
                                <div
                                    title={etapaConcluida?.nome}
                                    className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-[#B4D64E] bg-[#FBFFF0] px-2.5 text-[12px] text-[#5F7F0C]"
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="shrink-0"
                                    >
                                        <path d="M5 12l5 5 9-10" />
                                    </svg>
                                    <span className="truncate">{etapaConcluida?.nome}</span>
                                </div>
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#B0B2B5"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="shrink-0"
                                >
                                    <path d="M9 6l6 6-6 6" />
                                </svg>
                                <div
                                    title={proximaEtapa?.nome}
                                    className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-[#4696AD] bg-white px-2.5 text-[12px] font-medium text-[#1F6C85]"
                                >
                                    <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#4696AD]" />
                                    <span className="truncate">{proximaEtapa?.nome}</span>
                                </div>
                                {etapasPosteriores.length > 0 && (
                                    <BotaoEtapasVizinhas
                                        quantidade={etapasPosteriores.length}
                                        anteriores={false}
                                        aberto={etapasPosterioresAbertas}
                                        onClick={() =>
                                            setEtapasPosterioresAbertas((aberto) => !aberto)
                                        }
                                    />
                                )}
                            </div>
                            {etapasAnterioresAbertas && (
                                <p className="text-[12px] text-[#6B6E72]">
                                    Anteriores:{" "}
                                    {etapasAnteriores.map((etapa) => etapa.nome).join(" · ")}
                                </p>
                            )}
                            {etapasPosterioresAbertas && (
                                <p className="text-[12px] text-[#6B6E72]">
                                    Seguintes:{" "}
                                    {etapasPosteriores.map((etapa) => etapa.nome).join(" · ")}
                                </p>
                            )}
                        </div>

                        {/* BARRA DE PROGRESSÃO (ETAPAS) */}
                        <div
                            ref={etapasScrollRef}
                            onPointerDown={iniciarArrasteEtapas}
                            onPointerMove={moverArrasteEtapas}
                            onPointerUp={finalizarArrasteEtapas}
                            onPointerLeave={finalizarArrasteEtapas}
                            onPointerCancel={finalizarArrasteEtapas}
                            className="hidden w-full overflow-x-auto overflow-y-hidden pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab select-none touch-pan-x md:block"
                            style={{ msOverflowStyle: "none" }}
                        >
                            <div className="flex w-full items-center justify-center px-2 py-2 lg:min-w-max">
                                {etapas.map((etapa, idx) => {
                                    const isConcluida =
                                        indiceProximaEtapa !== -1 && idx < indiceProximaEtapa;
                                    const linkIcone = isConcluida
                                        ? etapa.icone_verde?.link
                                        : etapa.icone_cinza?.link;

                                    const estiloCaixa = isConcluida
                                        ? "bg-[#FBFFF0] border-[#B4D64E] text-[#B4D64E]"
                                        : "bg-[#F5F5F5] border-[#D9D9D9] text-[#D9D9D9]";

                                    return (
                                        <React.Fragment key={etapa.id}>
                                            <div
                                                ref={registrarRefEtapa(etapa.id)}
                                                className="relative z-10 flex shrink-0 flex-col items-center gap-3 bg-white"
                                            >
                                                <div
                                                    className={`flex h-[62px] w-[62px] items-center justify-center rounded-[22px] border transition-all lg:h-[83px] lg:w-[83px] lg:rounded-[30px] ${estiloCaixa}`}
                                                    title={etapa.descricao}
                                                >
                                                    {linkIcone && (
                                                        <img
                                                            src={linkIcone}
                                                            className="h-7 w-7 object-contain lg:h-9 lg:w-9"
                                                        />
                                                    )}
                                                </div>
                                                <span
                                                    className={`absolute -bottom-6 whitespace-nowrap text-[13px] font-normal tracking-wide lg:-bottom-7 lg:text-[16px] ${
                                                        isConcluida
                                                            ? "text-[#B4D64E]"
                                                            : "text-[#D9D9D9]"
                                                    }`}
                                                >
                                                    {etapa.nome}
                                                </span>
                                            </div>

                                            {idx < etapas.length - 1 &&
                                                (() => {
                                                    const proxEtapaLista = etapas[idx + 1];
                                                    const estaConcluida =
                                                        indiceProximaEtapa !== -1 &&
                                                        idx < indiceProximaEtapa;
                                                    const proximaConcluida =
                                                        indiceProximaEtapa !== -1 &&
                                                        idx + 1 < indiceProximaEtapa;

                                                    let estiloLinha = {
                                                        backgroundColor: "#D9D9D9",
                                                    };

                                                    if (estaConcluida && proximaConcluida) {
                                                        estiloLinha = {
                                                            backgroundColor: "#B4D64E",
                                                        };
                                                    } else if (
                                                        etapa.id === etapaConcluida?.id &&
                                                        proxEtapaLista.id === proximaEtapa?.id
                                                    ) {
                                                        estiloLinha = {
                                                            backgroundImage:
                                                                "linear-gradient(90deg, #B4D64E 0%, #D9D9D9 100%)",
                                                        };
                                                    }

                                                    return (
                                                        <div
                                                            className="z-0 mx-1 h-[2px] min-w-[12px] flex-1 transition-all lg:w-[60px] lg:flex-none"
                                                            style={estiloLinha}
                                                        />
                                                    );
                                                })()}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SELETOR (INPUT DE BUSCA COM DROPDOWN) */}
                        <div className="mb-6 flex flex-col items-start">
                            <label className="mb-2 block text-[16px] font-medium text-[#4696AD]">
                                Registrar custo do(a) {etapaConcluida.nome}
                            </label>

                            <div
                                className="relative w-full md:max-w-[360px] lg:w-[45%] lg:max-w-[320px]"
                                ref={dropdownRef}
                            >
                                <input
                                    type="text"
                                    value={buscaParceiro}
                                    onFocus={() => setDropdownAberto(true)}
                                    onChange={(e) => setBuscaParceiro(e.target.value)}
                                    placeholder="Parceiro"
                                    className="h-[48px] w-full rounded-[10px] border border-[#898C8F] bg-white px-4 text-[16px] text-[#404040] outline-none placeholder:text-[#898C8F] transition-all md:h-[44px] md:text-[15px] lg:h-[39px] lg:text-[14px]"
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#898C8F]">
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>

                                {dropdownAberto && (
                                    <ul className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[200px] overflow-y-auto rounded-[10px] border border-[#D9D9D9] bg-white shadow-lg scrollbar-sutil">
                                        <li className="sticky top-0 z-10 border-b border-[#E8E8E8] bg-white">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDropdownAberto(false);
                                                    setNovoParceiroAberto(true);
                                                }}
                                                className="w-full px-4 py-2.5 text-left text-[14px] font-normal text-[#4696AD] transition-colors hover:bg-[#F5F5F5]"
                                            >
                                                + Novo Parceiro
                                            </button>
                                        </li>
                                        {parceirosFiltrados.length === 0 ? (
                                            <li className="px-4 py-3 text-[14px] font-light text-[#898C8F]">
                                                Nenhum parceiro disponível para esta categoria
                                            </li>
                                        ) : (
                                            parceirosFiltrados.map((parceiro) => (
                                                <li
                                                    key={parceiro.id}
                                                    onClick={() =>
                                                        adicionarParceiroNaTabela(parceiro)
                                                    }
                                                    className="cursor-pointer px-4 py-2.5 text-[14px] font-light text-[#404040] transition-colors hover:bg-[#F5F5F5]"
                                                >
                                                    {parceiro.nome}
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* TABELA DE CUSTOS (VISUAL REFATORADO AO PADRÃO DA FICHA TECNICA) */}
                        <div className="mb-6 hidden w-full lg:block">
                            <div
                                className="grid h-10 items-center text-center font-normal text-[#4696AD]"
                                style={{
                                    gridTemplateColumns: gridTemplateColumnsTabela,
                                }}
                            >
                                <div className="h-10 rounded-tl-[10px] border-r-[0.5px] border-[#7B7D80] bg-[#C9EAF6] px-4 py-2.5">
                                    Parceiro
                                </div>
                                <div className="h-10 border-r-[0.5px] border-[#7B7D80] bg-[#C9EAF6] px-4 py-2.5">
                                    Operação
                                </div>
                                {linhasTabela.length > 1 && (
                                    <div className="h-10 border-r-[0.5px] border-[#7B7D80] bg-[#C9EAF6] px-4 py-2.5">
                                        Total de peças
                                    </div>
                                )}
                                <div className="h-10 border-r-[0.5px] border-[#7B7D80] bg-[#C9EAF6] px-4 py-2.5">
                                    Preço Unitário
                                </div>
                                <div className="h-10 rounded-tr-[10px] bg-[#C9EAF6] px-4 py-2.5">
                                    Custo Total
                                </div>
                            </div>

                            <div className="relative">
                                <div
                                    ref={tabelaScrollRef}
                                    className="max-h-[180px] overflow-y-auto overflow-x-hidden scrollbar-sutil"
                                    onScroll={(e) => setTabelaScrollTop(e.currentTarget.scrollTop)}
                                >
                                    {linhasTabela.length > 0 ? (
                                        linhasTabela.map((row, index) => {
                                            const isLastRow = index === linhasTabela.length - 1;

                                            return (
                                                <div
                                                    key={row.id}
                                                    className="grid min-h-[40px] h-[40px] items-stretch"
                                                    style={{
                                                        gridTemplateColumns:
                                                            gridTemplateColumnsTabela,
                                                    }}
                                                    onMouseEnter={() =>
                                                        setHoveredParceiroIndex(index)
                                                    }
                                                    onMouseLeave={() =>
                                                        setHoveredParceiroIndex(null)
                                                    }
                                                >
                                                    <div
                                                        className={`min-w-0 flex items-center justify-center px-4 ${
                                                            index % 2 === 1
                                                                ? "bg-[#F4F4F4]"
                                                                : "bg-[#FFFFFF]"
                                                        }`}
                                                        style={{
                                                            borderTopWidth: "0px",
                                                            borderLeftWidth: "0.5px",
                                                            borderRightWidth: "0.5px",
                                                            borderBottomWidth: "0.5px",
                                                            borderColor: "#D9D9D9",
                                                            borderBottomLeftRadius: isLastRow
                                                                ? "10px"
                                                                : "0px",
                                                            borderRightColor: "#7B7D80",
                                                        }}
                                                    >
                                                        <span className="cursor-not-allowed select-none truncate text-[14px] font-light text-[#898C8F]">
                                                            {row.nome}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={`min-w-0 flex items-center justify-center px-2 ${
                                                            index % 2 === 1
                                                                ? "bg-[#F4F4F4]"
                                                                : "bg-[#FFFFFF]"
                                                        }`}
                                                        style={{
                                                            borderTopWidth: "0px",
                                                            borderLeftWidth: "0px",
                                                            borderRightWidth: "0.5px",
                                                            borderBottomWidth: "0.5px",
                                                            borderColor: "#D9D9D9",
                                                            borderRightColor: "#7B7D80",
                                                        }}
                                                    >
                                                        <input
                                                            value={row.operacao}
                                                            onChange={(e) =>
                                                                atualizarCampoLinha(
                                                                    row.id,
                                                                    "operacao",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="-"
                                                            className="h-[32px] w-full border-0 bg-transparent text-center text-[14px] font-light text-[#898C8F] outline-none focus:ring-0"
                                                        />
                                                    </div>

                                                    {linhasTabela.length > 1 && (
                                                        <div
                                                            className={`min-w-0 flex items-center justify-center px-2 ${
                                                                index % 2 === 1
                                                                    ? "bg-[#F4F4F4]"
                                                                    : "bg-[#FFFFFF]"
                                                            }`}
                                                            style={{
                                                                borderTopWidth: "0px",
                                                                borderLeftWidth: "0px",
                                                                borderRightWidth: "0.5px",
                                                                borderBottomWidth: "0.5px",
                                                                borderColor: "#D9D9D9",
                                                                borderRightColor: "#7B7D80",
                                                            }}
                                                        >
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={formatarQuantidadeCampo(
                                                                    row.quantidade,
                                                                )}
                                                                onChange={(e) =>
                                                                    alterarQuantidade(
                                                                        row.id,
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                placeholder="0"
                                                                className="h-[32px] w-full border-0 bg-transparent text-center text-[14px] font-light text-[#898C8F] outline-none placeholder:text-[#D3D3D3] focus:ring-0"
                                                            />
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`min-w-0 flex items-center justify-center px-2 ${
                                                            index % 2 === 1
                                                                ? "bg-[#F4F4F4]"
                                                                : "bg-[#FFFFFF]"
                                                        }`}
                                                        style={{
                                                            borderTopWidth: "0px",
                                                            borderLeftWidth: "0px",
                                                            borderRightWidth: "0.5px",
                                                            borderBottomWidth: "0.5px",
                                                            borderColor: "#D9D9D9",
                                                        }}
                                                    >
                                                        <input
                                                            type="text"
                                                            value={row.precoUnitarioFormatado}
                                                            onChange={(e) =>
                                                                atualizarCampoLinha(
                                                                    row.id,
                                                                    "precoUnitarioFormatado",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="R$ 0,00"
                                                            className="h-[32px] w-full border-0 bg-transparent text-center text-[14px] font-light text-[#898C8F] outline-none focus:ring-0"
                                                        />
                                                    </div>

                                                    <div
                                                        className={`min-w-0 flex items-center justify-center px-2 ${
                                                            index % 2 === 1
                                                                ? "bg-[#F4F4F4]"
                                                                : "bg-[#FFFFFF]"
                                                        } ${isLastRow ? "rounded-br-[10px]" : ""}`}
                                                        style={{
                                                            borderTopWidth: "0px",
                                                            borderLeftWidth: "0px",
                                                            borderRightWidth: "0.5px",
                                                            borderBottomWidth: "0.5px",
                                                            borderColor: "#D9D9D9",
                                                            borderBottomRightRadius: isLastRow
                                                                ? "10px"
                                                                : "0px",
                                                        }}
                                                    >
                                                        <input
                                                            type="text"
                                                            value={row.custoTotalFormatado}
                                                            onChange={(e) =>
                                                                atualizarCampoLinha(
                                                                    row.id,
                                                                    "custoTotalFormatado",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="R$ 0,00"
                                                            className="h-[32px] w-full border-0 bg-transparent text-center text-[14px] font-light text-[#898C8F] outline-none focus:ring-0"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div
                                            className="rounded-b-[10px] bg-white px-4 py-5 text-center text-[13px] text-[#888]"
                                            style={{
                                                borderLeft: "0.5px solid #D9D9D9",
                                                borderRight: "0.5px solid #D9D9D9",
                                                borderBottom: "0.5px solid #D9D9D9",
                                            }}
                                        >
                                            Nenhum custo lançado ainda.
                                        </div>
                                    )}
                                </div>

                                {/* Lixeira Interativa Suspensa (Fora da Tabela) */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 w-0 overflow-visible">
                                    {linhasTabela.map((row, index) => {
                                        const isVisible = hoveredParceiroIndex === index;
                                        const top = index * 40 + 20 - tabelaScrollTop;
                                        return (
                                            <button
                                                key={`trash-${row.id}-${index}`}
                                                type="button"
                                                onClick={() => removerParceiroDaTabela(row.id)}
                                                onMouseEnter={() => setHoveredParceiroIndex(index)}
                                                onMouseLeave={() => setHoveredParceiroIndex(null)}
                                                className={`pointer-events-auto absolute z-20 rounded p-1 transition-opacity ${
                                                    isVisible ? "opacity-100" : "opacity-0"
                                                }`}
                                                style={{
                                                    top,
                                                    right: "-28px",
                                                    transform: "translateY(-50%)",
                                                    width: "28px",
                                                    height: "28px",
                                                }}
                                                title="Remover parceiro"
                                            >
                                                <img
                                                    src="/excluir-cinza-claro.png"
                                                    alt="Remover parceiro"
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "contain",
                                                        display: "block",
                                                    }}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* CARTÕES DE PARCEIROS (TABLET E MOBILE) */}
                        <div className="mb-6 flex flex-col gap-3 lg:hidden">
                            {linhasTabela.length > 0 ? (
                                linhasTabela.map((row) => (
                                    <div
                                        key={row.id}
                                        className="rounded-[16px] border border-[#D5E4EA] p-3.5 md:rounded-[14px] md:p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <div
                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E4F3F8] text-[13px] font-medium text-[#1F6C85] md:hidden"
                                                    aria-hidden="true"
                                                >
                                                    {obterIniciais(row.nome)}
                                                </div>
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="truncate text-[16px] font-medium text-[#404040]">
                                                        {row.nome}
                                                    </span>
                                                    <span className="text-[12px] text-[#6B6E72] md:text-[13px]">
                                                        {etapaConcluida.nome}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 flex-col items-end">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    aria-label={`Custo total de ${row.nome}`}
                                                    value={row.custoTotalFormatado}
                                                    onChange={(e) =>
                                                        atualizarCampoLinha(
                                                            row.id,
                                                            "custoTotalFormatado",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="R$ 0,00"
                                                    className="w-[120px] rounded-[8px] border border-transparent bg-transparent px-1 text-right text-[17px] font-medium text-[#1F6C85] outline-none focus:border-[#4696AD] md:w-[140px]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removerParceiroDaTabela(row.id)}
                                                    aria-label={`Remover ${row.nome}`}
                                                    className="-mr-1 mt-0.5 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#F5F5F5]"
                                                >
                                                    <img
                                                        src="/excluir-cinza-claro.png"
                                                        alt=""
                                                        className="h-4 w-4 object-contain"
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <div
                                            className={`mt-3 grid gap-2.5 ${
                                                linhasTabela.length > 1
                                                    ? "grid-cols-2 md:grid-cols-3"
                                                    : "grid-cols-2"
                                            }`}
                                        >
                                            <label
                                                className={`flex flex-col gap-1 text-[12px] text-[#6B6E72] md:text-[13px] ${
                                                    linhasTabela.length > 1
                                                        ? "col-span-2 md:col-span-1"
                                                        : ""
                                                }`}
                                            >
                                                Operação
                                                <input
                                                    value={row.operacao}
                                                    onChange={(e) =>
                                                        atualizarCampoLinha(
                                                            row.id,
                                                            "operacao",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="-"
                                                    className={CAMPO_CARTAO}
                                                />
                                            </label>

                                            {linhasTabela.length > 1 && (
                                                <label className="flex flex-col gap-1 text-[12px] text-[#6B6E72] md:text-[13px]">
                                                    Total de peças
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={formatarQuantidadeCampo(
                                                            row.quantidade,
                                                        )}
                                                        onChange={(e) =>
                                                            alterarQuantidade(
                                                                row.id,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0"
                                                        className={`${CAMPO_CARTAO} placeholder:text-[#D3D3D3]`}
                                                    />
                                                </label>
                                            )}

                                            <label className="flex flex-col gap-1 text-[12px] text-[#6B6E72] md:text-[13px]">
                                                Preço unitário
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={row.precoUnitarioFormatado}
                                                    onChange={(e) =>
                                                        atualizarCampoLinha(
                                                            row.id,
                                                            "precoUnitarioFormatado",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="R$ 0,00"
                                                    className={CAMPO_CARTAO}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-[14px] border border-[#D5E4EA] px-4 py-5 text-center text-[13px] text-[#888]">
                                    Nenhum custo lançado ainda.
                                </div>
                            )}
                        </div>

                        {/* RELATÓRIO DE ACABAMENTO (PERDAS) */}
                        {isUltimaEtapa && (
                            <RelatorioDeAcabamento
                                defeitoCostura={relatorioPerdas.defeitoCostura}
                                defeitoTecido={relatorioPerdas.defeitoTecido}
                                retiradas={relatorioPerdas.retiradas}
                                sobras={relatorioPerdas.sobras}
                                onChange={handleChangeRelatorioPerdas}
                                variant="modal"
                                responsivo
                            />
                        )}

                        {/* MENSAGEM DE VALIDAÇÃO (SE QUANTIDADE NÃO BATER E > 1 PARCEIRO) */}
                        {!quantidadeValida && linhasTabela.length > 0 && (
                            <div className="mb-6 mt-6 rounded-[10px] border border-amber-200 bg-amber-50 p-4 text-[14px] font-light text-amber-800">
                                <span className="font-medium">Atenção:</span> A soma das peças (
                                <span className="font-medium text-[#D75757]">
                                    {somaQuantidades}
                                </span>
                                ) não corresponde ao total da Ficha ({fichaTecnica.quantidade}).
                            </div>
                        )}

                        {!precoUnitarioValido && (
                            <div className="mb-6 mt-6 rounded-[10px] border border-red-200 bg-red-50 p-4 text-[14px] font-light text-red-700">
                                <span className="font-medium">Atenção:</span>{" "}
                                {montarAvisoPrecoInvalido(
                                    parceirosComPrecoInvalido.map((linha) => linha.nome),
                                )}
                            </div>
                        )}

                        {!perdasValidas && (
                            <div className="mb-6 mt-6 rounded-[10px] border border-red-200 bg-red-50 p-4 text-[14px] font-light text-red-700">
                                A soma das perdas ({totalPerdas}) não pode ultrapassar a quantidade
                                da ficha ({fichaTecnica.quantidade}).
                            </div>
                        )}

                        {submitError && (
                            <div
                                className="mb-2 mt-4 rounded-[10px] border border-red-200 bg-red-50 p-4 text-[14px] font-light text-red-700"
                                role="alert"
                            >
                                {submitError}
                            </div>
                        )}

                        {/* FOOTER / AÇÕES FINAIS DO MODAL (DESKTOP) */}
                        <div className="hidden justify-end pt-4 lg:flex">
                            <button
                                type="button"
                                onClick={handleTransferir}
                                disabled={
                                    submitting ||
                                    !quantidadeValida ||
                                    !precoUnitarioValido ||
                                    !perdasValidas
                                }
                                className={`h-[39px] w-[200px] rounded-full px-10 text-[15px] font-normal transition-all ${
                                    !quantidadeValida || !precoUnitarioValido || !perdasValidas
                                        ? "cursor-not-allowed border border-[#D9D9D9] bg-[#F5F5F5] text-[#898C8F]"
                                        : "bg-[#A9E2F2] text-[#4696AD] hover:bg-[#A2DCED] active:scale-95"
                                }`}
                            >
                                {submitting ? "Processando..." : "Transferir"}
                            </button>
                        </div>

                        {/* No celular, empurra o rodapé para o fim da tela */}
                        <div className="min-h-6 flex-1 md:hidden" aria-hidden="true" />

                        {/* RODAPÉ FIXO (TABLET E MOBILE) */}
                        <div className="sticky -bottom-4 z-20 -mx-4 -mb-4 flex flex-col gap-3 border-t border-[#EEEEEE] bg-white px-4 pb-4 pt-3 shadow-[0_-6px_16px_rgba(0,0,0,0.06)] md:-bottom-8 md:-mx-8 md:-mb-8 md:mt-6 md:flex-row md:items-center md:gap-6 md:px-8 md:py-4 lg:hidden">
                            <div className="flex items-end justify-between gap-6 md:flex-1 md:items-center">
                                {linhasTabela.length > 1 && (
                                    <div className="flex flex-col gap-1.5 md:flex-1">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                            <span className="text-[12px] text-[#6B6E72] md:text-[14px]">
                                                Soma das peças
                                            </span>
                                            <span
                                                className={`text-[15px] font-medium ${
                                                    quantidadeValida
                                                        ? "text-[#3F7A12]"
                                                        : "text-[#D75757]"
                                                }`}
                                            >
                                                {quantidadeValida && "✓ "}
                                                {somaQuantidades} de {fichaTecnica?.quantidade}
                                            </span>
                                        </div>
                                        <div className="hidden h-2 rounded-full bg-[#E3EEF2] md:block">
                                            <div
                                                className={`h-2 rounded-full ${
                                                    quantidadeValida
                                                        ? "bg-[#7FB82E]"
                                                        : "bg-[#D75757]"
                                                }`}
                                                style={{
                                                    width: `${calcularPercentualSoma(
                                                        somaQuantidades,
                                                        fichaTecnica?.quantidade,
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="ml-auto flex flex-col items-end md:ml-0 md:items-start">
                                    <span className="text-[12px] text-[#6B6E72] md:text-[13px]">
                                        Custo total
                                    </span>
                                    <span className="text-[18px] font-medium text-[#404040] md:text-[20px] md:font-normal">
                                        {formatCurrencyBR(custoTotalGeral)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleTransferir}
                                disabled={
                                    submitting ||
                                    !quantidadeValida ||
                                    !precoUnitarioValido ||
                                    !perdasValidas
                                }
                                className={`h-[52px] w-full rounded-full px-10 text-[16px] font-medium transition-all md:h-[48px] md:w-[180px] md:shrink-0 ${
                                    !quantidadeValida || !precoUnitarioValido || !perdasValidas
                                        ? "cursor-not-allowed border border-[#D9D9D9] bg-[#F5F5F5] text-[#898C8F]"
                                        : "bg-[#A9E2F2] text-[#165A72] hover:bg-[#A2DCED] active:scale-95"
                                }`}
                            >
                                {submitting ? "Processando..." : "Transferir"}
                            </button>
                        </div>
                    </>
                )}
            </div>

            <NovoParceiroModal
                isOpen={novoParceiroAberto}
                onClose={() => setNovoParceiroAberto(false)}
                categoria={etapaConcluida?.nome}
                onSuccess={aoCadastrarParceiro}
            />
        </div>
    );
}
