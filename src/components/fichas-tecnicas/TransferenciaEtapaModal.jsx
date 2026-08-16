import React, { useState, useEffect, useRef, useMemo } from "react";
import { getAllEtapasByFabricoId } from "../../services/etapaService";
import { getParceirosByFabrico } from "../../services/parceiroService";
import {
    createParceiroProduto,
    getProdutoParceiro,
    updateParceiroProdutoPrice,
} from "../../services/fichaTecnicaItemService";
import {
    finalizarFichaEtapa,
    getFichaEtapaByFichaTecnica,
    updateEtapaFichaTecnica,
} from "../../services/fichasTecnicasService";

import {
    getFichaParceiroByFicha,
    createFichaTecnicaParceiro,
    updateFichaTecnicaParceiro,
} from "../../services/fichaParceiroService";
import { createFichaEtapa } from "../../services/fichaEtapaService";

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

function getEffectiveQuantity(line, totalLines, fichaQuantidade) {
    if (totalLines === 1) return Number(fichaQuantidade || 0);
    return Number(line?.quantidade || 0);
}
import { InlineLoading, SkeletonBox } from "../geral/Loading";

function TransferenciaEtapaLoading() {
    return (
        <div className="px-4 py-2">
            <div className="flex justify-center pb-7">
                <InlineLoading label="Carregando modal de transferência" />
            </div>

            <div className="mb-9 w-full overflow-hidden pb-3">
                <div className="flex items-center justify-center px-2">
                    {[0, 1, 2, 3].map((item) => (
                        <React.Fragment key={item}>
                            <div className="flex flex-col items-center gap-3">
                                <SkeletonBox className="h-[83px] w-[83px] rounded-[30px]" />
                                <SkeletonBox className="h-[16px] w-[72px] rounded-[8px]" />
                            </div>
                            {item < 3 && (
                                <SkeletonBox className="mx-1 mb-8 h-[2px] w-[60px] rounded-none" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <SkeletonBox className="mb-2 h-[18px] w-[230px] rounded-[8px]" />
                <SkeletonBox className="h-[39px] w-[45%] max-w-[320px] rounded-[10px]" />
            </div>

            <div className="mb-6 w-full">
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

            <div className="flex justify-end pt-4">
                <SkeletonBox className="h-[39px] w-[200px] rounded-full" />
            </div>
        </div>
    );
}

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
    const [parceirosIniciais, setParceirosIniciais] = useState([]);

    // Estados para o comportamento visual da nova tabela
    const [hoveredParceiroIndex, setHoveredParceiroIndex] = useState(null);
    const [tabelaScrollTop, setTabelaScrollTop] = useState(0);

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

    const somaQuantidades = useMemo(() => {
        return linhasTabela.reduce((acc, curr) => acc + Number(curr.quantidade || 0), 0);
    }, [linhasTabela]);

    const quantidadeValida = useMemo(() => {
        if (linhasTabela.length <= 1) return true;
        return somaQuantidades === Number(fichaTecnica?.quantidade || 0);
    }, [linhasTabela.length, somaQuantidades, fichaTecnica?.quantidade]);

    const precoUnitarioValido = useMemo(() => {
        return linhasTabela.every(
            (linha) => parseCurrencyToNumber(linha.precoUnitarioFormatado) > 0,
        );
    }, [linhasTabela]);

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
                // 1. Buscar todas as etapas do fabrico
                const listaEtapas = await getAllEtapasByFabricoId(fabricoId);
                const ativasEOrdenadas = listaEtapas
                    .filter((e) => e.ativa)
                    .sort((a, b) => a.ordem - b.ordem);
                setEtapas(ativasEOrdenadas);

                // 2. Buscar parceiros do fabrico filtrando pela categoria da etapa concluída
                const listaParceiros = await getParceirosByFabrico(fabricoId);
                const filtradosPorCategoria = listaParceiros.filter(
                    (p) => p.categoria?.toLowerCase() === etapaConcluida?.nome?.toLowerCase(),
                );
                setParceirosDisponiveis(filtradosPorCategoria);

                // 3. Buscar parceiros já associados a esta Ficha Técnica
                const parceirosExistentesRaw = await getFichaParceiroByFicha(fichaTecnica.id);
                const parceirosExistentes = Array.isArray(parceirosExistentesRaw)
                    ? parceirosExistentesRaw
                    : [];

                setParceirosIniciais(parceirosExistentes);

                const jaVinculadosDestaEtapa = parceirosExistentes
                    .filter(
                        (fp) =>
                            fp?.parceiro?.categoria?.toLowerCase() ===
                            etapaConcluida?.nome?.toLowerCase(),
                    )
                    .map((fp) => {
                        const quantidade = Number(fp?.quantidade || fichaTecnica?.quantidade || 0);

                        // o backend pode devolver "valor" ou "custo";
                        const valorBruto = Number(fp?.valor ?? fp?.custo ?? 0);

                        // se o valor recebido for o total, o unitário é o total dividido pela quantidade
                        const precoUnitario = quantidade > 0 ? valorBruto / quantidade : 0;

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
        fichaTecnica?.id,
        fichaTecnica?.quantidade,
        etapaConcluida?.id,
        etapaConcluida?.nome,
        proximaEtapa?.id,
        proximaEtapa?.nome,
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

    // --- Submit / Processamento da Transferência ---
    const handleTransferir = async () => {
        if (!quantidadeValida) {
            return;
        }

        setSubmitting(true);
        try {
            if (linhasTabela.length > 0) {
                for (const [, linha] of linhasTabela.entries()) {
                    const totalLinhas = linhasTabela.length;
                    const quantidadeEfetiva = getEffectiveQuantity(
                        linha,
                        totalLinhas,
                        fichaTecnica?.quantidade,
                    );
                    const precoUnitario = parseCurrencyToNumber(linha.precoUnitarioFormatado);
                    const custoTotal = precoUnitario * quantidadeEfetiva;

                    // Passos de Negócio mapeados:
                    // 1 - Ver se existe parceiro_produto
                    const parceiroProdutoExistente = await getProdutoParceiro(
                        fichaTecnica.produto_id,
                        linha.id,
                    );

                    if (parceiroProdutoExistente) {
                        // 1. Atualizar preço da relação parceiro_produto
                        await updateParceiroProdutoPrice(
                            linha.id,
                            fichaTecnica.produto_id,
                            precoUnitario,
                        );
                    } else {
                        // 2. Criar relação parceiro_produto
                        await createParceiroProduto(
                            linha.id,
                            fichaTecnica.produto_id,
                            precoUnitario,
                        );
                    }

                    const payloadCusto = {
                        operacao: linha.operacao,
                        custo: custoTotal,
                        quantidade: quantidadeEfetiva,
                    };

                    // Analisa se a relação já existia antes de fazer qualquer requisição
                    const parceiroJaExistia = parceirosIniciais.some((p) => {
                        const idEncontrado = p?.parceiro?.id ?? p?.parceiro_id ?? p?.id ?? null;
                        return idEncontrado === linha.id;
                    });

                    if (parceiroJaExistia) {
                        // Se já existia, atualiza
                        await updateFichaTecnicaParceiro(fichaTecnica.id, linha.id, payloadCusto);
                    } else {
                        // Se não existia, cria
                        await createFichaTecnicaParceiro({
                            ficha_id: fichaTecnica.id,
                            parceiro_id: linha.id,
                            ...payloadCusto,
                        });
                    }
                }
            }

            const fichasEtapas = await getFichaEtapaByFichaTecnica(fichaTecnica.id);
            const fichaEtapaConcluida = fichasEtapas.find(
                (fe) => fe.etapa_id === etapaConcluida?.id,
            );

            if (fichaEtapaConcluida) {
                await finalizarFichaEtapa(fichaEtapaConcluida.id);
            }

            // 4. Iniciar a nova etapa do fluxo
            await createFichaEtapa({
                ficha_tecnica_id: fichaTecnica.id,
                etapa_id: proximaEtapa.id,
                data_inicio: new Date().toISOString(),
            });

            // 5. Atualizar etapa_atual_id da ficha técnica para refletir a nova etapa
            await updateEtapaFichaTecnica(fichaTecnica.id, proximaEtapa.id);

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Falha ao processar a transferência de etapa:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 font-['Outfit']">
            {/* CONTAINER PRINCIPAL DO MODAL */}
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-white p-8 shadow-2xl rounded-[24px]">
                {/* CABEÇALHO DO MODAL */}
                <div className="mb-8 flex items-start justify-between">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <img
                                src="/transferencia.png"
                                alt="Ícone"
                                className="h-6 w-6 object-contain"
                            />
                            <h2 className="text-[22px] font-light leading-none text-[#404040]">
                                Transferência para {proximaEtapa.nome}
                            </h2>
                        </div>

                        <div className="ml-9 mt-1 text-[14px] font-light leading-none text-[#7B7D80]">
                            {[
                                fichaTecnica?.pedido?.numero
                                    ? `Nº${fichaTecnica.pedido.numero}`
                                    : null,
                                fichaTecnica?.numero
                                    ? `Ficha Técnica: ${fichaTecnica.numero}`
                                    : null,
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

                    <button onClick={onClose} className="rounded-full p-2 transition-colors">
                        <img src="/fechar-cinza.png" alt="Fechar" className="h-3 w-3 opacity-50" />
                    </button>
                </div>

                {loading ? (
                    <TransferenciaEtapaLoading />
                ) : (
                    <>
                        {/* BARRA DE PROGRESSÃO (ETAPAS) */}
                        <div
                            ref={etapasScrollRef}
                            onPointerDown={iniciarArrasteEtapas}
                            onPointerMove={moverArrasteEtapas}
                            onPointerUp={finalizarArrasteEtapas}
                            onPointerLeave={finalizarArrasteEtapas}
                            onPointerCancel={finalizarArrasteEtapas}
                            className="w-full overflow-x-auto overflow-y-hidden pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab select-none touch-pan-x"
                            style={{ msOverflowStyle: "none" }}
                        >
                            <div className="min-w-max flex items-center justify-center px-2 py-2">
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
                                                className="relative z-10 flex flex-col items-center gap-3 bg-white"
                                            >
                                                <div
                                                    className={`flex h-[83px] w-[83px] items-center justify-center rounded-[30px] border transition-all ${estiloCaixa}`}
                                                    title={etapa.descricao}
                                                >
                                                    {linkIcone && (
                                                        <img
                                                            src={linkIcone}
                                                            className="h-9 w-9 object-contain"
                                                        />
                                                    )}
                                                </div>
                                                <span
                                                    className={`absolute -bottom-7 whitespace-nowrap text-[16px] font-normal tracking-wide ${
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
                                                            className="z-0 mx-1 h-[2px] w-[60px] transition-all"
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

                            <div className="relative w-[45%] max-w-[320px]" ref={dropdownRef}>
                                <input
                                    type="text"
                                    value={buscaParceiro}
                                    onFocus={() => setDropdownAberto(true)}
                                    onChange={(e) => setBuscaParceiro(e.target.value)}
                                    placeholder="Colaborador"
                                    className="h-[39px] w-full rounded-[10px] border border-[#898C8F] bg-white px-4 text-[14px] text-[#404040] outline-none placeholder:text-[#898C8F] transition-all"
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
                                    <ul className="absolute left-0 right-0 top-[45px] z-50 max-h-[200px] overflow-y-auto rounded-[10px] border border-[#D9D9D9] bg-white shadow-lg scrollbar-sutil">
                                        {parceirosFiltrados.length === 0 ? (
                                            <li className="px-4 py-3 text-[14px] font-light text-[#898C8F]">
                                                Nenhum colaborador disponível para esta categoria
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
                        <div className="mb-6 w-full">
                            <div
                                className="grid h-10 items-center text-center font-normal text-[#4696AD]"
                                style={{
                                    gridTemplateColumns: gridTemplateColumnsTabela,
                                }}
                            >
                                <div className="h-10 rounded-tl-[10px] border-r-[0.5px] border-[#7B7D80] bg-[#C9EAF6] px-4 py-2.5">
                                    Colaborador
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
                                                                type="number"
                                                                min="0"
                                                                value={row.quantidade}
                                                                onChange={(e) => {
                                                                    const val = Math.max(
                                                                        0,
                                                                        parseInt(e.target.value) ||
                                                                            0,
                                                                    );
                                                                    atualizarCampoLinha(
                                                                        row.id,
                                                                        "quantidade",
                                                                        val,
                                                                    );
                                                                }}
                                                                placeholder="-"
                                                                className="h-[32px] w-full border-0 bg-transparent text-center text-[14px] font-light text-[#898C8F] outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
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

                        {/* MENSAGEM DE VALIDAÇÃO (SE QUANTIDADE NÃO BATER E > 1 COLABORADOR) */}
                        {!quantidadeValida && linhasTabela.length > 0 && (
                            <div className="mb-6 rounded-[10px] border border-amber-200 bg-amber-50 p-4 text-[14px] font-light text-amber-800">
                                <span className="font-medium">Atenção:</span> A soma das peças (
                                {somaQuantidades}) não corresponde ao total da Ficha (
                                {fichaTecnica.quantidade}).
                            </div>
                        )}

                        {!precoUnitarioValido && linhasTabela.length > 0 && (
                            <div className="mb-6 rounded-[10px] border border-red-200 bg-red-50 p-4 text-[14px] font-light text-red-700">
                                <span className="font-medium">Atenção:</span> Para prosseguir com a
                                transferência, cadastre o valor do(a){" "}
                                {etapaConcluida.nome.toUpperCase()};
                            </div>
                        )}

                        {/* FOOTER / AÇÕES FINAIS DO MODAL */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="button"
                                onClick={handleTransferir}
                                disabled={submitting || !quantidadeValida || !precoUnitarioValido}
                                className={`h-[39px] w-[200px] rounded-full px-10 text-[15px] font-normal transition-all ${
                                    !quantidadeValida || !precoUnitarioValido
                                        ? "cursor-not-allowed border border-[#D9D9D9] bg-[#F5F5F5] text-[#898C8F]"
                                        : "bg-[#A9E2F2] text-[#4696AD] hover:bg-[#A2DCED] active:scale-95"
                                }`}
                            >
                                {submitting ? "Processando..." : "Transferir"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
